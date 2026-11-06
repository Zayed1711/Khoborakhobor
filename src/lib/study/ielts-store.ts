import { prisma } from "@/lib/prisma";
import { buildIeltsPractice, sentencesFrom, type PracticeSource } from "@/lib/study/ielts-practice";

/** What the browser receives: questions only, never answers. */
export type PracticeForClient =
  | { id: string; kind: "mcq"; question: string; options: string[] }
  | { id: string; kind: "blank"; question: string };

export const PRACTICE_ORIGINS = ["ielts_mcq", "ielts_blank"] as const;

function parse<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string") return (v as T) ?? fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

/**
 * The IELTS reading practice for an English story. Built once, the first time the story
 * is opened, and saved with it, so its answers never change afterwards. Answers stay on
 * the server; the browser gets the questions only.
 */
export async function ensurePractice(articleId: string, src: PracticeSource): Promise<PracticeForClient[]> {
  let rows = await prisma.quizQuestion.findMany({
    where: { articleId, origin: { in: [...PRACTICE_ORIGINS] } },
    orderBy: { id: "asc" },
  });

  if (!rows.length) {
    // Wrong options for "which statement appears in the passage" come from other English stories
    const others = await prisma.article.findMany({
      where: { sourceUrl: { not: null }, id: { not: articleId } },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: { title: true, summary: true, keyTakeaways: true },
    });
    const otherText = others
      .filter((a) => !/[ঀ-৿]/.test(a.title))
      .slice(0, 60)
      .map((a) => [a.summary, ...parse<string[]>(a.keyTakeaways, [])].join(" "));

    const items = buildIeltsPractice(src, sentencesFrom(otherText));
    if (!items.length) return [];
    // Keep the order: multiple choice first, then sentence completion
    for (const it of items) {
      await prisma.quizQuestion.create({
        data: {
          articleId,
          question: it.question,
          options: JSON.stringify(it.kind === "mcq" ? it.options : it.accepted),
          correctOption: it.kind === "mcq" ? it.correctIndex : 0,
          explanation: null,
          origin: it.kind === "mcq" ? "ielts_mcq" : "ielts_blank",
          sourceSentence: it.sourceSentence,
        },
      });
    }
    rows = await prisma.quizQuestion.findMany({
      where: { articleId, origin: { in: [...PRACTICE_ORIGINS] } },
      orderBy: { id: "asc" },
    });
  }

  const ordered = [...rows.filter((r) => r.origin === "ielts_mcq"), ...rows.filter((r) => r.origin === "ielts_blank")];
  return ordered.map((r) =>
    r.origin === "ielts_mcq"
      ? { id: r.id, kind: "mcq" as const, question: r.question, options: parse<string[]>(r.options, []) }
      : { id: r.id, kind: "blank" as const, question: r.question }
  );
}
