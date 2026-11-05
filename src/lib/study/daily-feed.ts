import { getPublishedArticles } from "@/actions/articles";
import { toFeedCard } from "@/lib/feed-card";
import { pickDailyQuiz } from "@/lib/study/daily";
import { isSyllabusText, selectDailyFeed, type RankedCard } from "@/lib/study/daily-selection";

/**
 * One place that decides what readers see each day, so the homepage, the date
 * archive, the section pages and the daily quiz always agree:
 *   - homepage / a chosen date: only জরুরি ১০
 *   - section pages: that section's stories from the daily selections (at most 30 a day)
 *   - daily quiz: from one of the ten, on a syllabus fact
 */

type RawArticle = Awaited<ReturnType<typeof getPublishedArticles>>[number];

const dayKey = (iso: string) => iso.slice(0, 10);

/** Today's selection (the 24 hours before the newest story), with the raw rows for quizzes. */
export async function getTodaySelection(): Promise<{ raw: RawArticle[]; cards: RankedCard[] }> {
  const raw = await getPublishedArticles(250);
  return { raw, cards: selectDailyFeed(raw.map(toFeedCard), "latest") };
}

export const urgentOnly = (cards: RankedCard[]) => cards.filter((c) => c.dailyTier === "urgent");

/**
 * A section page: this section's stories from today's selection, then from each of the
 * previous days' selections (up to a week), newest day first and best first within a day.
 */
export async function getSectionSelection(slug: string): Promise<RankedCard[]> {
  const raw = await getPublishedArticles(600);
  const cards = raw.map(toFeedCard);
  const today = selectDailyFeed(cards, "latest");
  const shown = new Set(today.map((c) => c.id));

  const byDay = new Map<string, typeof cards>();
  for (const c of cards) {
    if (shown.has(c.id)) continue;
    const k = dayKey(c.createdAtIso);
    byDay.set(k, [...(byDay.get(k) || []), c]);
  }
  const earlier = [...byDay.keys()]
    .sort()
    .reverse()
    .slice(0, 7)
    .flatMap((k) => selectDailyFeed(byDay.get(k)!, "all").filter((c) => !shown.has(c.id)));

  return [...today, ...earlier].filter((c) => c.category?.slug === slug);
}

/**
 * The daily quiz challenge: from one of the ten, never from a story that is not shown.
 * The question's own sentence must touch the syllabus (a budget figure, a treaty, an exam
 * date...); if none does, a quiz from a ten-story whose headline does. Otherwise no quiz.
 */
export function pickSyllabusDailyQuiz(raw: RawArticle[], cards: RankedCard[], mode: "bn" | "en") {
  const byId = new Map(raw.map((a) => [a.id, a]));
  const ten = urgentOnly(cards)
    .map((c) => byId.get(c.id))
    .filter((a): a is RawArticle => Boolean(a));

  const quizSentence = (a: RawArticle) =>
    a.quizQuestions.find((q) => q.origin !== "legacy" && q.sourceSentence)?.sourceSentence || "";

  const strong = ten.filter((a) => isSyllabusText(quizSentence(a)));
  const fallback = ten.filter((a) => quizSentence(a) && isSyllabusText(a.title));
  return pickDailyQuiz(strong, mode) ?? pickDailyQuiz(fallback, mode);
}
