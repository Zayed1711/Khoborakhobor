"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { shuffleQuizOptions } from "@/lib/quiz/shuffle";
import { extractFacts, extractTakeaways, buildExtractiveQuiz, plainText } from "@/lib/study/extractive";
import { requireAdmin } from "@/lib/guards";
import { toFeedCard, FeedCard } from "@/lib/feed-card";
import { AI_FACTS_SELECT, aiSummaryOf, factCardOf } from "@/lib/study/ai-facts-view";
import { selectDailyFeed } from "@/lib/study/daily-selection";
import { englishTopic } from "@/lib/study/topics";
import { sanitizeArticleHtml, textToParagraphHtml } from "@/lib/sanitize-html";

const urgentTier = <T extends { dailyTier: string }>(cards: T[]) => cards.filter((c) => c.dailyTier === "urgent");

function safeParseJson<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export interface DateArchiveStats {
  totalCounts: Record<string, number>;
  bnCounts: Record<string, number>;
  enCounts: Record<string, number>;
  totalAll: number;
  bnAll: number;
  enAll: number;
}

/** Stories a reader sees for a chosen date in Bengali (the day's জরুরি ১০). */
const DAILY_SHOWN = 10;

export async function getDateArchiveStatsAction(): Promise<DateArchiveStats> {
  try {
    // The last 7 days, counted by Bangladesh date
    const since = new Date(Date.now() - 8 * 86400000);
    const articles = await prisma.article.findMany({
      where: { sourceUrl: { not: null }, createdAt: { gte: since } }, // link-out model: listed stories must link to the original
      select: {
        title: true,
        createdAt: true,
      },
    });
    const dhakaKey = (d: Date) => new Date(d.getTime() + 6 * 3600000).toISOString().slice(0, 10);
    const today = Date.parse(dhakaKey(new Date()) + "T00:00:00Z");
    const week = new Set(Array.from({ length: 7 }, (_, i) => new Date(today - i * 86400000).toISOString().slice(0, 10)));

    const totalCounts: Record<string, number> = {};
    const bnCounts: Record<string, number> = {};
    const enCounts: Record<string, number> = {};
    for (const a of articles) {
      const key = dhakaKey(new Date(a.createdAt));
      if (!week.has(key)) continue;
      const isBn = /[ঀ-৿]/.test(a.title || "");
      if (isBn) bnCounts[key] = (bnCounts[key] || 0) + 1;
      else enCounts[key] = (enCounts[key] || 0) + 1;
    }
    // A chosen date shows that day's জরুরি ১০ in Bengali, so count what readers will see
    for (const k of Object.keys(bnCounts)) bnCounts[k] = Math.min(bnCounts[k], DAILY_SHOWN);
    for (const k of week) {
      const t = (bnCounts[k] || 0) + (enCounts[k] || 0);
      if (t) totalCounts[k] = t;
    }
    const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

    return {
      totalCounts,
      bnCounts,
      enCounts,
      totalAll: sum(totalCounts),
      bnAll: sum(bnCounts),
      enAll: sum(enCounts),
    };
  } catch (err) {
    console.error("[ARTICLES] Error loading date archive stats:", err);
    return {
      totalCounts: {},
      bnCounts: {},
      enCounts: {},
      totalAll: 0,
      bnAll: 0,
      enAll: 0,
    };
  }
}

/**
 * English learning mode: every collected English story, newest first, 20 at a time.
 * Stories carry no language field, so the newest rows are read in batches and the
 * ones with an English headline are kept. `before` is the cursor from the last page.
 */
export async function getEnglishFeedAction(
  before?: string | null,
  limit: number = 20,
  topic?: string | null
): Promise<{ cards: FeedCard[]; next: string | null }> {
  const BATCH = 200;
  const cards: FeedCard[] = [];
  const seen = new Set<string>();
  let cursor = before ? new Date(before) : null;
  try {
    for (let round = 0; round < 6 && cards.length < limit; round++) {
      const rows = await prisma.article.findMany({
        where: { sourceUrl: { not: null }, ...(cursor ? { createdAt: { lt: cursor } } : {}) },
        include: { category: true, aiFacts: AI_FACTS_SELECT },
        orderBy: { createdAt: "desc" },
        take: BATCH,
      });
      for (const a of rows) {
        cursor = a.createdAt;
        if (/[ঀ-৿]/.test(a.title)) continue;
        const storyTopic = englishTopic(a.title, a.summary);
        if (topic && storyTopic !== topic) continue;
        if (seen.has(a.sourceUrl!)) continue; // the same story saved twice
        seen.add(a.sourceUrl!);
        cards.push(
          toFeedCard({
            ...a,
            content: "",
            aiSummary: aiSummaryOf(a.aiFacts),
            createdAtIso: a.createdAt.toISOString(),
            keyTakeaways: safeParseJson(a.keyTakeaways, []),
            factTable: safeParseJson((a as any).factTable, []),
            quizQuestions: [], // English learning stories have no quiz
            topic: storyTopic,
          })
        );
        if (cards.length >= limit) break;
      }
      if (rows.length < BATCH) {
        // Reached the oldest story: there is no next page after this one
        if (cards.length < limit) cursor = null;
        break;
      }
    }
    return { cards, next: cursor ? cursor.toISOString() : null };
  } catch (err) {
    console.error("[ARTICLES] Error loading the English feed:", err);
    return { cards, next: null };
  }
}

export async function getArticlesByDateAction(dateKey: string, allEnglish: boolean = false): Promise<FeedCard[]> {
  try {
    if (!dateKey || dateKey === "all") {
      return urgentTier(selectDailyFeed((await getPublishedArticles(250)).map(toFeedCard), "latest"));
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return [];

    const startOfDay = new Date(`${dateKey}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateKey}T23:59:59.999Z`);

    const articles = await prisma.article.findMany({
      where: {
        sourceUrl: { not: null },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        category: true,
        aiFacts: AI_FACTS_SELECT,
        // No vocabulary: feed cards never show it (the story page loads its own)
        quizQuestions: { where: { origin: { not: "legacy" } } }, // legacy = old template quiz kept only for attempt history
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    const parsed = articles.map((a) => ({
      ...a,
      // Link-out model: the publisher's full text is never sent to the browser
      content: "",
      aiSummary: aiSummaryOf(a.aiFacts),
      createdAtIso: a.createdAt instanceof Date ? a.createdAt.toISOString() : new Date(a.createdAt).toISOString(),
      keyTakeaways: safeParseJson(a.keyTakeaways, []),
      factTable: safeParseJson((a as any).factTable, []),
      examTagsList: a.examTags ? a.examTags.split(",").map((t) => t.trim()) : [],
      quizQuestions: a.quizQuestions.map((q) => ({
        ...q,
        options: safeParseJson(q.options, []),
      })),
    }));

    parsed.sort((a, b) => {
      const timeA = new Date(a.createdAtIso).getTime() || 0;
      const timeB = new Date(b.createdAtIso).getTime() || 0;
      return timeB - timeA;
    });

    // English learning mode: every English story of that day, newest first
    if (allEnglish) {
      return parsed
        .filter((a) => !/[ঀ-৿]/.test(a.title))
        .map((a) => toFeedCard({ ...a, quizQuestions: [], topic: englishTopic(a.title, a.summary) }));
    }
    // A chosen day shows that day's জরুরি ১০ (the rest are on the section pages)
    return urgentTier(selectDailyFeed(parsed.map(toFeedCard), "all"));
  } catch (err) {
    console.error(`[ARTICLES] Error loading articles for date (${dateKey}):`, err);
    return [];
  }
}

export async function getPublishedArticles(limit: number = 150) {
  try {
    const articles = await prisma.article.findMany({
      where: { sourceUrl: { not: null } }, // link-out model: listed stories must link to the original
      take: limit,
      include: {
        category: true,
        aiFacts: AI_FACTS_SELECT,
        // No vocabulary: feed cards never show it (the story page loads its own)
        quizQuestions: { where: { origin: { not: "legacy" } } }, // legacy = old template quiz kept only for attempt history
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const parsed = articles.map((a) => ({
      ...a,
      // Link-out model: the publisher's full text is never sent to the browser
      content: "",
      aiSummary: aiSummaryOf(a.aiFacts),
      createdAtIso: a.createdAt instanceof Date ? a.createdAt.toISOString() : new Date(a.createdAt).toISOString(),
      keyTakeaways: safeParseJson(a.keyTakeaways, []),
      factTable: safeParseJson((a as any).factTable, []),
      examTagsList: a.examTags ? a.examTags.split(",").map((t) => t.trim()) : [],
      quizQuestions: a.quizQuestions.map((q) => ({
        ...q,
        options: safeParseJson(q.options, []),
      })),
    }));

    // Guarantee strictly latest-first chronological ordering
    parsed.sort((a, b) => {
      const timeA = new Date(a.createdAtIso).getTime() || 0;
      const timeB = new Date(b.createdAtIso).getTime() || 0;
      return timeB - timeA;
    });

    return parsed;
  } catch (error) {
    console.error("[ARTICLES] Error loading articles:", error);
    return [];
  }
}

export async function getArticleBySlug(rawSlug: string) {
  if (!rawSlug) return null;

  try {
    const decoded = decodeURIComponent(rawSlug);
    let article = await prisma.article.findUnique({
      where: { slug: decoded },
      include: {
        category: true,
        vocabulary: true,
        aiFacts: AI_FACTS_SELECT,
        quizQuestions: { where: { origin: { not: "legacy" } } }, // legacy = old template quiz kept only for attempt history
      },
    });

    if (!article && decoded !== rawSlug) {
      article = await prisma.article.findUnique({
        where: { slug: rawSlug },
        include: {
          category: true,
          vocabulary: true,
          aiFacts: AI_FACTS_SELECT,
          quizQuestions: { where: { origin: { not: "legacy" } } }, // legacy = old template quiz kept only for attempt history
        },
      });
    }

    // Link-out model: a story without a link to the original is not shown at all,
    // not even by direct address (old stories of this kind may carry invented text)
    if (!article || !article.sourceUrl) return null;

    return {
      ...article,
      // Link-out model: readers open the full story on the publisher's site
      content: "",
      aiSummary: aiSummaryOf(article.aiFacts),
      factCard: factCardOf(article.aiFacts),
      keyTakeaways: safeParseJson(article.keyTakeaways, []),
      factTable: safeParseJson((article as any).factTable, []),
      examTagsList: article.examTags ? article.examTags.split(",").map((t) => t.trim()) : [],
      quizQuestions: article.quizQuestions.map((q) => ({
        ...q,
        options: safeParseJson(q.options, []),
      })),
    };
  } catch (err) {
    console.error(`[ARTICLES] Error loading article by slug (${rawSlug}):`, err);
    return null;
  }
}

// -------------------------------------------------------------
// Streamlined Content Ingestion Desk Action
// -------------------------------------------------------------
export async function ingestArticleAction(formData: FormData) {
  await requireAdmin();

  const title = (formData.get("title") as string)?.trim();
  const categorySlug = formData.get("categorySlug") as string;
  const summary = (formData.get("summary") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const imageUrl = (formData.get("imageUrl") as string)?.trim();
  // Tags only when the editor sets them; a blanket default carried no information
  const examTags = (formData.get("examTags") as string)?.trim() || null;
  const rawKeyTakeaways = formData.get("keyTakeaways") as string;
  const isCapsule = formData.get("isCapsule") === "true";
  const isLead = formData.get("isLead") === "true";

  // Optional Vocabulary Term
  const vocabTerm = (formData.get("vocabTerm") as string)?.trim();
  const vocabDef = (formData.get("vocabDef") as string)?.trim();

  // Optional Quiz
  const quizQ = (formData.get("quizQuestion") as string)?.trim();
  const opt0 = (formData.get("opt0") as string)?.trim();
  const opt1 = (formData.get("opt1") as string)?.trim();
  const opt2 = (formData.get("opt2") as string)?.trim();
  const opt3 = (formData.get("opt3") as string)?.trim();
  const correctOpt = parseInt((formData.get("correctOption") as string) || "0", 10);
  const quizExp = (formData.get("quizExplanation") as string)?.trim();

  if (!title || !summary) {
    throw new Error("শিরোনাম ও সারসংক্ষেপ আবশ্যক।");
  }

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) {
    throw new Error("নির্বাচিত বিভাগটি বিদ্যমান নেই।");
  }

  const slug =
    title
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `article-${Date.now()}`;

  const takeawaysList = rawKeyTakeaways && rawKeyTakeaways.trim()
    ? rawKeyTakeaways.split("\n").map((t) => t.trim()).filter(Boolean)
    : extractTakeaways(title, summary, plainText(content || summary));

  const sourceName = (formData.get("sourceName") as string)?.trim() || "খবরাখবর বিশেষ সংকলন";
  const sourceUrl = (formData.get("sourceUrl") as string)?.trim() || null;
  const factTable = extractFacts(title, plainText(content || summary));

  const article = await prisma.article.create({
    data: {
      title,
      slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
      summary,
      content: content && content.startsWith("<") ? sanitizeArticleHtml(content) : textToParagraphHtml(content || summary),
      keyTakeaways: JSON.stringify(takeawaysList),
      factTable: JSON.stringify(factTable),
      sourceName,
      sourceUrl,
      examTags,
      contentOrigin: "edited",
      // No stock photo stand-in: an empty value shows a plain category placeholder
      featuredImage: imageUrl || "",
      imageCaption: `উৎস: ${sourceName} • বিভাগ: ${category.name}`,
      publishedAt: "এইমাত্র প্রকাশিত",
      readTime: "৩ মিনিট",
      isLead,
      isCapsule,
      categoryId: category.id,
    },
  });

  // Attach Vocabulary if provided
  if (vocabTerm && vocabDef) {
    await prisma.vocabularyTerm.create({
      data: {
        term: vocabTerm,
        definition: vocabDef,
        context: `প্রবন্ধ: ${title}`,
        articleId: article.id,
      },
    });
  }

  // Attach Quiz if provided, or generate contextual micro-quiz automatically
  if (quizQ && opt0 && opt1) {
    const rawOptions = [opt0, opt1, opt2 || "", opt3 || ""].filter(Boolean);
    const validCorrect = Math.min(Math.max(0, correctOpt), rawOptions.length - 1);
    const { options: shuffledOpts, correctOption: newCorrect } = shuffleQuizOptions(rawOptions, validCorrect);

    await prisma.quizQuestion.create({
      data: {
        articleId: article.id,
        question: quizQ,
        options: JSON.stringify(shuffledOpts),
        correctOption: newCorrect,
        explanation: quizExp || null,
      },
    });
  } else {
    // Only build a quiz when a sentence in the article supports the answer
    const autoQuiz = buildExtractiveQuiz(title, plainText(content || summary));
    if (autoQuiz) {
      await prisma.quizQuestion.create({
        data: {
          articleId: article.id,
          question: autoQuiz.question,
          options: JSON.stringify(autoQuiz.options),
          correctOption: autoQuiz.correctOption,
          explanation: autoQuiz.explanation,
          origin: "extracted",
          sourceSentence: autoQuiz.sourceSentence,
        },
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/capsule");
  revalidatePath(`/category/${categorySlug}`);
  revalidatePath("/desk");

  return { success: true, slug: article.slug };
}
