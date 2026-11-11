"use server";

import { prisma } from "@/lib/prisma";
import { getSessionStudent } from "@/lib/guards";
import { hasPremiumGoal } from "@/lib/study/progress";
import { addDays, bdDay, freezeAvailable, goalFor, goalPercent, levelFor, type DayCounts, type GoalTask, type LevelInfo } from "@/lib/study/daily-goal";

export interface TodayProgress {
  loggedIn: boolean;
  counts: DayCounts;
  goal: GoalTask[];
  percent: number;
  done: boolean;
  /** 0 when the streak has already been lost */
  streak: number;
  /** Today already counts towards the streak */
  activeToday: boolean;
  freezeReady: boolean;
  xp: number;
  todayXp: number;
  level: LevelInfo;
}

const EMPTY: DayCounts = { stories: 0, mcqs: 0, mcqsCorrect: 0, words: 0, lookups: 0 };

/** Today's ring, streak, XP and level for the logged-in student. */
export async function getTodayProgressAction(): Promise<TodayProgress> {
  const student = await getSessionStudent().catch(() => null);
  if (!student) {
    return { loggedIn: false, counts: EMPTY, goal: goalFor(true), percent: 0, done: false, streak: 0, activeToday: false, freezeReady: false, xp: 0, todayXp: 0, level: levelFor(0) };
  }
  const today = bdDay();
  const [row, sum, last, me, premium] = await Promise.all([
    prisma.dailyProgress.findUnique({ where: { studentId_day: { studentId: student.id, day: today } } }),
    prisma.dailyProgress.aggregate({ where: { studentId: student.id }, _sum: { xp: true } }),
    prisma.dailyProgress.findFirst({ where: { studentId: student.id, day: { lt: today } }, orderBy: { day: "desc" }, select: { day: true } }),
    prisma.student.findUnique({ where: { id: student.id }, select: { streakDays: true, streakFreezeDay: true } }),
    hasPremiumGoal(student.id),
  ]);
  const counts: DayCounts = row
    ? { stories: row.stories, mcqs: row.mcqs, mcqsCorrect: row.mcqsCorrect, words: row.words, lookups: row.lookups }
    : EMPTY;
  const goal = goalFor(premium);
  const xp = sum._sum.xp ?? 0;
  const freezeReady = freezeAvailable(today, me?.streakFreezeDay);
  // No earlier day at all = a student from before the game, who keeps the streak they had
  const alive = !!row || !last || last.day === addDays(today, -1) || (last.day === addDays(today, -2) && freezeReady);
  return {
    loggedIn: true,
    counts,
    goal,
    percent: goalPercent(counts, goal),
    done: row?.goalDone ?? false,
    streak: alive ? me?.streakDays ?? 0 : 0,
    activeToday: !!row,
    freezeReady,
    xp,
    todayXp: row?.xp ?? 0,
    level: levelFor(xp),
  };
}
