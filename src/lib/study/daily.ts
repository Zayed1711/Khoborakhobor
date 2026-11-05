import type { GeneratedQuiz } from "@/lib/quiz/generator";
import { isBengaliText } from "@/lib/bilingual";

/**
 * The homepage "daily challenge": one of today's real quizzes, chosen the same way for
 * everyone on a given day (Bangladesh time). The quiz itself was built from a sentence
 * in the story when it was scraped, so the challenge never shows a template question.
 */

type QuizRow = {
  id: string;
  question: string;
  options: string[] | string;
  correctOption: number;
  explanation?: string | null;
  sourceSentence?: string | null;
  origin?: string | null;
};

type ArticleWithQuiz = {
  title: string;
  slug: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  category?: { name: string } | null;
  quizQuestions?: QuizRow[];
};

function dhakaDayNumber(now = new Date()): number {
  return Math.floor((now.getTime() + 6 * 60 * 60 * 1000) / 86_400_000);
}

export function pickDailyQuiz(articles: ArticleWithQuiz[], mode: "bn" | "en", now = new Date()): GeneratedQuiz | undefined {
  const candidates = articles
    // Only stories a student can open and read: our page (slug) plus the original (sourceUrl)
    .filter((a) => Boolean(a.slug && a.sourceUrl))
    .filter((a) => (mode === "bn" ? isBengaliText(a.title) : !isBengaliText(a.title)))
    .map((a) => ({ a, q: (a.quizQuestions || []).find((q) => q.origin !== "legacy" && q.sourceSentence) }))
    .filter((x): x is { a: ArticleWithQuiz; q: QuizRow } => Boolean(x.q))
    .slice(0, 20); // stay with recent stories

  if (!candidates.length) return undefined;
  const { a, q } = candidates[dhakaDayNumber(now) % candidates.length];
  const options = Array.isArray(q.options) ? q.options : (JSON.parse(q.options || "[]") as string[]);

  return {
    question: q.question,
    options,
    correctOption: q.correctOption,
    explanation: q.explanation || "",
    topicTag: a.category?.name || "",
    sourceName: a.sourceName || undefined,
    articleTitle: a.title,
    articleSlug: a.slug,
    // No contextQuote: the source sentence contains the answer. The explanation
    // (shown after answering) already quotes it.
  };
}
