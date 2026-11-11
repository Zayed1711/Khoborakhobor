// The daily goal game: a ring that fills up, XP, levels and the streak.
// Pure functions only (no database), so they are easy to test.

export interface DayCounts {
  stories: number;
  mcqs: number;
  mcqsCorrect: number;
  words: number;
  lookups: number;
}

export type TaskKey = "stories" | "mcqs" | "words" | "lookups";
export interface GoalTask {
  key: TaskKey;
  target: number;
}

/** Premium: 3 stories + 5 MCQs + 1 saved word. Free: 3 stories + 1 dictionary look-up. */
export function goalFor(isPremium: boolean): GoalTask[] {
  return isPremium
    ? [
        { key: "stories", target: 3 },
        { key: "mcqs", target: 5 },
        { key: "words", target: 1 },
      ]
    : [
        { key: "stories", target: 3 },
        { key: "lookups", target: 1 },
      ];
}

/** 0-100: how full the ring is. Every unit of every task weighs the same. */
export function goalPercent(counts: DayCounts, goal: GoalTask[]): number {
  const total = goal.reduce((n, t) => n + t.target, 0);
  if (!total) return 0;
  const done = goal.reduce((n, t) => n + Math.min(Math.max(counts[t.key], 0), t.target), 0);
  return Math.round((done / total) * 100);
}

export function goalDone(counts: DayCounts, goal: GoalTask[]): boolean {
  return goal.every((t) => counts[t.key] >= t.target);
}

export const GOAL_BONUS_XP = 50;

/** XP for one day. Capped per activity, so tapping the same thing again and again earns nothing. */
export function dayXp(counts: DayCounts, done: boolean): number {
  return (
    10 * Math.min(counts.stories, 10) +
    2 * Math.min(counts.mcqs, 20) +
    3 * Math.min(counts.mcqsCorrect, 20) +
    5 * Math.min(counts.words, 5) +
    1 * Math.min(counts.lookups, 10) +
    (done ? GOAL_BONUS_XP : 0)
  );
}

export const LEVELS = [
  { xp: 0, bn: "নবীন পাঠক", en: "New Reader" },
  { xp: 200, bn: "নিয়মিত পাঠক", en: "Regular Reader" },
  { xp: 600, bn: "মনোযোগী শিক্ষার্থী", en: "Focused Learner" },
  { xp: 1500, bn: "জ্ঞানসন্ধানী", en: "Knowledge Seeker" },
  { xp: 3000, bn: "প্রস্তুত যোদ্ধা", en: "Exam Warrior" },
  { xp: 6000, bn: "সেরা প্রস্তুত", en: "Top Prepared" },
] as const;

export interface LevelInfo {
  level: number; // 1-based
  bn: string;
  en: string;
  /** XP where the next level starts, or null at the top level */
  nextAt: number | null;
  /** 0-100 towards the next level */
  progress: number;
}

export function levelFor(xp: number): LevelInfo {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
  const next = LEVELS[i + 1];
  const progress = next ? Math.round(((xp - LEVELS[i].xp) / (next.xp - LEVELS[i].xp)) * 100) : 100;
  return { level: i + 1, bn: LEVELS[i].bn, en: LEVELS[i].en, nextAt: next ? next.xp : null, progress };
}

/** Bangladesh calendar date ("2026-11-11"). Bangladesh is UTC+6 all year. */
export function bdDay(now: Date | number = Date.now()): string {
  const ms = typeof now === "number" ? now : now.getTime();
  return new Date(ms + 6 * 3600_000).toISOString().slice(0, 10);
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(day + "T00:00:00Z") + n * 86400_000).toISOString().slice(0, 10);
}

/** One free streak freeze per 7 days. */
export function freezeAvailable(today: string, lastFreezeDay: string | null | undefined): boolean {
  return !lastFreezeDay || addDays(lastFreezeDay, 7) <= today;
}

/**
 * The streak after today's first activity.
 *  - active yesterday: +1
 *  - missed exactly one day and the weekly freeze is free: +1, freeze used
 *  - otherwise: back to 1
 * lastActiveDay = the last day with any activity before today (null = never).
 */
export function nextStreak(
  current: number,
  today: string,
  lastActiveDay: string | null,
  lastFreezeDay: string | null | undefined
): { streak: number; usedFreeze: boolean } {
  const base = Math.max(current, 0);
  if (lastActiveDay === today) return { streak: Math.max(base, 1), usedFreeze: false };
  if (lastActiveDay === addDays(today, -1)) return { streak: base + 1, usedFreeze: false };
  if (lastActiveDay === addDays(today, -2) && freezeAvailable(today, lastFreezeDay)) {
    return { streak: base + 1, usedFreeze: true };
  }
  return { streak: 1, usedFreeze: false };
}
