import { prisma } from "@/lib/prisma";
import { toFeedCard, type FeedCard } from "@/lib/feed-card";
import { scoreStory, selectDaily } from "@/lib/study/daily-selection";

const DAILY_LIMIT = 30;

/**
 * The crawler keeps only the day's best 30 Bengali (job/BCS) stories: the same
 * selection readers see (syllabus or trending, duplicates removed, ranked). Each run
 * ranks new stories together with the day's saved ones, so a stronger story arriving
 * at night replaces a weaker morning one. English stories are not limited.
 *
 * A story a student has saved, noted, read, answered a quiz on or saved a word from
 * is never removed, nor one quoted in a past day's saved key notes. A removed story's
 * link is remembered (SkippedStory) so the next run does not fetch it again.
 */

const isBengali = (t: string) => /[ঀ-৿]/.test(t || "");

function parse<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string") return (v as T) ?? fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

/**
 * Pure decision: which of the day's Bengali cards to drop.
 *
 * `pinnedIds` are stories an earlier run already kept. Ranking depends on the whole
 * day (removing duplicate copies lowers the others' coverage), so re-ranking alone
 * would slowly drop more stories on every run. A pinned story therefore stays unless
 * the day has more than 30 and a stronger new story needs its place.
 */
export function chooseDrops(cards: FeedCard[], protectedIds: Set<string>, pinnedIds: Set<string> = new Set()): FeedCard[] {
  const bengali = cards.filter((c) => isBengali(c.title));
  const best = new Set(selectDaily(bengali, "all").map((c) => c.id));
  const keep = new Set(bengali.filter((c) => best.has(c.id) || protectedIds.has(c.id) || pinnedIds.has(c.id)).map((c) => c.id));

  // Over the limit: give up pinned stories that the new ranking no longer picks, weakest first
  const displaceable = bengali
    .filter((c) => pinnedIds.has(c.id) && !best.has(c.id) && !protectedIds.has(c.id))
    .sort((a, b) => scoreStory(a) - scoreStory(b));
  for (const c of displaceable) {
    if (keep.size <= DAILY_LIMIT) break;
    keep.delete(c.id);
  }
  return bengali.filter((c) => !keep.has(c.id));
}

/** Bangladesh day (UTC+6) as [start, end) instants. */
function dayRange(day: string): [Date, Date] {
  const start = new Date(`${day}T00:00:00+06:00`);
  return [start, new Date(start.getTime() + 86400000)];
}

export async function keepDailyBest(days: string[], today: string): Promise<{ removed: number; protectedKept: number }> {
  let removed = 0;
  let protectedKept = 0;

  for (const day of [...new Set(days)]) {
    const [start, end] = dayRange(day);
    const rows = await prisma.article.findMany({
      where: { sourceUrl: { not: null }, createdAt: { gte: start, lt: end } },
      include: { category: true, quizQuestions: { where: { origin: { not: "legacy" } } } },
    });
    const cards = rows.map((a) =>
      toFeedCard({
        ...a,
        content: "",
        createdAtIso: a.createdAt.toISOString(),
        keyTakeaways: parse(a.keyTakeaways, []),
        factTable: parse((a as { factTable?: unknown }).factTable, []),
        quizQuestions: a.quizQuestions.map((q) => ({ ...q, options: parse(q.options, []) })),
      })
    );

    const pinned = new Set(rows.filter((a) => a.dailyPick).map((a) => a.id));
    // Candidates first, then only check protection for those
    const candidates = chooseDrops(cards, new Set(), pinned);
    const ids = candidates.map((c) => c.id);

    const [saved, notes, reads, attempts, words] = !ids.length ? [[], [], [], [], []] : await Promise.all([
      prisma.savedArticle.findMany({ where: { articleId: { in: ids } }, select: { articleId: true } }),
      prisma.studyNote.findMany({ where: { articleId: { in: ids } }, select: { articleId: true } }),
      prisma.articleRead.findMany({ where: { articleId: { in: ids } }, select: { articleId: true } }),
      prisma.quizAttempt.findMany({ where: { question: { articleId: { in: ids } } }, select: { question: { select: { articleId: true } } } }),
      prisma.savedWord.findMany({ where: { term: { articleId: { in: ids } } }, select: { term: { select: { articleId: true } } } }),
    ]);
    const protectedIds = new Set<string>([
      ...saved.map((r) => r.articleId),
      ...notes.map((r) => r.articleId),
      ...reads.map((r) => r.articleId),
      ...attempts.map((r) => r.question.articleId),
      ...words.map((r) => r.term.articleId),
    ]);

    // A past day's key notes are frozen; keep every story they quote
    if (day !== today) {
      const note = await prisma.dailyNote.findUnique({ where: { day_lang: { day, lang: "bn" } } });
      const slugs = new Set(parse<{ slug: string }[]>(note?.items, []).map((n) => n.slug));
      for (const c of candidates) if (slugs.has(c.slug)) protectedIds.add(c.id);
    }

    // Re-decide with protection known (a protected story keeps its place in the 30)
    const drops = chooseDrops(cards, protectedIds, pinned);
    protectedKept += candidates.filter((c) => protectedIds.has(c.id)).length;
    for (const c of drops) {
      await prisma.$transaction([
        prisma.skippedStory.upsert({ where: { url: c.sourceUrl! }, create: { url: c.sourceUrl!, day }, update: {} }),
        prisma.article.delete({ where: { id: c.id } }),
      ]);
      removed++;
    }

    // Everything left in the day's Bengali set has made the cut: pin it
    const dropped = new Set(drops.map((c) => c.id));
    const keptIds = cards.filter((c) => isBengali(c.title) && !dropped.has(c.id) && !pinned.has(c.id)).map((c) => c.id);
    if (keptIds.length) await prisma.article.updateMany({ where: { id: { in: keptIds } }, data: { dailyPick: true } });
  }
  return { removed, protectedKept };
}

/** Links dropped in the last two weeks, so the crawler skips them before fetching. */
export async function recentlySkippedUrls(): Promise<Set<string>> {
  const since = new Date(Date.now() - 14 * 86400000);
  const rows = await prisma.skippedStory.findMany({ where: { createdAt: { gte: since } }, select: { url: true } });
  return new Set(rows.map((r) => r.url));
}
