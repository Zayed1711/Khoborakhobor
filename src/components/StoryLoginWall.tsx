import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

/**
 * Login wall for a story (visitors without an account): the headline, source and date,
 * and a way in. Nothing else of the story is sent to the browser.
 */
export default function StoryLoginWall({
  slug,
  title,
  sourceName,
  publishedAt,
  category,
  english,
}: {
  slug: string;
  title: string;
  sourceName: string | null;
  publishedAt: string;
  category: { name: string; slug: string };
  english: boolean;
}) {
  const back = encodeURIComponent(`/article/${slug}`);
  const T = english
    ? {
        lock: "Log in to read this story",
        why: "Create a free account to read the summary, key points, facts table and use the dictionary. You will come straight back to this story.",
        login: "Log in",
        signup: "Create a free account",
      }
    : {
        lock: "খবরটি পড়তে লগইন করুন",
        why: "বিনামূল্যে অ্যাকাউন্ট খুলে সারসংক্ষেপ, মূল কথা, তথ্য সারণি ও অভিধান ব্যবহার করুন। লগইনের পর সরাসরি এই খবরে ফিরে আসবেন।",
        login: "লগইন",
        signup: "বিনামূল্যে অ্যাকাউন্ট খুলুন",
      };

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col pb-16 md:pb-0">
      <Header activeSection={category.slug} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6" data-story-login-wall>
        <Link href={`/category/${category.slug}`} className="inline-flex items-center gap-1.5 text-sm text-[#68707f] hover:text-[#842323]">
          <ArrowLeft className="w-4 h-4" />
          {category.name}
        </Link>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-snug text-[#17191d] text-balance">{title}</h1>
        <p className="text-sm text-[#68707f]">
          {sourceName || ""}
          {sourceName ? " · " : ""}
          {publishedAt}
        </p>

        <section className="rounded-2xl border border-[#e4ded3] bg-white p-5 sm:p-6 space-y-4 text-center">
          <span className="mx-auto w-11 h-11 rounded-full bg-[#f5ebeb] text-[#842323] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </span>
          <h2 className="font-serif text-xl font-semibold text-[#17191d]">{T.lock}</h2>
          <p className="text-[15px] text-[#525a68] leading-relaxed">{T.why}</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-center">
            <Link href={`/login?redirect=${back}`} className="px-5 py-2.5 rounded-xl bg-[#842323] text-white font-semibold hover:bg-[#6e1d1d]">
              {T.login}
            </Link>
            <Link
              href={`/login?tab=signup&redirect=${back}`}
              className="px-5 py-2.5 rounded-xl border border-[#ded8cb] bg-white font-semibold text-[#1c1d21] hover:bg-[#faf8f4]"
            >
              {T.signup}
            </Link>
          </div>
        </section>
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
