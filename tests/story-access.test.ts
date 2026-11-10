import { describe, it, expect, vi } from "vitest";

vi.mock("@/actions/auth", () => ({ getCurrentSession: async () => ({ role: null, student: null }) }));
import { canReadStories } from "@/lib/story-access";
import { guestCard } from "@/lib/feed-card";

describe("login wall", () => {
  it("lets only students and admins read stories", () => {
    expect(canReadStories({ role: null, student: null })).toBe(false);
    expect(canReadStories(null)).toBe(false);
    expect(canReadStories({ role: "student", student: { id: "s1" } as never })).toBe(true);
    expect(canReadStories({ role: "admin", student: null })).toBe(true);
  });

  it("keeps only the headline, source, section and date for visitors", () => {
    const g = guestCard({
      id: "a", slug: "s", title: "শিরোনাম", summary: "সারসংক্ষেপ", aiSummary: "এআই", keyTakeaways: ["মূল"],
      factTable: [{ parameter: "p", value: "v", relevance: "r" }], featuredImage: "https://x/y.jpg",
      sourceUrl: "https://paper/story", sourceName: "প্রথম আলো", publishedAt: "১ নভে", category: { name: "জাতীয়", slug: "national" },
      quizQuestions: [{ id: "q", question: "?", options: [] }],
    });
    expect(g).toMatchObject({ title: "শিরোনাম", sourceName: "প্রথম আলো", publishedAt: "১ নভে", locked: true });
    expect(g.summary).toBe("");
    expect(g.aiSummary).toBeNull();
    expect(g.keyTakeaways).toEqual([]);
    expect(g.factTable).toEqual([]);
    expect(g.featuredImage).toBe("");
    expect(g.sourceUrl).toBeNull();
    expect(g.quizQuestions).toEqual([]);
  });
});
