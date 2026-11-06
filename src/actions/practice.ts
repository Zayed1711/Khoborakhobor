"use server";

import { prisma } from "@/lib/prisma";
import { getSessionStudent } from "@/lib/guards";
import { isAcceptedAnswer } from "@/lib/study/ielts-practice";

/**
 * Check one IELTS reading practice answer on the server (answers never reach the
 * browser). `answer` is the option index for multiple choice, or the typed word for
 * sentence completion. A logged-in student's attempt is recorded for their progress.
 */
export async function checkPracticeAnswerAction(questionId: string, answer: number | string) {
  const q = await prisma.quizQuestion.findUnique({ where: { id: questionId } });
  if (!q || (q.origin !== "ielts_mcq" && q.origin !== "ielts_blank")) {
    return { ok: false as const, message: "Question not found." };
  }
  let options: string[] = [];
  try {
    options = JSON.parse(q.options);
  } catch {
    options = [];
  }

  const isMcq = q.origin === "ielts_mcq";
  const isCorrect = isMcq ? Number(answer) === q.correctOption : isAcceptedAnswer(String(answer ?? "").slice(0, 60), options);
  const correctAnswer = isMcq ? options[q.correctOption] ?? "" : options[0] ?? "";

  const student = await getSessionStudent().catch(() => null);
  if (student) {
    await prisma.quizAttempt
      .create({
        data: {
          studentId: student.id,
          questionId,
          // Typed answers have no option number: 1 = correct, 0 = not
          chosenOption: isMcq ? Number(answer) : isCorrect ? 1 : 0,
          isCorrect,
        },
      })
      .catch(() => undefined);
  }

  return { ok: true as const, isCorrect, correctAnswer, sourceSentence: q.sourceSentence || "" };
}
