import { describe, expect, it, vi } from "vitest";

// session.ts imports cookies() from next/headers, which only exists inside a request
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined }), headers: async () => new Map() }));

import { sanitizeArticleHtml, textToParagraphHtml } from "@/lib/sanitize-html";
import { isPublicHttpUrl } from "@/lib/url-safety";
import { decodeSession, encodeSession, safeEqual } from "@/lib/session";

describe("sanitizeArticleHtml", () => {
  const cases: [string, string][] = [
    ["<p>a<script>alert(1)</script>b</p>", "<p>ab</p>"],
    ["<p><img src=x onerror=alert(1)>text</p>", "<p>text</p>"],
    ["<div><svg onload=alert(1)></svg><p>keep</p></div>", "<p>keep</p>"],
    ['<p onclick="x()">hi</p>', "<p>hi</p>"],
    ["<!-- c --><p>x</p>", "<p>x</p>"],
  ];
  it.each(cases)("removes dangerous markup: %s", (input, expected) => {
    expect(sanitizeArticleHtml(input)).toBe(expected);
  });

  it("drops javascript: links but keeps http(s) links", () => {
    const out = sanitizeArticleHtml('<p><a href=" JaVaScRiPt:alert(1)">x</a> <a href="https://ok.com">ok</a></p>');
    expect(out).not.toMatch(/javascript/i);
    expect(out).toContain('href="https://ok.com"');
  });

  it("escapes plain text when building paragraphs", () => {
    expect(textToParagraphHtml("a <b>")).toBe("<p>a &lt;b&gt;</p>");
  });
});

describe("isPublicHttpUrl (SSRF guard)", () => {
  it.each(["https://bbc.com/feed", "https://www.prothomalo.com/x"])("allows %s", (u) => {
    expect(isPublicHttpUrl(u)).toBe(true);
  });
  it.each([
    "http://127.0.0.1/",
    "http://169.254.169.254/latest",
    "http://localhost:3000",
    "file:///etc/passwd",
    "http://[::1]/",
    "http://10.1.2.3",
    "http://2130706433/",
    "https://user:pw@x.com",
  ])("blocks %s", (u) => {
    expect(isPublicHttpUrl(u)).toBe(false);
  });
});

describe("signed session cookie", () => {
  const future = Math.floor(Date.now() / 1000) + 60;

  it("round-trips a valid session", () => {
    const tok = encodeSession({ sid: "abc", role: "student", exp: future })!;
    expect(decodeSession(tok)).toMatchObject({ sid: "abc", role: "student" });
  });

  it("rejects a forged role, a tampered signature, a plain cookie and an expired token", () => {
    const tok = encodeSession({ sid: "abc", role: "student", exp: future })!;
    const sig = tok.split(".")[1];
    const forged = Buffer.from(JSON.stringify({ sid: "abc", role: "admin", exp: future })).toString("base64url") + "." + sig;
    expect(decodeSession(forged)).toBeNull();
    expect(decodeSession(tok.slice(0, -2) + "aa")).toBeNull();
    expect(decodeSession("admin")).toBeNull();
    expect(decodeSession(encodeSession({ sid: "a", role: "student", exp: 1 }))).toBeNull();
  });

  it("compares secrets in constant time", () => {
    expect(safeEqual("a", "a")).toBe(true);
    expect(safeEqual("a", "b")).toBe(false);
  });
});
