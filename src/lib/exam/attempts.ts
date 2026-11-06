import { prisma } from "@/lib/prisma";
import { SECTIONS } from "@/lib/exam/rules";
import { scoreObjective } from "@/lib/exam/scoring";
import { wordCount } from "@/lib/study/writing-prompts";

/** A few seconds' allowance for the last save arriving after the timer ends. */
export const GRACE_MS = 15_000;

/** Score an attempt and turn its writing answers into review items. Safe to call twice. */
export async function finalizeAttempt(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: true, exam: { include: { questions: true } } },
  });
  if (!attempt || attempt.submittedAt) return;
  const answers = Object.fromEntries(attempt.answers.map((a) => [a.questionId, a.answer]));
  const score = scoreObjective(attempt.exam.questions, answers);
  const end = new Date(Math.min(Date.now(), attempt.deadline.getTime()));

  // Claim the attempt first, so two calls never score it twice
  const claimed = await prisma.examAttempt.updateMany({
    where: { id: attempt.id, submittedAt: null },
    data: {
      submittedAt: end,
      timeTakenSec: Math.max(0, Math.round((end.getTime() - attempt.startedAt.getTime()) / 1000)),
      correct: score.correct,
      wrong: score.wrong,
      negative: score.negative,
      objectiveScore: score.objectiveScore,
    },
  });
  if (!claimed.count) return;

  for (const q of attempt.exam.questions.filter((x) => x.kind === "writing")) {
    const text = (answers[q.id] || "").trim();
    if (!text) continue;
    const label = SECTIONS.find((s) => s.id === q.section)?.label || q.section;
    await prisma.writingSubmission.upsert({
      where: { examQuestionId_studentId: { examQuestionId: q.id, studentId: attempt.studentId } },
      create: {
        studentId: attempt.studentId,
        articleSlug: "",
        articleTitle: attempt.exam.title,
        topic: label,
        prompt: q.question,
        text,
        wordCount: wordCount(text),
        examId: attempt.examId,
        examQuestionId: q.id,
      },
      update: {},
    });
  }
}

/** Finish every attempt of an exam whose time has run out (students who closed the page). */
export async function finalizeExpiredAttempts(examId: string) {
  const open = await prisma.examAttempt.findMany({
    where: { examId, submittedAt: null, deadline: { lt: new Date(Date.now() - GRACE_MS) } },
    select: { id: true },
  });
  for (const a of open) await finalizeAttempt(a.id);
}

