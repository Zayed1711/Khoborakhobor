import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getDailyCapsuleArticles } from "@/actions/student";
import { getCurrentSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Zap, Clock, ArrowRight, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DailyCapsulePage() {
  const [capsuleArticles, allCategories, session] = await Promise.all([
    getDailyCapsuleArticles(),
    prisma.category.findMany({ orderBy: { createdAt: "asc" } }),
    getCurrentSession(),
  ]);

  const now = new Date();
  const currentDate = now.toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans pb-16 md:pb-0">
      <Header categories={allCategories} session={session} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Banner Header */}
        <header className="border-b border-[#ded8cb] pb-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#842323] text-white">
              <Zap className="w-3.5 h-3.5 text-[#f5c66b]" />
              দৈনিক ৫-মিনিট কারেন্ট অ্যাফেয়ার্স ক্যাপসুল
            </span>
            <span className="text-xs text-[#717887] font-mono">{currentDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17191d] font-serif leading-snug">
            বিসিএস, ভর্তি পরীক্ষা ও সাধারণ জ্ঞানের সার্বিক সারসংক্ষেপ
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#505764] leading-relaxed">
            আজকের দিনভর আলোচিত শীর্ষ সংবাদ ও জাতীয় নীতিসমূহের শিক্ষণীয় মূলবিন্দু একসাথে সাজানো হয়েছে।
            অতিরিক্ত বিভ্রান্তিমুক্তভাবে ৫ মিনিটে দিনের প্রস্তুতি শেষ করুন।
          </p>
        </header>

        {/* Capsule Briefings List */}
        <div className="space-y-6">
          {capsuleArticles.map((art, idx) => (
            <article
              key={art.id}
              className="p-5 bg-white border border-[#e3ded4] rounded-lg shadow-2xs hover:border-[#cec6b6] transition"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#f4efe4] text-[#842323] flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#842323] uppercase tracking-wider">
                    {art.category.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#788191]">
                  <Clock className="w-3 h-3" />
                  <span>{art.readTime}</span>
                </div>
              </div>

              <Link href={`/article/${art.slug}`}>
                <h2 className="text-base sm:text-lg font-bold text-[#1c1d21] hover:text-[#842323] font-serif leading-snug">
                  {art.title}
                </h2>
              </Link>
              <p className="mt-2 text-xs text-[#505764] leading-relaxed line-clamp-2">
                {art.summary}
              </p>

              {/* Key Takeaways */}
              {art.keyTakeaways && art.keyTakeaways.length > 0 && (
                <div className="mt-3 p-3 bg-[#faf8f4] border border-[#eee9df] rounded text-xs space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1c1d21] block">
                    শিক্ষণীয় মূল বিষয়সমূহ:
                  </span>
                  <ul className="space-y-1 text-[#3b414d] list-disc list-inside">
                    {art.keyTakeaways.map((point: string, pIdx: number) => (
                      <li key={pIdx} className="leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Vocabulary Preview & Link */}
              <div className="mt-4 pt-3 border-t border-[#f0ebdf] flex items-center justify-between text-xs">
                {art.vocabulary && art.vocabulary.length > 0 ? (
                  <div className="flex items-center gap-1 text-xs text-[#6b7280]">
                    <Sparkles className="w-3 h-3 text-[#c29547]" />
                    <span>পারিভাষিক শব্দ: {art.vocabulary.map((v: any) => v.term).join(", ")}</span>
                  </div>
                ) : (
                  <span />
                )}
                <Link
                  href={`/article/${art.slug}`}
                  className="text-xs font-semibold text-[#842323] hover:underline flex items-center gap-1"
                >
                  <span>সম্পূর্ণ প্রতিবেদন ও কুইজ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>

      <MobileBottomNav />
      <Footer />
    </div>
  );
}

