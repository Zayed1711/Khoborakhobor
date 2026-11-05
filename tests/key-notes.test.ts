import { describe, expect, it } from "vitest";
import { buildDayNotes, dhakaDay, formatDay, notesToText, pickKeyPoint, readSavedNotes, saveNotesJson } from "@/lib/study/key-notes";

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
    expect(pickKeyPoint(card({ title: "বাজেটে রাজস্ব আদায়ের নতুন লক্ষ্য", keyTakeaways: [plain, fact] }))).toBe(fact);
  });

  it("avoids a sentence that only makes sense with the one before it", () => {
    const dependent = "তবে এটি কিনতে বিনিয়োগকারীকে দিতে হবে ৮ লাখ ৪ হাজার ৯৬১ টাকা।";
    const selfContained = "বাংলাদেশ ব্যাংক নতুন ট্রেজারি বন্ডের সুদহার ১০ শতাংশ নির্ধারণ করেছে।";
    expect(pickKeyPoint(card({ title: "ট্রেজারি বন্ডের সুদহার বাড়াল বাংলাদেশ ব্যাংক", keyTakeaways: [dependent, selfContained] }))).toBe(selfContained);
  });

  it("states the story's main theme, not a side detail with a figure", () => {
    const title = "দুর্ঘটনায় হারিয়েছিলেন দুই হাত, পা দিয়ে লিখেই পেলেন জিপিএ-৫";
    const side = "প্রতিদিন যাতায়াতে প্রায় ১০০ টাকা খরচ হতো।";
    const theme = "দুর্ঘটনায় দুই হাত হারানো রফিকুল ইসলাম পা দিয়ে লিখে এবারের এইচএসসিতে জিপিএ-৫ পেয়েছেন।";
    expect(pickKeyPoint(card({ title, keyTakeaways: [side, theme] }))).toBe(theme);
  });

  it("uses the summary when it is the sentence that states the theme", () => {
    const title = "আলিম পরীক্ষায় ২০২৭ অংশ নিতে শিক্ষার্থীদের বিশেষ সুযোগ";
    const summary = "২০২৭ সালের আলিম পরীক্ষায় অংশ নিতে ইচ্ছুক বাদ পড়া শিক্ষার্থীদের অনলাইন রেজিস্ট্রেশনের সুযোগ দেওয়া হয়েছে।";
    const fee = "নিয়মিত শিক্ষার্থীর রেজিস্ট্রেশনসহ অন্যান্য ফি ৬৮৫ টাকা এবং অনিয়মিতদের ৮৩৫ টাকা।";
    expect(pickKeyPoint(card({ title, summary, keyTakeaways: [fee] }))).toBe(summary);
  });

  it("avoids the writer's opinion and first-person anecdotes", () => {
    const title = "প্রধানমন্ত্রীর জাপান সফর: কোথায় সম্ভাবনা, কোথায় পরীক্ষা";
    const opinion = "প্রধানমন্ত্রীর জাপান সফরকেও এই মানদণ্ডে বিচার করা প্রয়োজন।";
    const anecdote = "আমি জাপান সফরের সময় প্রধানমন্ত্রীর সঙ্গে ছিলাম, সেদিন খুব বৃষ্টি হচ্ছিল।";
    const fact = "জাপান সফরে প্রধানমন্ত্রীর উপস্থিতিতে ছয়টি সহযোগিতা দলিল সই হয়েছে।";
    expect(pickKeyPoint(card({ title, keyTakeaways: [opinion, anecdote, fact] }))).toBe(fact);
  });

  it("gives no note when nothing in the story shares the headline's subject", () => {
    expect(pickKeyPoint(card({ title: "মোন্নাফের জিপিএ-৫", keyTakeaways: ["বাজারে চালের দাম কেজিতে ৫ টাকা বেড়েছে বলে জানিয়েছেন ব্যবসায়ীরা।"] }))).toBeNull();
  });

  it("returns nothing rather than a weak or cut-off line", () => {
    expect(pickKeyPoint(card({ keyTakeaways: ["ছোট বাক্য।"], summary: "সারাংশের শুরু..." }))).toBeNull();
  });
});

describe("buildDayNotes", () => {
  it("skips a point that repeats an earlier story's point", () => {
    const a = "ন্যূনতম মাসিক বেতন ৩০ হাজার টাকা করার দাবিতে মিরপুর–১০ নম্বর মোড়ের সড়ক অবরোধ করেন শ্রমিকেরা।";
    const b = "ন্যূনতম মাসিক বেতন ৩০ হাজার টাকা করার দাবিতে রাজধানীর মিরপুর–১০ নম্বর মোড়ে অবরোধ করেন শ্রমিকেরা।";
    const title = "৩০ হাজার টাকা মজুরির দাবিতে মিরপুরে শ্রমিকদের অবরোধ";
    const notes = buildDayNotes([card({ slug: "a", title, keyTakeaways: [a] }), card({ slug: "b", title, keyTakeaways: [b] })]);
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

describe("saved notes", () => {
  it("rebuilds notes saved by an older rule once, and keeps current ones", () => {
    const item = { rank: 1, slug: "s", title: "t", point: "p", sourceName: "", category: "" };
    expect(readSavedNotes(JSON.stringify([item]))).toBeNull(); // old format: rebuild
    expect(readSavedNotes(saveNotesJson([item]))).toEqual([item]); // current: keep
    expect(readSavedNotes("not json")).toBeNull();
  });
});
