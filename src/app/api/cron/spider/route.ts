import { NextRequest, NextResponse } from "next/server";
import { runNewsSpiderWithDateFilter } from "@/lib/scraper/spider";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * Validate incoming request authorization against CRON_SECRET
 * Supports both Vercel Cron "Bearer <token>" header and "?secret=<token>" query parameter.
 */
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // In development mode or if CRON_SECRET is not configured, permit requests with a notice
  if (!cronSecret || process.env.NODE_ENV !== "production") {
    return true;
  }

  // 1. Check Bearer Token (Standard Vercel Cron behavior)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // 2. Check query parameter ?secret=
  const secretParam = req.nextUrl.searchParams.get("secret");
  if (secretParam && secretParam === cronSecret) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}

async function handleCronExecution(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        success: false,
        error: "অননুমোদিত অ্যাক্সেস (Unauthorized): সঠিক CRON_SECRET প্রদান করুন।",
      },
      { status: 401 }
    );
  }

  try {
    const url = req.nextUrl;
    const targetDate = url.searchParams.get("targetDate") || new Date().toISOString().split("T")[0];
    const language = (url.searchParams.get("language") || "all") as "all" | "bn" | "en";
    const categorySlug = url.searchParams.get("categorySlug") || undefined;
    const sourceName = url.searchParams.get("sourceName") || undefined;
    const dryRun = url.searchParams.get("dryRun") === "true";
    const limitPerSource = Number(url.searchParams.get("limitPerSource")) || 15;

    console.log(
      `[CRON /api/cron/spider] স্বয়ংক্রিয় সংবাদ সংকলন শুরু: তারিখ=${targetDate}, ভাষা=${language}, ড্রাই-রান=${dryRun}`
    );

    const results = await runNewsSpiderWithDateFilter({
      targetDate,
      language,
      categorySlug,
      sourceName,
      dryRun,
      limitPerSource,
    });

    if (!dryRun) {
      revalidatePath("/");
      revalidatePath("/capsule");
      revalidatePath("/desk");
      revalidatePath("/admin");
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? `ড্রাই-রান প্রিভিউ সম্পন্ন (${targetDate})`
        : `স্বয়ংক্রিয় সংবাদ সংকলন ও এনালাইসিস সফলভাবে সম্পন্ন হয়েছে (${targetDate})`,
      execution: {
        timestamp: new Date().toISOString(),
        targetDate: results.targetDate,
        language,
        durationSeconds: Number((results.durationMs / 1000).toFixed(2)),
        sourcesProcessed: results.sourcesCount,
        savedArticles: results.saved,
        skippedDuplicates: results.skipped,
        dateMismatched: results.dateMismatched,
        errors: results.errors,
        dryRun: results.dryRun,
        sampleItems: results.items.slice(0, 10),
      },
    });
  } catch (err: any) {
    console.error("[ERROR] [CRON /api/cron/spider] ত্রুটি:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "ক্রন এক্সিকিউশনের সময় সমস্যা দেখা দিয়েছে।",
      },
      { status: 500 }
    );
  }
}
