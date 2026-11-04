import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * Signed session cookie.
 *
 * The cookie value is `<base64url payload>.<base64url HMAC-SHA256>`, so the browser
 * can read it but cannot forge or alter it. The role stored here is only a hint;
 * callers must still re-check the student's role/status in the database.
 */

export const SESSION_COOKIE = "khobor_session";
const LEGACY_COOKIES = ["khobor_session_role", "khobor_student_id"];
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  /** Student id, or null for a passcode-only admin session */
  sid: string | null;
  role: "student" | "admin";
  /** Expiry, unix seconds */
  exp: number;
}

let warnedMissingSecret = false;

function getSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV !== "production") {
    // Stable dev-only fallback so local sessions survive restarts.
    return "khobor-dev-only-session-secret-do-not-use-in-production";
  }

  if (!warnedMissingSecret) {
    console.error("[SESSION] SESSION_SECRET (>= 32 chars) is not set. All logins are disabled until it is configured.");
    warnedMissingSecret = true;
  }
  return null;
}

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function encodeSession(payload: SessionPayload): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function decodeSession(value: string | undefined | null): SessionPayload | null {
  if (!value) return null;
  const secret = getSecret();
  if (!secret) return null;

  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const mac = value.slice(dot + 1);

  const expected = Buffer.from(sign(body, secret));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload || typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (payload.role !== "student" && payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

/** Read and verify the current request's session. Returns null outside a request. */
export async function readSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    return decodeSession(store.get(SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}

/** Issue a signed session cookie. Returns false if sessions are disabled (no secret). */
export async function writeSession(sid: string | null, role: "student" | "admin"): Promise<boolean> {
  const value = encodeSession({
    sid,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  if (!value) return false;

  const store = await cookies();
  store.set(SESSION_COOKIE, value, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
  });
  for (const legacy of LEGACY_COOKIES) store.delete(legacy);
  return true;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  for (const legacy of LEGACY_COOKIES) store.delete(legacy);
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// -------------------------------------------------------------
// Minimal in-memory rate limiter (per server instance)
// -------------------------------------------------------------
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count++;
  return bucket.count <= limit;
}

export async function clientKey(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
  } catch {
    return "unknown";
  }
}
