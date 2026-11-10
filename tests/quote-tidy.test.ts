import { describe, it, expect } from "vitest";
import { splitSentences, quotesBalanced, tidyQuotes } from "@/lib/study/extractive";
import { publisherName } from "@/lib/feed-card";

describe("quoted lines read whole", () => {
  it("does not end a sentence at a full stop inside a quotation", () => {
    const text =
      "সোনিয়া লিখেছেন, ‘সেটা ২০১০ সাল। প্রণব তখন ইঙ্গিত দেন যে শীর্ষ পদে পরিবর্তনের সময় হয়েছে।’ তিনি এটিকে প্রধানমন্ত্রী হওয়ার ইচ্ছা হিসেবে দেখেছিলেন। পরের বাক্যটি এখানে আলাদা করে লেখা হয়েছে।";
    const s = splitSentences(text);
    expect(s.some((x) => x.endsWith("‘সেটা ২০১০ সাল।"))).toBe(false);
    expect(s[0]).toContain("’");
    expect(s.every(quotesBalanced)).toBe(true);
  });

  it("treats an English apostrophe as fine", () => {
    expect(quotesBalanced("The minister didn’t comment on the board’s decision.")).toBe(true);
    expect(quotesBalanced("He said “the plan is ready.")).toBe(false);
  });

  it("drops fact rows that repeat a key point and lines with an open quotation", () => {
    const k = ["প্রথম মূল কথা, সম্পূর্ণ বাক্য।", "‘খোলা উদ্ধৃতি যা বন্ধ হয়নি।"];
    const f = [
      { parameter: "তারিখ", value: "২০১০", relevance: "প্রথম মূল কথা, সম্পূর্ণ বাক্য।" },
      { parameter: "সংখ্যা", value: "৪২", relevance: "আলাদা একটি বাক্য, ৪২ বছর আগে।" },
      { parameter: "সংখ্যা", value: "৫", relevance: "‘আরেকটি খোলা উদ্ধৃতি ৫ জন।" },
    ];
    const t = tidyQuotes(k, f);
    expect(t.keyTakeaways).toEqual(["প্রথম মূল কথা, সম্পূর্ণ বাক্য।"]);
    expect(t.factTable.map((r) => r.value)).toEqual(["৪২"]);
  });
});

describe("publisher name", () => {
  it("drops the feed label in brackets", () => {
    expect(publisherName("প্রথম আলো (শীর্ষ সংবাদ ও জাতীয়)")).toBe("প্রথম আলো");
    expect(publisherName("The Daily Star")).toBe("The Daily Star");
  });
});

import { extractFacts } from "@/lib/study/extractive";
describe("fact sheet and key points", () => {
  it("keeps an older story's sheet rather than emptying it", () => {
    const k = ["একটি মূল কথা, ২০১০ সালের ঘটনা।"];
    const f = [{ parameter: "তারিখ", value: "২০১০", relevance: "একটি মূল কথা, ২০১০ সালের ঘটনা।" }];
    expect(tidyQuotes(k, f).factTable).toHaveLength(1);
  });
  it("new stories: facts come from sentences that are not key points", () => {
    const body = "সরকার ২০২৬ সালে নতুন মজুরি বোর্ড গঠন করেছে বলে জানানো হয়েছে। বোর্ডে মোট ১২ জন সদস্য রাখা হয়েছে বলে মন্ত্রণালয় জানায়।";
    const all = extractFacts("মজুরি বোর্ড গঠন", body);
    const avoided = extractFacts("মজুরি বোর্ড গঠন", body, [all[0].relevance]);
    expect(avoided.some((r) => r.relevance === all[0].relevance)).toBe(false);
    expect(avoided.length).toBeGreaterThan(0);
  });
});

import { standsAlone } from "@/lib/study/extractive";
describe("a key point must make sense on its own", () => {
  it("rejects sentences that point back", () => {
    for (const s of [
      "এই জাহাজের মালিক ছিলেন মরিয়ম-উজ-জামানি নামে এক নারী।",
      "সুতরাং ৩–এর চেয়ে বড় প্রতিটি মৌলিক সংখ্যা এই আকারের।",
      "এবার উচ্চমাধ্যমিক পরীক্ষায়ও জিপিএ-৫ পেয়েছেন তিনি।",
      "Labour and Employment Minister Ariful Haque Choudhury said this.",
      "শ্রম ও কর্মসংস্থানমন্ত্রী আরিফুল হক চৌধুরী এ কথা বলেছেন।",
      "However, the board did not give a date.",
    ]) expect(standsAlone(s), s).toBe(false);
  });
  it("accepts sentences that name their subject", () => {
    for (const s of [
      "রাজধানীর মিরপুর–১০ নম্বর এলাকায় পুলিশের সঙ্গে শ্রমিকদের সংঘর্ষ হয়েছে।",
      "রফিকুল চট্টগ্রাম সরকারি মডেল স্কুল অ্যান্ড কলেজ থেকে পরীক্ষা দেন।",
      "The fee is Tk 150 per paper.",
      "Five platoons of Border Guard Bangladesh have been deployed.",
    ]) expect(standsAlone(s), s).toBe(true);
  });
});
