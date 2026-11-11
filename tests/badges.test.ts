import { describe, expect, it } from "vitest";
import { badgesFor } from "@/lib/study/badges";

const zero = { streak: 0, goalDays: 0, stories: 0, mcqs: 0, words: 0, level: 1 };

describe("badges", () => {
  it("a new student has none", () => {
    expect(badgesFor(zero).filter((b) => b.earned)).toHaveLength(0);
  });
  it("earns by reaching the number, with progress on the way", () => {
    const b = Object.fromEntries(badgesFor({ ...zero, streak: 7, stories: 25, goalDays: 1 }).map((x) => [x.id, x]));
    expect(b["streak-3"].earned).toBe(true);
    expect(b["streak-7"].earned).toBe(true);
    expect(b["streak-30"].earned).toBe(false);
    expect(b["stories-50"].progress).toBe(50);
    expect(b["goal-1"].earned).toBe(true);
    expect(b["first-story"].progress).toBe(100);
  });
});
