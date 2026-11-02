"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { extractStudentTakeaways } from "@/lib/scraper/spider";
import { generateContextualMicroQuiz, shuffleQuizOptions } from "@/lib/quiz/generator";
import { extractFactTable } from "@/lib/scraper/examFilter";

function safeParseJson<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function getPublishedArticles(limit: number = 60) {
  try {
    const articles = await prisma.article.findMany({
      take: limit,
      include: {
        category: true,
        vocabulary: true,
        quizQuestions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return articles.map((a) => ({
      ...a,
      createdAtIso: a.createdAt instanceof Date ? a.createdAt.toISOString() : new Date(a.createdAt).toISOString(),
      keyTakeaways: safeParseJson(a.keyTakeaways, []),
      factTable: safeParseJson((a as any).factTable, []),
      examTagsList: a.examTags ? a.examTags.split(",").map((t) => t.trim()) : [],
      quizQuestions: a.quizQuestions.map((q) => ({
        ...q,
        options: safeParseJson(q.options, []),
      })),
    }));
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
        quizQuestions: true,
      },
    });

    if (!article && decoded !== rawSlug) {
      article = await prisma.article.findUnique({
        where: { slug: rawSlug },
        include: {
          category: true,
          vocabulary: true,
          quizQuestions: true,
        },
      });
    }

    if (!article) return null;

    return {
      ...article,
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

export async function getArticlesByCategory(categorySlug: string) {
  if (!categorySlug) return [];

  try {
    const articles = await prisma.article.findMany({
      where: {
        category: {
          slug: categorySlug,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return articles.map((a) => ({
      ...a,
      keyTakeaways: safeParseJson(a.keyTakeaways, []),
    }));
  } catch (err) {
    console.error(`[ARTICLES] Error loading articles for category (${categorySlug}):`, err);
    return [];
  }
}

// -------------------------------------------------------------
// Streamlined Content Ingestion Desk Action
// -------------------------------------------------------------
export async function ingestArticleAction(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const categorySlug = formData.get("categorySlug") as string;
  const summary = (formData.get("summary") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const imageUrl = (formData.get("imageUrl") as string)?.trim();
  const examTags = (formData.get("examTags") as string)?.trim() || "বিসিএস, সাধারণ জ্ঞান";
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
    : extractStudentTakeaways(title, content || summary, category.name);

  const sourceName = (formData.get("sourceName") as string)?.trim() || "খবরাখবর বিশেষ সংকলন";
  const sourceUrl = (formData.get("sourceUrl") as string)?.trim() || null;
  const factTable = extractFactTable(title, content || summary, category.name, sourceName);

  const article = await prisma.article.create({
    data: {
      title,
      slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
      summary,
      content: content.startsWith("<p>") ? content : `<p>${content}</p>`,
      keyTakeaways: JSON.stringify(takeawaysList),
      factTable: JSON.stringify(factTable),
      sourceName,
      sourceUrl,
      examTags,
      featuredImage:
        imageUrl ||
        "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
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
    const autoQuiz = generateContextualMicroQuiz(title, content, category.name || "জাতীয় পরিক্রমা", takeawaysList);
    await prisma.quizQuestion.create({
      data: {
        articleId: article.id,
        question: autoQuiz.question,
        options: JSON.stringify(autoQuiz.options),
        correctOption: autoQuiz.correctOption,
        explanation: autoQuiz.explanation,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/capsule");
  revalidatePath(`/category/${categorySlug}`);
  revalidatePath("/desk");

  return { success: true, slug: article.slug };
}
