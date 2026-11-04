import net from "net";

/**
 * Basic SSRF guard for server-side fetches of feed and article URLs.
 * Rejects non-http(s) schemes and hosts that are, or literally point at, loopback,
 * private, link-local (cloud metadata) or otherwise internal addresses.
 *
 * Note: this checks the hostname as written; it does not resolve DNS, so a public
 * name that resolves to a private IP is not caught. Feed URLs can only be added by
 * admins, which keeps that residual risk small.
 */

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
  const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

export function isPublicHttpUrl(raw: string | undefined | null): boolean {
  if (!raw) return false;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;

  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) return false;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return false;
  }

  const ipVersion = net.isIP(host);
  if (ipVersion === 4) return !isPrivateIPv4(host);
  if (ipVersion === 6) return !isPrivateIPv6(host);

  // Bare numeric / hex hosts that some resolvers treat as IPv4 (e.g. "2130706433", "0x7f000001")
  if (/^(0x[0-9a-f]+|\d+)$/i.test(host)) return false;

  return true;
}

export function assertPublicHttpUrl(raw: string | undefined | null): void {
  if (!isPublicHttpUrl(raw)) {
    throw new Error("অনুমোদিত নয় এমন URL (শুধুমাত্র পাবলিক http/https ঠিকানা গ্রহণযোগ্য)।");
  }
}
