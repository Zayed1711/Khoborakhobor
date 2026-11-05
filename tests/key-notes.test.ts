import { describe, expect, it } from "vitest";
import { buildDayNotes, dhakaDay, formatDay, notesToText, pickKeyPoint } from "@/lib/study/key-notes";

const card = (over: Record<string, unknown>) =>
  ({
    slug: "s",
    title: "শিরোনাম",
    summary: "",
    sourceName: "প্রথম আলো",
    category: { name: "অর্থনীতি", slug: "economy" },
    keyTakeaways: [],
    factTable: [],
    dailyRank: 1,
    ...over,
  }) as never;

describe("pickKeyPoint", () => {
  it("prefers a syllabus sentence with a figure, quoted word for word", () => {
    const fact = "এবারের বাজেটে রাজস্ব আদায়ের লক্ষ্য ধরা হয়েছে ৫ লাখ কোটি টাকা।";
    const plain = "অনুষ্ঠানে বিভিন্ন শ্রেণি-পেশার মানুষ উপস্থিত ছিলেন বলে জানা গেছে।";
    expect(pickKeyPoint(card({ keyTakeaways: [plain, fact] }))).toBe(fact);
  });

  it("avoids a sentence that only makes sense with the one before it", () => {
    const dependent = "তবে এটি কিনতে বিনিয়োগকারীকে দিতে হবে ৮ লাখ ৪ হাজার ৯৬১ টাকা।";
    const selfContained = "বাংলাদেশ ব্যাংক নতুন ট্রেজারি বন্ডের সুদহার ১০ শতাংশ নির্ধারণ করেছে।";
    expect(pickKeyPoint(card({ keyTakeaways: [dependent, selfContained] }))).toBe(selfContained);
  });

  it("returns nothing rather than a weak or cut-off line", () => {
    expect(pickKeyPoint(card({ keyTakeaways: ["ছোট বাক্য।"], summary: "সারাংশের শুরু..." }))).toBeNull();
  });
});

describe("buildDayNotes", () => {
  it("skips a point that repeats an earlier story's point", () => {
    const a = "ন্যূনতম মাসিক বেতন ৩০ হাজার টাকা করার দাবিতে মিরপুর–১০ নম্বর মোড়ের সড়ক অবরোধ করেন শ্রমিকেরা।";
    const b = "ন্যূনতম মাসিক বেতন ৩০ হাজার টাকা করার দাবিতে রাজধানীর মিরপুর–১০ নম্বর মোড়ে অবরোধ করেন শ্রমিকেরা।";
    const notes = buildDayNotes([card({ slug: "a", keyTakeaways: [a] }), card({ slug: "b", keyTakeaways: [b] })]);
    expect(notes.map((n) => n.slug)).toEqual(["a"]);
    expect(notes[0].rank).toBe(1);
  });
});

describe("dates and text", () => {
  it("uses Bangladesh time for the day (UTC+6)", () => {
    expect(dhakaDay("2026-11-04T19:30:00Z")).toBe("2026-11-05");
    expect(dhakaDay("2026-11-04T17:30:00Z")).toBe("2026-11-04");
    expect(formatDay("2026-11-05")).toBe("৫ নভেম্বর ২০২৬");
  });

  it("builds copyable text with the headline, the point and the source", () => {
    const text = notesToText(
      [{ day: "2026-11-05", items: [{ rank: 1, slug: "s", title: "মজুরি বোর্ড গঠন", point: "সরকার ছয় সদস্যের মজুরি বোর্ড গঠন করেছে।", sourceName: "প্রথম আলো", category: "" }] }],
      "দৈনিক মূল নোট"
    );
    expect(text).toContain("৫ নভেম্বর ২০২৬");
    expect(text).toContain("১. মজুরি বোর্ড গঠন\n   সরকার ছয় সদস্যের মজুরি বোর্ড গঠন করেছে। (প্রথম আলো)");
  });
});
