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

export interface MeritInput {
  studentId: string;
  name: string;
  objectiveScore: number;
  writingMarks: number;
  negative: number;
  timeTakenSec: number;
}

export interface MeritRow extends MeritInput {
  rank: number;
  total: number;
}

/**
 * The merit list: highest total first. On equal marks, the student who took less
 * time ranks higher; if that is equal too, the one with fewer negative marks.
 */
export function rankMerit(rows: MeritInput[]): MeritRow[] {
  const round = (n: number) => Math.round(n * 100) / 100;
  return rows
    .map((r) => ({ ...r, total: round(r.objectiveScore + r.writingMarks) }))
    .sort((a, b) => b.total - a.total || a.timeTakenSec - b.timeTakenSec || a.negative - b.negative || a.name.localeCompare(b.name))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
