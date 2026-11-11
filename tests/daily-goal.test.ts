import { describe, expect, it } from "vitest";
import { addDays, bdDay, dayXp, freezeAvailable, goalDone, goalFor, goalPercent, levelFor, nextStreak } from "@/lib/study/daily-goal";

const c = (o: Partial<Record<"stories" | "mcqs" | "mcqsCorrect" | "words" | "lookups", number>> = {}) => ({ stories: 0, mcqs: 0, mcqsCorrect: 0, words: 0, lookups: 0, ...o });

describe("daily goal", () => {
  it("fills the ring unit by unit and never past 100", () => {
    const g = goalFor(true);
    expect(goalPercent(c(), g)).toBe(0);
    expect(goalPercent(c({ stories: 3 }), g)).toBe(33);
    expect(goalPercent(c({ stories: 99, mcqs: 99, words: 99 }), g)).toBe(100);
    expect(goalDone(c({ stories: 3, mcqs: 5 }), g)).toBe(false);
    expect(goalDone(c({ stories: 3, mcqs: 5, words: 1 }), g)).toBe(true);
  });
  it("free goal needs no MCQs", () => {
    expect(goalDone(c({ stories: 3, lookups: 1 }), goalFor(false))).toBe(true);
  });
  it("caps XP so repeating one action cannot farm it", () => {
    expect(dayXp(c({ stories: 3, mcqs: 5, mcqsCorrect: 4, words: 1 }), true)).toBe(30 + 10 + 12 + 5 + 50);
    expect(dayXp(c({ mcqs: 500, mcqsCorrect: 500 }), false)).toBe(100);
  });
  it("levels", () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(200).level).toBe(2);
    expect(levelFor(100).progress).toBe(50);
    expect(levelFor(999999).nextAt).toBeNull();
  });
  it("uses the Bangladesh date", () => {
    expect(bdDay(Date.parse("2026-11-10T18:30:00Z"))).toBe("2026-11-11");
    expect(bdDay(Date.parse("2026-11-10T17:59:00Z"))).toBe("2026-11-10");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("streak: grows, freezes once a week, else restarts", () => {
    const t = "2026-11-11";
    expect(nextStreak(5, t, "2026-11-10", null)).toEqual({ streak: 6, usedFreeze: false });
    expect(nextStreak(5, t, "2026-11-09", null)).toEqual({ streak: 6, usedFreeze: true });
    expect(nextStreak(5, t, "2026-11-09", "2026-11-08")).toEqual({ streak: 1, usedFreeze: false });
    expect(nextStreak(5, t, "2026-11-08", null)).toEqual({ streak: 1, usedFreeze: false });
    expect(nextStreak(5, t, null, null)).toEqual({ streak: 1, usedFreeze: false });
    expect(freezeAvailable(t, "2026-11-04")).toBe(true);
  });
});
