import { describe, expect, it } from "vitest";
import { toFeedCard } from "@/lib/feed-card";
import { knownBengaliTitle, translateContentToBengaliHtml, translateSummaryToBengali, translateTitleToBengali } from "@/lib/bilingual";

const article = {
  id: "a1",
  slug: "story-1",
  title: "মিরপুরে পুলিশের সঙ্গে পোশাকশ্রমিকদের সংঘর্ষ",
  summary: "শ্রমিকেরা সড়ক অবরোধ করেন।",
  content: "<p>পুরো প্রতিবেদনের লেখা, যা কখনো ব্রাউজারে যাবে না।</p>",
  keyTakeaways: ["একটি উদ্ধৃত বাক্য।"],
  factTable: [
    { parameter: "সংখ্যা ও পরিমাণ", value: "৩০ হাজার টাকা", relevance: "ন্যূনতম মাসিক বেতন ৩০ হাজার টাকা করার দাবি।" },
    { parameter: "টেমপ্লেট", value: "অর্থ মন্ত্রণালয়", relevance: "" },
  ],
  sourceName: "প্রথম আলো",
  sourceUrl: "https://www.prothomalo.com/story-1",
  examTags: null,
  featuredImage: "",
  imageCaption: null,
  publishedAt: "১ নভে, ২০২৬",
  readTime: "২ মিনিট",
  isCapsule: true,
  isLead: false,
  createdAt: new Date("2026-11-01T06:00:00Z"),
  category: { name: "জাতীয় পরিক্রমা", slug: "national" },
  quizQuestions: [
    { id: "q1", question: "প্রশ্ন?", options: JSON.stringify(["ক", "খ", "গ", "ঘ"]), correctOption: 2, explanation: "ব্যাখ্যা", sourceSentence: "উৎস বাক্য।", origin: "extracted" },
  ],
};

describe("toFeedCard (what the browser receives)", () => {
  const card = toFeedCard(article) as unknown as Record<string, unknown>;

  it("never includes the publisher's full text", () => {
    expect("content" in card).toBe(false);
    expect(JSON.stringify(card)).not.toContain("পুরো প্রতিবেদনের লেখা");
  });

  it("never includes quiz answers or explanations", () => {
    const json = JSON.stringify(card);
    expect(json).not.toContain("correctOption");
    expect(json).not.toContain("ব্যাখ্যা");
  });

  it("keeps only fact rows that quote their source sentence", () => {
    const facts = card.factTable as { value: string }[];
    expect(facts.map((f) => f.value)).toEqual(["৩০ হাজার টাকা"]);
  });
});

describe("bilingual helpers never fake a translation", () => {
  it("returns no Bengali headline for an unknown English headline", () => {
    expect(knownBengaliTitle("Former army officer Abdul Hafiz arrested")).toBeNull();
    expect(translateTitleToBengali("Former army officer Abdul Hafiz arrested")).toBe("Former army officer Abdul Hafiz arrested");
  });

  it("returns the original summary and body when no translation was saved", () => {
    expect(translateSummaryToBengali("T", "Original summary")).toBe("Original summary");
    expect(translateContentToBengaliHtml("<p>Original</p>")).toBe("<p>Original</p>");
  });

  it("uses a saved translation when there is one", () => {
    expect(knownBengaliTitle("Any title", "সংরক্ষিত অনুবাদ")).toBe("সংরক্ষিত অনুবাদ");
  });
});
