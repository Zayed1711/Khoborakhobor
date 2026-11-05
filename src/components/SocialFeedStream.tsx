"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import SocialFeedCard from "./SocialFeedCard";
import DailyQuizCard from "./DailyQuizCard";
import CapsuleStoryPills from "./CapsuleStoryPills";
import DateArchiveDropdown from "./DateArchiveDropdown";
import { 
  BookOpen, Flame, CheckCircle2, XCircle, ArrowRight, ChevronDown, ChevronUp, Loader2 
} from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { isBengaliText } from "@/lib/bilingual";
import { getArticlesByDateAction, DateArchiveStats } from "@/actions/articles";
import Link from "next/link";

interface SocialFeedStreamProps {
  articles: any[];
  capsuleArticles: any[];
  categories: { id: string; name: string; slug: string }[];
  studentId?: string;
  streakDays?: number;
  featuredQuiz?: any;
  featuredEnglishQuiz?: any;
  archiveStats?: DateArchiveStats | null;
}

export default function SocialFeedStream({
  articles,
  capsuleArticles,
  categories,
  studentId,
  streakDays = 0,
  featuredQuiz,
  featuredEnglishQuiz,
  archiveStats,
}: SocialFeedStreamProps) {
  const { setMode, isEnglishMode } = useAppMode();
  const [selectedDate, setSelectedDate] = useState("all");
  const [feedArticles, setFeedArticles] = useState<any[]>(articles);
  const [isLoadingDate, setIsLoadingDate] = useState(false);

  // Synchronize when server revalidates initial articles
  useEffect(() => {
    if (selectedDate === "all") {
      setFeedArticles(articles);
    }
  }, [articles, selectedDate]);

  // Dynamic date selector fetching full historical records on demand
  const handleSelectDate = async (dateKey: string) => {
    setSelectedDate(dateKey);
    if (dateKey === "all") {
      setFeedArticles(articles);
      return;
    }
    setIsLoadingDate(true);
    try {
      const fetched = await getArticlesByDateAction(dateKey);
      setFeedArticles(fetched);
    } catch (err) {
      console.error("Failed to load articles for date:", dateKey, err);
    } finally {
      setIsLoadingDate(false);
    }
  };

  // Mobile Streak & Quiz Interactive State
  // Same language as the feed; never show a Bengali quiz in English mode or the reverse
  const activeQuiz = isEnglishMode ? featuredEnglishQuiz : featuredQuiz;
  // Filter by platform mode and selected archive date
  const filteredArticles = useMemo(() => {
    let list = feedArticles;

    // 1. Date filter (past 7 days or all)
    if (selectedDate !== "all") {
      list = list.filter((a) => {
        const raw = a.createdAtIso || a.createdAt;
        if (!raw) return false;
        const key = typeof raw === "string" 
          ? raw.split("T")[0] 
          : new Date(raw).toISOString().split("T")[0];
        return key === selectedDate;
      });
    }

    // 2. Mode filter:
    let result = list;
    if (isEnglishMode) {
      const enOnly = list.filter((a) => !isBengaliText(a.title));
      result = enOnly.length > 0 ? enOnly : (selectedDate === "all" ? enOnly : list);
    } else {
      const bnOnly = list.filter((a) => isBengaliText(a.title));
      result = bnOnly.length > 0 ? bnOnly : (selectedDate === "all" ? bnOnly : list);
    }

    // 3. Guarantee strictly latest news appears on top, then sequentially down
    return [...result].sort((a, b) => {
      const timeA = new Date(a.createdAtIso || a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAtIso || b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  }, [feedArticles, isEnglishMode, selectedDate]);

  // Render the feed in pages so phones don't mount 150 cards and 100+ images at once
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < filteredArticles.length;

  // Start from the top page again whenever the filter changes
  const [lastFilterKey, setLastFilterKey] = useState(`${selectedDate}|${isEnglishMode}`);
  const filterKey = `${selectedDate}|${isEnglishMode}`;
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((n) => n + PAGE_SIZE);
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  // Filter capsule stories by mode so English learners see English capsules
  const filteredCapsules = useMemo(() => {
    if (isEnglishMode) {
      const enCaps = capsuleArticles.filter((a) => !isBengaliText(a.title));
      return enCaps.length > 0 ? enCaps : capsuleArticles;
    } else {
      const bnCaps = capsuleArticles.filter((a) => isBengaliText(a.title));
      return bnCaps.length > 0 ? bnCaps : capsuleArticles;
    }
  }, [capsuleArticles, isEnglishMode]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Instagram / LinkedIn Style Story Capsules */}
      <CapsuleStoryPills capsuleArticles={filteredCapsules} />

      {/* 2. Today's quiz on phones and tablets (the desktop rail shows the same card).
          Always names and links its story; hidden when there is no real quiz. */}
      {activeQuiz && (
        <DailyQuizCard className="xl:hidden" quiz={activeQuiz} isEnglishMode={isEnglishMode} />
      )}

      {/* 3. Date Selection Dropdown Menu (With dynamic on-demand date loader) */}
      <DateArchiveDropdown
        articles={feedArticles}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        isEnglishMode={isEnglishMode}
        archiveStats={archiveStats}
        isLoading={isLoadingDate}
      />

      {/* 4. Main Social Newsfeed Stream */}
      <div className="space-y-3 sm:space-y-4">
        {isLoadingDate ? (
          <div className="p-10 text-center bg-white border border-[#ded8cb] rounded-2xl space-y-3 animate-fade-in">
            <Loader2 className="w-8 h-8 text-[#842323] animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-[#1c1d21]">
              {isEnglishMode ? "Loading articles from date archive..." : "আর্কাইভ থেকে প্রতিবেদন লোড করা হচ্ছে..."}
            </h4>
            <p className="text-xs text-[#717887]">
              {isEnglishMode ? "Fetching chronologically verified articles..." : "অনুগ্রহ করে অপেক্ষা করুন, প্রতিবেদনগুলো সাজানো হচ্ছে..."}
            </p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <>
            {filteredArticles.slice(0, visibleCount).map((article, index) => (
              <div
                key={article.id}
                {...(index === 0 ? { id: "tutorial-smart-reading" } : {})}
              >
                <SocialFeedCard
                  article={article}
                  studentId={studentId}
                  eagerImage={index === 0}
                />
              </div>
            ))}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className={`px-5 py-2.5 rounded-xl border border-[#ded8cb] bg-white text-sm font-semibold shadow-2xs hover:bg-[#faf8f4] transition ${
                    isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"
                  }`}
                >
                  {isEnglishMode
                    ? `Load more (${filteredArticles.length - visibleCount} left)`
                    : `আরও খবর দেখুন (বাকি ${(filteredArticles.length - visibleCount).toLocaleString("bn-BD")}টি)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 sm:p-12 text-center bg-white border border-[#ded8cb] rounded-2xl space-y-2">
            <BookOpen className="w-8 h-8 text-[#8e9aa8] mx-auto" />
            <h4 className="text-sm font-bold text-[#1c1d21]">
              {selectedDate !== "all"
                ? `${selectedDate} তারিখে কোনো প্রতিবেদন পাওয়া যায়নি`
                : isEnglishMode
                ? "No English learning articles found for this date"
                : "এই ফিল্টারে বর্তমানে কোনো বাংলা প্রতিবেদন পাওয়া যায়নি"}
            </h4>
            <p className="text-xs text-[#717887]">
              {isEnglishMode
                ? "Try exploring all categories or reset date filters."
                : "অন্যান্য বিভাগে চোখ রাখুন অথবা 'সব খবর' ও সব তারিখে ফিরে যান।"}
            </p>
            <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
              {selectedDate !== "all" && (
                <button
                  type="button"
                  onClick={() => handleSelectDate("all")}
                  className={`px-4 py-2 text-white rounded-lg text-xs font-bold cursor-pointer ${
                    isEnglishMode ? "bg-[#1e40af]" : "bg-[#842323]"
                  }`}
                >
                  {isEnglishMode ? "View All Dates" : "সব তারিখের খবর দেখুন"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setMode(isEnglishMode ? "job_prep" : "english_learning")}
                className={`px-4 py-2 bg-[#f4efe4] border border-[#ded8cc] rounded-lg text-xs font-bold cursor-pointer ${
                  isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"
                }`}
              >
                {isEnglishMode ? "চাকরি ও বিসিএস ফিডে ফিরুন" : "Switch to English Feed"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
