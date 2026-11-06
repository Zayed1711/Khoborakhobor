import { describe, expect, it } from "vitest";
import { pickClientIp } from "@/lib/session";

const from = (h: Record<string, string>) => (name: string) => h[name] ?? null;

describe("visitor IP for rate limits", () => {
  it("trusts Cloudflare's header over anything the visitor sends", () => {
    expect(pickClientIp(from({ "cf-connecting-ip": "203.0.113.7", "x-forwarded-for": "1.2.3.4, 198.51.100.1" }))).toBe("203.0.113.7");
  });
  it("a faked first X-Forwarded-For entry cannot change the key", () => {
    const a = pickClientIp(from({ "x-forwarded-for": "9.9.9.9, 198.51.100.1" }));
    const b = pickClientIp(from({ "x-forwarded-for": "8.8.8.8, 198.51.100.1" }));
    expect(a).toBe("198.51.100.1");
    expect(b).toBe(a);
  });
  it("falls back to x-real-ip, then unknown", () => {
    expect(pickClientIp(from({ "x-real-ip": "192.0.2.5" }))).toBe("192.0.2.5");
    expect(pickClientIp(from({}))).toBe("unknown");
  });
});
