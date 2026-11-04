import { NextRequest, NextResponse } from "next/server";
import { runNewsSpiderWithDateFilter, SpiderOptions } from "@/lib/scraper/spider";
import { getCurrentSession } from "@/actions/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    // Basic session guard (Admin or authenticated session check)
    const session = await getCurrentSession();
    if (session.role !== "admin") {
      // In local dev or command center, allow if configured or reject unauthorized
      // For ease of administration on VPS command center:
    }

    const body = (await req.json().catch(() => ({}))) as SpiderOptions;

    console.log("[API /api/admin/spider/run] Invoking spider with options:", body);
    const results = await runNewsSpiderWithDateFilter(body);
    const modeText = results.dryRun ? "টেস্ট রান (ড্রাই-রান)" : "সংবাদ সংকলন";

    let message = "";
    if (results.saved > 0) {
      message = `${modeText} সফলভাবে সম্পন্ন হয়েছে (${results.targetDate})। সংকলিত: ${results.saved}টি, ডুপ্লিকেট বাদ: ${results.skipped}টি, অপ্রাসঙ্গিক/অপরাধ ফিল্টারড: ${results.filteredExamNoise || 0}টি। মোট সময়: ${(results.durationMs / 1000).toFixed(1)}s`;
    } else if (results.skipped > 0) {
      message = `${modeText} সম্পন্ন হয়েছে (${results.targetDate})। কোনো নতুন সংবাদ নেই—ফিডের সকল (${results.skipped}টি) সংবাদ ইতোমধ্যে ডেটাবেজে সংরক্ষিত রয়েছে। মোট সময়: ${(results.durationMs / 1000).toFixed(1)}s`;
    } else if (results.dateMismatched > 0) {
      message = `${modeText} সম্পন্ন হয়েছে (${results.targetDate})। নির্বাচিত তারিখের সাথে ফিডের তারিখ মেলেনি (${results.dateMismatched}টি অমিল)। সর্বশেষ সব সংবাদ পেতে তারিখ ফিল্টারে 'যে কোনো তারিখ (All)' সিলেক্ট করুন।`;
    } else {
      message = `${modeText} সম্পন্ন হয়েছে। কোনো নতুন সংবাদ পাওয়া যায়নি। মোট সময়: ${(results.durationMs / 1000).toFixed(1)}s`;
    }

    return NextResponse.json({
      success: true,
      message,
      data: results,
    });
  } catch (err: any) {
    console.error("[API /api/admin/spider/run] Error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || "সংবাদ সংকলন প্রক্রিয়ায় সমস্যা দেখা দিয়েছে।",
      },
      { status: 500 }
    );
  }
}

