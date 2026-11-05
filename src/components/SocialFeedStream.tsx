"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import SocialFeedCard from "./SocialFeedCard";
import CapsuleStoryPills from "./CapsuleStoryPills";
import DateArchiveDropdown from "./DateArchiveDropdown";
import KeyNotesPanel from "./KeyNotesPanel";
import type { KeyNoteDay } from "@/lib/study/key-notes";
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
  archiveStats?: DateArchiveStats | null;
  /** Daily key notes for phones and tablets (the desktop side panel shows the same) */
  keyNotes?: KeyNoteDay[];
}

export default function SocialFeedStream({
  articles,
  capsuleArticles,
  categories,
  studentId,
  streakDays = 0,
  archiveStats,
  keyNotes = [],
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

    // 3. The daily selection comes ranked (জরুরি ১০ first); otherwise latest news on top
    if (result.some((a) => a.dailyRank)) {
      return [...result].sort((a, b) => (a.dailyRank || 999) - (b.dailyRank || 999));
    }
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

      {/* 2. Daily key notes on phones and tablets, collapsed so the ten stay on top (job/BCS mode) */}
      {!isEnglishMode && <KeyNotesPanel days={keyNotes} collapsible className="xl:hidden" />}

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
            {filteredArticles.slice(0, visibleCount).map((article, index, shown) => {
              const startsTier = article.dailyTier && article.dailyTier !== shown[index - 1]?.dailyTier;
              return (
                <div key={article.id} className="space-y-3 sm:space-y-4">
                  {startsTier && (
                    <FeedSectionHeading
                      tier={article.dailyTier}
                      isEnglishMode={isEnglishMode}
                      isToday={selectedDate === "all"}
                      count={filteredArticles.filter((a) => a.dailyTier === article.dailyTier).length}
                    />
                  )}
                  <div {...(index === 0 ? { id: "tutorial-smart-reading" } : {})}>
                    <SocialFeedCard
                      article={article}
                      studentId={studentId}
                      eagerImage={index === 0}
                    />
                  </div>
                </div>
              );
            })}
            {!hasMore && filteredArticles.some((a) => a.dailyTier) && (
              <p className="text-center text-xs text-[#717887] py-2">
                {isEnglishMode
                  ? `That's ${selectedDate === "all" ? "today's" : "this day's"} top ${filteredArticles.length}. More selected stories are on the section pages above; pick a date to see other days.`
                  : `${selectedDate === "all" ? "আজকের" : "এই দিনের"} জরুরি খবর এখানেই শেষ। বাছাই করা আরও খবর ওপরের বিভাগগুলোতে পাবেন; অন্য দিনের খবর দেখতে তারিখ বেছে নিন।`}
              </p>
            )}
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

/** Heading above each part of the daily selection. Calm: a label and one line, no alarm colours. */
function FeedSectionHeading({
  tier,
  isEnglishMode,
  isToday,
  count,
}: {
  tier: "urgent" | "more";
  isEnglishMode: boolean;
  isToday: boolean;
  count: number;
}) {
  const accent = isEnglishMode ? "text-[#1e40af]" : "text-[#842323]";
  const bn = (n: number) => n.toLocaleString("bn-BD");
  const title =
    tier === "urgent"
      ? isEnglishMode
        ? `${isToday ? "Today's" : "The day's"} top ${count}`
        : `${isToday ? "আজকের" : "এই দিনের"} জরুরি ${bn(count)}`
      : isEnglishMode
      ? "More worth knowing"
      : "আরও যা জানা দরকার";
  const note =
    tier === "urgent"
      ? isEnglishMode
        ? "The stories most useful for exams, plus the day's most talked-about news; each story once."
        : "পরীক্ষার জন্য সবচেয়ে কাজের খবর ও আজকের আলোচিত খবর, একই খবর একবারই।"
      : isEnglishMode
      ? "Read these if you have time."
      : "সময় থাকলে এগুলোও পড়ে নিন।";
  return (
    <div className="px-1 pt-1">
      <h2 className={`font-serif text-lg ${accent}`}>{title}</h2>
      <p className="text-xs text-[#717887]">{note}</p>
    </div>
  );
}
