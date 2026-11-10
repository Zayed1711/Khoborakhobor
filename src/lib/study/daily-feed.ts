import { getPublishedArticles } from "@/actions/articles";
import { prisma } from "@/lib/prisma";
import { toFeedCard } from "@/lib/feed-card";
import { selectDaily, selectDailyFeed, type RankedCard } from "@/lib/study/daily-selection";
import { buildDayNotes, dhakaDay, readSavedNotes, saveNotesJson, type KeyNoteDay } from "@/lib/study/key-notes";

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
  const [v, ai] = await Promise.all([
    prisma.article.aggregate({
      where: { sourceUrl: { not: null } },
      _count: { _all: true },
      _max: { createdAt: true, updatedAt: true },
    }),
    // AI summaries arrive at the end of a crawl, after the stories themselves
    prisma.articleFacts.count(),
  ]);
  return `${v._count._all}|${v._max.createdAt?.getTime() ?? 0}|${v._max.updatedAt?.getTime() ?? 0}|${ai}`;
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

// ---------------------------------------------------------------------------
// Daily key notes (job/BCS mode): one quoted point from each of the day's ten
// ---------------------------------------------------------------------------

export const KEY_NOTE_DAYS = 7;
const isBengali = (t: string) => /[ঀ-৿]/.test(t || "");

/** The last 7 days of key notes, today first. Today's list follows the news; past days never change. */
export async function getKeyNotes(lang: "bn" | "en" = "bn"): Promise<KeyNoteDay[]> {
  const today = dhakaDay(Date.now());
  return reuse(`notes:${lang}:${today}`, () => computeKeyNotes(lang, today));
}

async function computeKeyNotes(lang: "bn" | "en", today: string): Promise<KeyNoteDay[]> {
  const days = Array.from({ length: KEY_NOTE_DAYS }, (_, i) => dhakaDay(new Date(today + "T12:00:00Z").getTime() - i * 86400000));
  const stored = new Map(
    // Rows from an older rule read as missing, so they are rebuilt once
    (await prisma.dailyNote.findMany({ where: { lang, day: { in: days } } }))
      .map((r) => [r.day, readSavedNotes(r.items)] as const)
      .filter((e): e is readonly [string, NonNullable<ReturnType<typeof readSavedNotes>>] => e[1] !== null)
  );

  // Stories are needed for today, and for any past day not saved yet (e.g. right after this feature ships)
  const needed = days.filter((d) => d === today || !stored.has(d));
  const byDay = new Map<string, ReturnType<typeof toFeedCard>[]>();
  if (needed.length) {
    const cards = (await getPublishedArticles(600)).map(toFeedCard).filter((c) => (lang === "bn" ? isBengali(c.title) : !isBengali(c.title)));
    for (const c of cards) {
      const d = dhakaDay(c.createdAtIso);
      if (needed.includes(d)) byDay.set(d, [...(byDay.get(d) || []), c]);
    }
  }

  const result: KeyNoteDay[] = [];
  for (const day of days) {
    let items = stored.get(day);
    if (day === today || !items) {
      const ten = urgentOnly(selectDaily(byDay.get(day) || [], "all"));
      items = buildDayNotes(ten);
      if (day === today) {
        await prisma.dailyNote.upsert({
          where: { day_lang: { day, lang } },
          create: { day, lang, items: saveNotesJson(items) },
          update: { items: saveNotesJson(items) },
        });
      } else if (items.length) {
        // A past day is saved once and then frozen
        // Saved once (or rebuilt once from an older rule's row), then frozen
        await prisma.dailyNote.upsert({
          where: { day_lang: { day, lang } },
          create: { day, lang, items: saveNotesJson(items) },
          update: { items: saveNotesJson(items) },
        });
      }
    }
    result.push({ day, items });
  }
  return result;
}
