import { getPublishedArticles } from "@/actions/articles";
import { prisma } from "@/lib/prisma";
import { toFeedCard } from "@/lib/feed-card";
import { selectDailyFeed, type RankedCard } from "@/lib/study/daily-selection";

/**
 * One place that decides what readers see each day, so the homepage, the date
 * archive, the section pages and the daily quiz always agree:
 *   - homepage / a chosen date: only জরুরি ১০
 *   - section pages: that section's stories from the daily selections (at most 30 a day)
 */

const dayKey = (iso: string) => iso.slice(0, 10);

// ---------------------------------------------------------------------------
// Reuse: the news changes only when the crawler runs (every few hours) or a cleanup
// edits stories, so each selection is computed once per "news version" and reused
// by every visitor. One small query per visit checks whether the version changed.
// ---------------------------------------------------------------------------

const MAX_AGE_MS = 15 * 60 * 1000; // recompute at least every 15 minutes regardless
type Cached<T> = { version: string; at: number; value: Promise<T> };
const cache = new Map<string, Cached<unknown>>();

async function newsVersion(): Promise<string> {
  const v = await prisma.article.aggregate({
    where: { sourceUrl: { not: null } },
    _count: { _all: true },
    _max: { createdAt: true, updatedAt: true },
  });
  return `${v._count._all}|${v._max.createdAt?.getTime() ?? 0}|${v._max.updatedAt?.getTime() ?? 0}`;
}

async function reuse<T>(key: string, compute: () => Promise<T>): Promise<T> {
  const version = await newsVersion();
  const hit = cache.get(key) as Cached<T> | undefined;
  if (hit && hit.version === version && Date.now() - hit.at < MAX_AGE_MS) return hit.value;
  // Store the promise itself, so visitors arriving together share one computation
  const value = compute();
  cache.set(key, { version, at: Date.now(), value });
  value.catch(() => cache.delete(key)); // never keep a failure
  return value;
}

/** Today's selection (the 24 hours before the newest story). */
export async function getTodaySelection(): Promise<{ cards: RankedCard[] }> {
  return reuse("today", async () => {
    const raw = await getPublishedArticles(250);
    return { cards: selectDailyFeed(raw.map(toFeedCard), "latest") };
  });
}

export const urgentOnly = (cards: RankedCard[]) => cards.filter((c) => c.dailyTier === "urgent");

/**
 * A section page: this section's stories from today's selection, then from each of the
 * previous days' selections (up to a week), newest day first and best first within a day.
 */
export async function getSectionSelection(slug: string): Promise<RankedCard[]> {
  return (await getWeekSelection()).filter((c) => c.category?.slug === slug);
}

/** Today's selection plus each earlier day's (up to a week): computed once, shared by all sections. */
function getWeekSelection(): Promise<RankedCard[]> {
  return reuse("week", computeWeekSelection);
}

async function computeWeekSelection(): Promise<RankedCard[]> {
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

  return [...today, ...earlier];
}

/** What the browser receives: feed cards without quiz questions (quizzes are only at the end of a story). */
export function forClient<T extends { quizQuestions?: unknown[] }>(cards: T[]): T[] {
  return cards.map((c) => ({ ...c, quizQuestions: [] }));
}
