import { NEGATIVE_MARK, acceptedAnswers } from "@/lib/exam/rules";

export interface ScoredQuestion {
  id: string;
  kind: string;
  answer: string;
  marks: number;
}

/** Lower case, letters and digits only, for comparing typed answers. */
export const normaliseTyped = (t: string) => (t || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Is this answer right? (null = left blank) */
export function isRight(q: ScoredQuestion, given: string | undefined): boolean | null {
  const g = (given ?? "").trim();
  if (!g) return null;
  if (q.kind === "mcq" || q.kind === "tfng") return g === q.answer;
  if (q.kind === "blank") {
    const n = normaliseTyped(g);
    return acceptedAnswers(q.answer).some((a) => normaliseTyped(a) === n);
  }
  return null; // writing is marked by hand
}

/**
 * Objective score: +1 for a right answer, −0.5 for a wrong one, 0 when left blank.
 * Writing tasks are not counted here.
 */
export function scoreObjective(questions: ScoredQuestion[], answers: Record<string, string>) {
  let correct = 0;
  let wrong = 0;
  for (const q of questions) {
    if (q.kind === "writing") continue;
    const r = isRight(q, answers[q.id]);
    if (r === true) correct += q.marks;
    else if (r === false) wrong += 1;
  }
  const negative = wrong * NEGATIVE_MARK;
  return { correct, wrong, negative, objectiveScore: correct - negative };
}
