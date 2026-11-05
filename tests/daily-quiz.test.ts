import { describe, expect, it, vi } from "vitest";

// daily-feed reads the database through this action; the quiz rule itself needs no database
vi.mock("@/actions/articles", () => ({ getPublishedArticles: async () => [] }));

import { pickSyllabusDailyQuiz } from "@/lib/study/daily-feed";
import type { RankedCard } from "@/lib/study/daily-selection";

function raw(id: string, title: string, sentence: string) {
  return {
    id,
    slug: id,
    title,
    sourceUrl: `https://www.prothomalo.com/${id}`,
    sourceName: "প্রথম আলো",
    category: { name: "জাতীয়", slug: "national" },
    quizQuestions: [
      { id: `q-${id}`, question: "প্রশ্ন _____?", options: ["ক", "খ", "গ", "ঘ"], correctOption: 0, explanation: "", sourceSentence: sentence, origin: "extracted" },
    ],
  } as any;
}
const ranked = (id: string, tier: "urgent" | "more") => ({ id, dailyTier: tier }) as unknown as RankedCard;

describe("daily quiz challenge", () => {
  const budget = raw("a", "বাজেট ঘোষণা", "এবারের বাজেটে রাজস্ব আদায়ের লক্ষ্য ৫ লাখ কোটি টাকা।");
  const fluff = raw("b", "উৎসবে মানুষের ঢল", "উৎসবে প্রায় ২ হাজার মানুষ অংশ নেন।");
  const notShown = raw("c", "মুদ্রানীতি ঘোষণা", "নতুন মুদ্রানীতিতে নীতি সুদহার ১০ শতাংশ রাখা হয়েছে।");

  it("uses a quiz whose own sentence is a syllabus fact, from one of the ten", () => {
    const q = pickSyllabusDailyQuiz([fluff, budget], [ranked("b", "urgent"), ranked("a", "urgent")], "bn");
    expect(q?.articleSlug).toBe("a");
  });

  it("never uses a story that is not in the ten, even a syllabus one", () => {
    const q = pickSyllabusDailyQuiz([fluff, notShown], [ranked("b", "urgent"), ranked("c", "more")], "bn");
    expect(q).toBeUndefined();
  });

  it("shows no quiz rather than a trivia question", () => {
    expect(pickSyllabusDailyQuiz([fluff], [ranked("b", "urgent")], "bn")).toBeUndefined();
  });

  it("falls back to a ten-story whose headline is a syllabus topic", () => {
    const policy = raw("d", "নতুন মুদ্রানীতি ঘোষণা", "ঘোষণার সময় উপস্থিত ছিলেন ১২ জন।");
    expect(pickSyllabusDailyQuiz([policy], [ranked("d", "urgent")], "bn")?.articleSlug).toBe("d");
  });
});
