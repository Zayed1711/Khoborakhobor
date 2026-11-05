import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupConceptDictionary } from "@/lib/dictionary-engine";

/**
 * The AI lexicon must show only what its dictionary sources return, never filler,
 * and never a bare transliteration as if it were a translation. Network calls are
 * simulated, so these tests run offline.
 */

function mockFetch(handler: (url: string) => unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const body = handler(String(url));
      if (body instanceof Error) throw body;
      return { ok: true, json: async () => body } as Response;
    })
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("AI lexicon", () => {
  it("answers curated terms without any network call", async () => {
    mockFetch(() => new Error("network should not be used"));
    const e = await lookupConceptDictionary("মূল্যস্ফীতি");
    expect(e.banglaMeaning.length).toBeGreaterThan(10);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("matches an inflected form of a curated term", async () => {
    mockFetch(() => new Error("network should not be used"));
    const base = await lookupConceptDictionary("মূল্যস্ফীতি");
    const inflected = await lookupConceptDictionary("মূল্যস্ফীতির");
    expect(inflected.banglaMeaning).toBe(base.banglaMeaning);
  });

  it("does not return a different term's entry for a short query", async () => {
    mockFetch(() => ({}));
    const e = await lookupConceptDictionary("নীতি");
    expect(e.term).not.toBe("মুদ্রানীতি");
  });

  it("says 'not found' for a made-up word instead of a transliteration", async () => {
    mockFetch((url) =>
      url.includes("translate.googleapis.com") ? [[["Xvanthalam", "ক্স্বন্থলম"]]] : { query: { pages: { "-1": {} } } }
    );
    const e = await lookupConceptDictionary("ক্স্বন্থলম");
    expect(e.banglaMeaning).toContain("পাওয়া যায়নি");
    expect(e.banglaMeaning).not.toContain("Xvanthalam");
    expect(e.realLifeExample).toBe("");
  });

  it("uses a real translation with synonyms and adds no filler sentence", async () => {
    mockFetch((url) => {
      if (url.includes("sl=bn&tl=en")) return [[["Salary", "বেতন"]], [["noun", ["salary", "pay", "wages"]]]];
      if (url.includes("sl=en&tl=en")) return [null, [["noun", [["a fixed regular payment", null, "He received a salary."]]]]];
      return { query: { pages: { "-1": {} } } };
    });
    const e = await lookupConceptDictionary("বেতন");
    expect(e.banglaMeaning).toContain("Salary");
    expect(e.banglaMeaning).not.toContain("গুরুত্বপূর্ণ ধারণা");
    expect(e.simplifiedMeaning).toContain("a fixed regular payment");
  });

  it("does not remember a failed lookup, so it works again once the network is back", async () => {
    mockFetch(() => new Error("offline"));
    const offline = await lookupConceptDictionary("অবকাঠামোগত");
    expect(offline.banglaMeaning).toContain("পাওয়া যায়নি");
    mockFetch((url) => (url.includes("sl=bn&tl=en") ? [[["Structural", "অবকাঠামোগত"]], [["adjective", ["structural"]]]] : { query: { pages: { "-1": {} } } }));
    const online = await lookupConceptDictionary("অবকাঠামোগত");
    expect(online.banglaMeaning).toContain("Structural");
  });
});
