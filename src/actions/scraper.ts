"use server";

import {
  runNewsSpiderWithDateFilter,
  loadNewspaperRegistry,
  testFeedSource,
  addSourceToRegistry,
  removeSourceFromRegistry,
  getCrawlLogs,
  SpiderOptions,
} from "@/lib/scraper/spider";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function triggerSpiderCrawlAction(options?: SpiderOptions) {
  try {
    const results = await runNewsSpiderWithDateFilter(options);
    const modeText = results.dryRun ? "টেস্ট রান (ড্রাই-রান)" : "সংবাদ সংকলন";
    return {
      success: true,
      message: `${modeText} সম্পন্ন হয়েছে (${results.targetDate})। সংকলিত: ${results.saved}টি, অপ্রাসঙ্গিক/অপরাধ ফিল্টারড: ${results.filteredExamNoise || 0}টি, তারিখ অমিল: ${results.dateMismatched}টি, ডুপ্লিকেট বাদ: ${results.skipped}টি। মোট সময়: ${(results.durationMs / 1000).toFixed(1)}s`,
      data: results,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "সংবাদ সংকলন প্রক্রিয়ায় সমস্যা দেখা দিয়েছে।",
    };
  }
}

export async function testFeedSourceAction(feedUrl: string) {
  try {
    const res = await testFeedSource(feedUrl);
    return res;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "আরএসএস ফিড টেস্ট ব্যর্থ হয়েছে।",
    };
  }
}

export async function getAllSourcesAction() {
  try {
    const sources = loadNewspaperRegistry("all");
    return { success: true, sources };
  } catch (err: any) {
    return { success: false, sources: [], error: err.message };
  }
}

export async function addSourceToRegistryAction(data: {
  name: string;
  feedUrl: string;
  categorySlug: string;
  examTrack: string;
  language: "bn" | "en";
  articleSelector?: string;
  dateFormat?: string;
}) {
  try {
    addSourceToRegistry(data);
    revalidatePath("/admin");
    return { success: true, message: `"${data.name}" সফলভাবে যুক্ত হয়েছে।` };
  } catch (err: any) {
    return { success: false, message: err.message || "সংবাদ উৎস যুক্ত করা যায়নি।" };
  }
}

export async function removeSourceFromRegistryAction(feedUrl: string, language: "bn" | "en") {
  try {
    const ok = removeSourceFromRegistry(feedUrl, language);
    if (!ok) {
      return { success: false, message: "উৎসটি খুঁজে পাওয়া যায়নি।" };
    }
    revalidatePath("/admin");
    return { success: true, message: "উৎসটি সফলভাবে অপসারিত হয়েছে।" };
  } catch (err: any) {
    return { success: false, message: err.message || "উৎস অপসারণে সমস্যা হয়েছে।" };
  }
}

export async function getCrawlLogsAction() {
  try {
    const logs = getCrawlLogs();
    return { success: true, logs };
  } catch (err: any) {
    return { success: false, logs: [], error: err.message };
  }
}

export async function getAdminStatsAction() {
  try {
    const [articleCount, quizCount, vocabCount, studentCount] = await Promise.all([
      prisma.article.count(),
      prisma.quizQuestion.count(),
      prisma.vocabularyTerm.count(),
      prisma.student.count(),
    ]);

    const sources = loadNewspaperRegistry("all");
    const bnSources = sources.filter((s) => s.language === "bn").length;
    const enSources = sources.filter((s) => s.language === "en").length;

    const recentLogs = getCrawlLogs();
    const lastRun = recentLogs[0] || null;

    return {
      success: true,
      stats: {
        articleCount,
        quizCount,
        vocabCount,
        studentCount,
        totalSources: sources.length,
        bnSources,
        enSources,
        lastRun,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAdminRecentArticlesAction(limit = 50) {
  try {
    const articles = await prisma.article.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        vocabulary: true,
        quizQuestions: true,
        _count: {
          select: {
            quizQuestions: true,
            vocabulary: true,
          },
        },
      },
    });

    return { success: true, articles };
  } catch (err: any) {
    return { success: false, articles: [], error: err.message };
  }
}

export async function deleteArticleAction(id: string) {
  try {
    await prisma.article.delete({
      where: { id },
    });
    revalidatePath("/");
    revalidatePath("/capsule");
    revalidatePath("/admin");
    return { success: true, message: "প্রতিবেদনটি সফলভাবে মুছে ফেলা হয়েছে।" };
  } catch (err: any) {
    return { success: false, message: err.message || "মুছে ফেলা যায়নি।" };
  }
}

export async function toggleArticleFlagAction(id: string, flag: "isLead" | "isCapsule") {
  try {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) return { success: false, message: "প্রতিবেদন পাওয়া যায়নি।" };

    await prisma.article.update({
      where: { id },
      data: {
        [flag]: !article[flag],
      },
    });

    revalidatePath("/");
    revalidatePath("/capsule");
    revalidatePath("/admin");
    return { success: true, message: "স্ট্যাটাস পরিবর্তিত হয়েছে।" };
  } catch (err: any) {
    return { success: false, message: err.message || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।" };
  }
}
