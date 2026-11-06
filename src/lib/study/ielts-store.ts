import { prisma } from "@/lib/prisma";
import { buildIeltsPractice } from "@/lib/study/ielts-practice";

/** What the browser receives: questions only, never answers. */
export type PracticeForClient =
  | { id: string; kind: "mcq"; question: string; options: string[] }
  | { id: string; kind: "tf"; question: string }
  | { id: string; kind: "blank"; question: string };

export const PRACTICE_ORIGINS = ["ielts_mcq", "ielts_blank", "ielts_tf"] as const;
export const TF_OPTIONS = ["TRUE", "FALSE"];

/**
 * Rule version stored with each question (in `explanation`). Questions built by older
 * rules, or from a passage that has since changed, are retired (kept for students'
 * answer history as "legacy") and built again from the passage on the page.
 * v2: questions come only from the reading passage (a part of the article); no
 * statements from other stories; True/False added.
 */
const PRACTICE_VERSION = "practice-v2";

function parse<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string") return (v as T) ?? fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

const ORDER: Record<string, number> = { ielts_mcq: 0, ielts_blank: 1, ielts_tf: 2 };

/**
 * The IELTS reading practice for an English story, built from its reading passage the
 * first time the story is opened and saved with it, so its answers never change
 * afterwards. Answers stay on the server; the browser gets the questions only.
 */
export async function ensurePractice(articleId: string, passage: string[], title: string): Promise<PracticeForClient[]> {
  const text = passage.join(" ");
  let rows = await prisma.quizQuestion.findMany({ where: { articleId, origin: { in: [...PRACTICE_ORIGINS] } }, orderBy: { id: "asc" } });

  const current = rows.length > 0 && rows.every((r) => r.explanation === PRACTICE_VERSION && !!r.sourceSentence && text.includes(r.sourceSentence));
  if (!current && passage.length) {
    if (rows.length) {
      await prisma.quizQuestion.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { origin: "legacy" } });
    }
    for (const it of buildIeltsPractice(passage, title)) {
      await prisma.quizQuestion.create({
        data: {
          articleId,
          question: it.question,
          options: JSON.stringify(it.kind === "mcq" ? it.options : it.kind === "tf" ? TF_OPTIONS : it.accepted),
          correctOption: it.kind === "mcq" ? it.correctIndex : it.kind === "tf" ? TF_OPTIONS.indexOf(it.answer) : 0,
          explanation: PRACTICE_VERSION,
          origin: it.kind === "mcq" ? "ielts_mcq" : it.kind === "tf" ? "ielts_tf" : "ielts_blank",
          sourceSentence: it.sourceSentence,
        },
      });
    }
    rows = await prisma.quizQuestion.findMany({ where: { articleId, origin: { in: [...PRACTICE_ORIGINS] } }, orderBy: { id: "asc" } });
  }

  return [...rows]
    .sort((a, b) => ORDER[a.origin] - ORDER[b.origin])
    .map((r) =>
      r.origin === "ielts_mcq"
        ? { id: r.id, kind: "mcq" as const, question: r.question, options: parse<string[]>(r.options, []) }
        : r.origin === "ielts_tf"
        ? { id: r.id, kind: "tf" as const, question: r.question }
        : { id: r.id, kind: "blank" as const, question: r.question }
    );
}
