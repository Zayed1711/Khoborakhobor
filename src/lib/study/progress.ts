import { prisma } from "@/lib/prisma";
import { bdDay, dayXp, goalDone, goalFor, nextStreak, type DayCounts } from "@/lib/study/daily-goal";

export type ProgressKind = "story" | "mcq" | "word" | "lookup";

/**
 * Until paid plans exist (after the free period) everyone has the full goal.
 * When the premium locks are built, this is the one place to check the student's plan.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function hasPremiumGoal(_studentId: string): Promise<boolean> {
  return true;
}

/**
 * Count one activity towards today's goal. Never throws: the game must not break
 * reading, quizzes or the dictionary.
 */
export async function recordProgress(studentId: string, kind: ProgressKind, opts: { correct?: boolean } = {}): Promise<void> {
  try {
    const today = bdDay();
    let row = await prisma.dailyProgress.findUnique({ where: { studentId_day: { studentId, day: today } } });

    if (!row) {
      // First activity today: move the streak
      const [student, last] = await Promise.all([
        prisma.student.findUnique({ where: { id: studentId }, select: { streakDays: true, streakFreezeDay: true } }),
        prisma.dailyProgress.findFirst({ where: { studentId }, orderBy: { day: "desc" }, select: { day: true } }),
      ]);
      if (!student) return;
      // Students from before the game have no rows yet: they keep the streak they had
      const keep = !last;
      const { streak, usedFreeze } = nextStreak(student.streakDays, today, last?.day ?? null, student.streakFreezeDay);
      row = await prisma.dailyProgress.upsert({
        where: { studentId_day: { studentId, day: today } },
        create: { studentId, day: today },
        update: {},
      });
      await prisma.student.update({
        where: { id: studentId },
        data: {
          streakDays: keep ? Math.max(student.streakDays, 1) : streak,
          lastActive: new Date(),
          ...(usedFreeze && !keep ? { streakFreezeDay: today } : {}),
        },
      });
    }

    const counts: DayCounts = {
      stories: row.stories + (kind === "story" ? 1 : 0),
      mcqs: row.mcqs + (kind === "mcq" ? 1 : 0),
      mcqsCorrect: row.mcqsCorrect + (kind === "mcq" && opts.correct ? 1 : 0),
      words: row.words + (kind === "word" ? 1 : 0),
      lookups: row.lookups + (kind === "lookup" ? 1 : 0),
    };
    const done = row.goalDone || goalDone(counts, goalFor(await hasPremiumGoal(studentId)));
    await prisma.dailyProgress.update({
      where: { id: row.id },
      data: { ...counts, goalDone: done, xp: dayXp(counts, done) },
    });
  } catch {
    // the game is a bonus; the activity itself already succeeded
  }
}
