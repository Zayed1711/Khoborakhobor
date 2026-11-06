import { describe, expect, it } from "vitest";
import { ENGLISH_TOPICS } from "@/lib/study/topics";
import { WRITING_MAX_WORDS, WRITING_MIN_WORDS, wordCount, writingPromptFor } from "@/lib/study/writing-prompts";

describe("writing task prompts", () => {
  it("every topic has a prompt", () => {
    for (const t of ENGLISH_TOPICS) expect(writingPromptFor(t, "abc").length).toBeGreaterThan(40);
  });

  it("a story always gets the same prompt", () => {
    expect(writingPromptFor("Economy", "story-1")).toBe(writingPromptFor("Economy", "story-1"));
  });

  it("different stories on a topic can get different prompts", () => {
    const seen = new Set(Array.from({ length: 30 }, (_, i) => writingPromptFor("Education", `id-${i}`)));
    expect(seen.size).toBeGreaterThan(1);
  });

  it("counts words and keeps sensible limits", () => {
    expect(wordCount("  In my opinion,\n exams   are fair. ")).toBe(6);
    expect(wordCount("")).toBe(0);
    expect(WRITING_MIN_WORDS).toBeLessThan(WRITING_MAX_WORDS);
  });
});
