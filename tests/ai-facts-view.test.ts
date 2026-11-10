import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { aiSummaryOf, factCardOf } from "@/lib/study/ai-facts-view";

const row = {
  status: "ok",
  summary: "সরকার নতুন মজুরি বোর্ড গঠন করেছে।",
  who: JSON.stringify(["শ্রম মন্ত্রণালয়"]),
  what: "মজুরি বোর্ড গঠন",
  whenText: "",
  whereText: "ঢাকা",
  numbers: JSON.stringify([{ label: "ন্যূনতম মজুরি", value: "১২,৫০০ টাকা" }]),
  gkCategory: "Economy & Finance",
  examScore: 8,
};

afterEach(() => {
  delete process.env.AI_FACTS;
});

describe("what the site shows from AI facts", () => {
  it("shows nothing unless AI_FACTS=on", () => {
    for (const mode of [undefined, "off", "shadow"]) {
      if (mode) process.env.AI_FACTS = mode;
      else delete process.env.AI_FACTS;
      expect(aiSummaryOf(row)).toBeNull();
      expect(factCardOf(row)).toBeNull();
    }
  });

  it("shows a checked answer when on", () => {
    process.env.AI_FACTS = "on";
    expect(aiSummaryOf(row)).toBe(row.summary);
    const card = factCardOf(row)!;
    expect(card.who).toEqual(["শ্রম মন্ত্রণালয়"]);
    expect(card.numbers).toHaveLength(1);
    expect(card.examScore).toBe(8);
  });

  it("never shows a failed answer, a missing row or an empty card", () => {
    process.env.AI_FACTS = "on";
    expect(aiSummaryOf({ ...row, status: "failed" })).toBeNull();
    expect(factCardOf({ ...row, status: "failed" })).toBeNull();
    expect(aiSummaryOf(null)).toBeNull();
    expect(factCardOf({ ...row, who: "[]", what: "", whereText: "", numbers: "not json" })).toBeNull();
  });
});

import { aiKeyQuotesOf } from "@/lib/study/ai-facts-view";
describe("AI-picked key points on the site", () => {
  it("used only when on, passed, and at least two", () => {
    const r = { ...row, keyQuotes: JSON.stringify(["এক।", "দুই।"]) };
    expect(aiKeyQuotesOf(r)).toBeNull();
    process.env.AI_FACTS = "on";
    expect(aiKeyQuotesOf(r)).toEqual(["এক।", "দুই।"]);
    expect(aiKeyQuotesOf({ ...row, keyQuotes: JSON.stringify(["এক।"]) })).toBeNull();
    expect(aiKeyQuotesOf({ ...r, status: "failed" })).toBeNull();
  });
});
