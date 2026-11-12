// Remembers that someone is in the middle of an email-code step (sign-up verification or
// password reset). Phones often reload a page when you leave it to open the mail app; without
// this the code screen was gone when the reader came back and they had to start again.
// Only the email address and an expiry time are kept, on this device, for 30 minutes.

export type PendingKind = "verify" | "reset";

const KEY: Record<PendingKind, string> = { verify: "kk_pending_verify", reset: "kk_pending_reset" };
const TTL_MS = 30 * 60_000;

export function rememberPending(kind: PendingKind, email: string): void {
  try {
    localStorage.setItem(KEY[kind], JSON.stringify({ email, until: Date.now() + TTL_MS }));
  } catch {
    // storage blocked: the screen simply is not restored
  }
}

export function clearPending(kind: PendingKind): void {
  try {
    localStorage.removeItem(KEY[kind]);
  } catch {
    // nothing to clear
  }
}

/** The email waiting for its code, or null when there is none or it is too old. */
export function readPending(kind: PendingKind): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY[kind]) || "null") as { email?: unknown; until?: unknown } | null;
    if (!v || typeof v.email !== "string" || typeof v.until !== "number") return null;
    if (Date.now() > v.until) {
      localStorage.removeItem(KEY[kind]);
      return null;
    }
    return v.email;
  } catch {
    return null;
  }
}
