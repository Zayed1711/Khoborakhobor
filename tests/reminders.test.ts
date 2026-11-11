import { describe, expect, it } from "vitest";
import { goalFor } from "@/lib/study/daily-goal";
import { dueKinds, examReminder, mainReminder, remainingText, rescueReminder, type ReaderState } from "@/lib/study/reminders";

const goal = goalFor(true);
const counts = (o: Partial<Record<"stories" | "mcqs" | "words", number>> = {}) => ({ stories: 0, mcqs: 0, mcqsCorrect: 0, words: 0, lookups: 0, ...o });
const state = (o: Partial<ReaderState> = {}): ReaderState => ({ streak: 5, streakAlive: true, activeToday: false, done: false, percent: 0, counts: counts(), goal, ...o });
const teaser = { question: "নতুন মজুরি বোর্ড গঠনের প্রজ্ঞাপন কোন মন্ত্রণালয় জারি করেছে?", slug: "abc-1" };

describe("reminder messages", () => {
  it("sends nothing once the goal is done", () => {
    expect(mainReminder(state({ done: true, activeToday: true }), teaser, 0)).toBeNull();
  });
  it("shows what is left when the reader already started", () => {
    const m = mainReminder(state({ activeToday: true, percent: 44, counts: counts({ stories: 2, mcqs: 2 }) }), teaser, 0)!;
    expect(m.title).toContain("৪৪%");
    expect(m.body).toContain("১টি খবর, ৩টি MCQ ও ১টি শব্দ");
  });
  it("warns about the streak when nothing was read today", () => {
    expect(mainReminder(state(), teaser, 0)!.title).toContain("৫ দিনের স্ট্রিক");
  });
  it("uses a real question for new or logged-out readers, opening that story", () => {
    const m = mainReminder(state({ streak: null, streakAlive: false }), teaser, 0)!;
    expect(m.body).toContain(teaser.question);
    expect(m.url).toBe("/article/abc-1");
    expect(mainReminder(state({ streak: 1 }), null, 0)!.url).toBe("/capsule");
  });
  it("rescue is only for a streak that would break tonight", () => {
    expect(rescueReminder(state())).not.toBeNull();
    expect(rescueReminder(state({ activeToday: true }))).toBeNull();
    expect(rescueReminder(state({ streak: 1 }))).toBeNull();
    expect(rescueReminder(state({ streak: null }))).toBeNull();
    expect(rescueReminder(state({ streakAlive: false }))).toBeNull();
  });
  it("remaining text and exam text", () => {
    expect(remainingText(counts({ stories: 3, mcqs: 5 }), goal)).toBe("১টি শব্দ");
    expect(remainingText(counts({ stories: 3, mcqs: 5, words: 1 }), goal)).toBe("");
    expect(examReminder("সাপ্তাহিক পরীক্ষা ১৩").url).toBe("/exam");
  });
});

describe("when a reminder is due", () => {
  const day = "2026-11-13";
  const clock = (o = {}) => ({ reminderHour: 20, sentDay: null as string | null, sentKinds: [] as string[], ...o });
  it("main at the chosen hour, caught up one hour later, never twice", () => {
    expect(dueKinds(clock(), day, 19, false)).toEqual([]);
    expect(dueKinds(clock(), day, 20, false)).toEqual(["main"]);
    expect(dueKinds(clock(), day, 21, false)).toEqual(["main"]);
    expect(dueKinds(clock({ sentDay: day, sentKinds: ["main"] }), day, 21, false)).toEqual([]);
    expect(dueKinds(clock({ sentDay: "2026-11-12", sentKinds: ["main", "rescue"] }), day, 20, false)).toEqual(["main"]);
  });
  it("rescue at 10 pm, exam on exam morning, never more than 2 a day", () => {
    expect(dueKinds(clock({ sentDay: day, sentKinds: ["main"] }), day, 22, false)).toEqual(["rescue"]);
    expect(dueKinds(clock({ reminderHour: 22 }), day, 22, false)).toEqual(["main"]);
    expect(dueKinds(clock(), day, 7, true)).toEqual(["exam"]);
    expect(dueKinds(clock(), day, 7, false)).toEqual([]);
    expect(dueKinds(clock({ sentDay: day, sentKinds: ["exam", "main"] }), day, 22, false)).toEqual([]);
  });
});
