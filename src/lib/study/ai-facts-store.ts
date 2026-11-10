/**
 * Runs the AI summary for stories the crawler kept, and saves the result in ArticleFacts.
 *
 * AI_FACTS in .env:   "off" (default)  nothing runs
 *                     "shadow"         runs and saves, nothing is shown on the site (test mode)
 *                     "on"             runs, saves, and the site may show it
 * AI_DAILY_CALLS:     hard cap on AI calls per Dhaka day (default 100)
 */
import { prisma } from "@/lib/prisma";
import { geminiReady } from "@/lib/ai/gemini";
import { generateFacts } from "@/lib/study/ai-facts";

export type AiMode = "off" | "shadow" | "on";
export const aiMode = (): AiMode => {
  const m = (process.env.AI_FACTS || "off").trim().toLowerCase();
  return m === "on" || m === "shadow" ? m : "off";
};

const dailyCap = () => {
  const n = Number(process.env.AI_DAILY_CALLS);
  return Number.isFinite(n) && n >= 0 ? n : 100;
};

/** Start of the current Dhaka (UTC+6) day, as a UTC Date. */
function dhakaDayStart(now = Date.now()): Date {
  const shifted = new Date(now + 6 * 3600_000);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 6 * 3600_000);
}

export async function callsToday(): Promise<number> {
  const agg = await prisma.articleFacts.aggregate({ _sum: { calls: true }, where: { createdAt: { gte: dhakaDayStart() } } });
  return agg._sum.calls ?? 0;
}

export type PendingStory = { id: string; title: string; body: string };

/**
 * Make facts for each story that still exists and has none yet, one at a time,
 * stopping at the daily cap. Never throws: a failure only means the story keeps its old summary.
 */
export async function runAiFacts(stories: PendingStory[], opts: { pauseMs?: number; secondPassWaitMs?: number } = {}) {
  const result = { done: 0, ok: 0, failed: 0, skippedCap: 0 };
  if (aiMode() === "off" || !geminiReady() || !stories.length) return result;
  try {
    const ids = stories.map((s) => s.id);
    const [alive, already] = await Promise.all([
      prisma.article.findMany({ where: { id: { in: ids } }, select: { id: true } }),
      prisma.articleFacts.findMany({ where: { articleId: { in: ids } }, select: { articleId: true } }),
    ]);
    const aliveSet = new Set(alive.map((a) => a.id));
    const doneSet = new Set(already.map((a) => a.articleId));
    let used = await callsToday();
    const cap = dailyCap();

    const pause = () => (opts.pauseMs ? new Promise((r) => setTimeout(r, opts.pauseMs)) : Promise.resolve());
    // A story needs at most 3 calls (first lite model, one "busy" retry, the second lite model)
    const attempt = async (s: PendingStory) => {
      const left = cap - used;
      if (left <= 0) return null;
      const out = await generateFacts({ title: s.title, body: s.body }, { maxCalls: Math.min(3, left) });
      used += out.calls;
      return out;
    };

    const todo = stories.filter((s) => aliveSet.has(s.id) && !doneSet.has(s.id));
    const results = new Map<string, Awaited<ReturnType<typeof generateFacts>>>();
    const busy: PendingStory[] = [];
    for (const s of todo) {
      const out = await attempt(s);
      if (!out) {
        result.skippedCap++;
        continue;
      }
      if (out.retryLater) busy.push(s);
      results.set(s.id, out);
      await pause();
    }
    // Second pass: stories that failed only because Google was busy get one more try after a minute
    if (busy.length) {
      await new Promise((r) => setTimeout(r, opts.secondPassWaitMs ?? 60_000));
      for (const s of busy) {
        const again = await attempt(s);
        if (!again) break;
        const first = results.get(s.id)!;
        results.set(s.id, {
          ...again,
          calls: first.calls + again.calls,
          tokensIn: first.tokensIn + again.tokensIn,
          tokensOut: first.tokensOut + again.tokensOut,
          problems: [...first.problems, "second pass:", ...again.problems],
        });
        await pause();
      }
    }

    for (const s of todo) {
      const out = results.get(s.id);
      if (!out) continue;
      const f = out.facts;
      await prisma.articleFacts.create({
        data: {
          articleId: s.id,
          status: out.status,
          model: out.model,
          summary: f?.summary ?? null,
          who: f ? JSON.stringify(f.who) : null,
          what: f?.what || null,
          whenText: f?.when || null,
          whereText: f?.where || null,
          numbers: f ? JSON.stringify(f.numbers) : null,
          gkCategory: f?.gkCategory ?? null,
          examScore: f?.examScore ?? null,
          problems: out.problems.length ? out.problems.join(" | ").slice(0, 2000) : null,
          calls: out.calls,
          tokensIn: out.tokensIn,
          tokensOut: out.tokensOut,
        },
      });
      result.done++;
      if (out.status === "ok") result.ok++;
      else result.failed++;
    }
  } catch (err) {
    console.error("[AI FACTS] run failed:", (err as Error)?.message || err);
  }
  return result;
}
