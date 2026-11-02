"use client";

import { useState, useMemo, useEffect } from "react";
import SocialFeedCard from "./SocialFeedCard";
import CapsuleStoryPills from "./CapsuleStoryPills";
import DateArchiveStrip from "./DateArchiveStrip";
import { 
  Sparkles, Filter, BookOpen, Globe, Languages, GraduationCap, 
  Flame, HelpCircle, CheckCircle2, XCircle, ArrowRight, ChevronDown, ChevronUp 
} from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { isBengaliText } from "@/lib/bilingual";
import Link from "next/link";

interface SocialFeedStreamProps {
  articles: any[];
  capsuleArticles: any[];
  categories: { id: string; name: string; slug: string }[];
  studentId?: string;
  streakDays?: number;
  featuredQuiz?: any;
  featuredEnglishQuiz?: any;
}

const ENGLISH_CATEGORY_NAMES: Record<string, string> = {
  national: "National & Policy",
  world: "Global Affairs",
  economy: "Business & Economy",
  tech: "Tech & Science",
  entertainment: "Culture & Arts",
  sports: "Sports & Fitness",
  politics: "Governance & Law",
  opinion: "Editorials & Opinions",
  lifestyle: "Lifestyle & Learning",
  "exam-prep": "Vocabulary & Exams",
};

export default function SocialFeedStream({
  articles,
  capsuleArticles,
  categories,
  studentId,
  streakDays = 0,
  featuredQuiz,
  featuredEnglishQuiz,
}: SocialFeedStreamProps) {
  const { mode, setMode, isEnglishMode } = useAppMode();
  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");

  // Mobile Streak & Quiz Interactive State
  const activeQuiz = isEnglishMode ? (featuredEnglishQuiz || featuredQuiz) : featuredQuiz;
  const [mobileQuizSelected, setMobileQuizSelected] = useState<number | null>(null);
  const [mobileQuizAnswered, setMobileQuizAnswered] = useState(false);
  const [isMobileQuizExpanded, setIsMobileQuizExpanded] = useState(true);

  useEffect(() => {
    setMobileQuizSelected(null);
    setMobileQuizAnswered(false);
  }, [isEnglishMode, activeQuiz?.question]);

  const handleMobileQuizSelect = (idx: number) => {
    if (mobileQuizAnswered) return;
    setMobileQuizSelected(idx);
    setMobileQuizAnswered(true);
  };

  const filterPills = useMemo(() => {
    if (isEnglishMode) {
      return [
        { name: "All English Feed", slug: "all" },
        ...categories.map((c) => ({
          name: ENGLISH_CATEGORY_NAMES[c.slug] || c.name.split("(")[0].trim(),
          slug: c.slug,
        })),
      ];
    }
    return [
      { name: "সব খবর (All Feed)", slug: "all" },
      ...categories.map((c) => ({ name: c.name.split("(")[0].trim(), slug: c.slug })),
    ];
  }, [categories, isEnglishMode]);

  // Count articles by language for feedback
  const { bnCount, enCount } = useMemo(() => {
    let bn = 0;
    let en = 0;
    for (const a of articles) {
      if (isBengaliText(a.title)) bn++;
      else en++;
    }
    return { bnCount: bn, enCount: en };
  }, [articles]);

  // Filter by category, platform mode, and selected archive date
  const filteredArticles = useMemo(() => {
    let list = articles;

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

    // 2. Category filter
    if (selectedCat !== "all") {
      list = list.filter((a) => a.category?.slug === selectedCat);
    }

    // 3. Mode filter:
    if (isEnglishMode) {
      const enOnly = list.filter((a) => !isBengaliText(a.title));
      return enOnly.length > 0 ? enOnly : (selectedDate === "all" && selectedCat === "all" ? enOnly : list);
    } else {
      const bnOnly = list.filter((a) => isBengaliText(a.title));
      return bnOnly.length > 0 ? bnOnly : (selectedDate === "all" && selectedCat === "all" ? bnOnly : list);
    }
  }, [articles, selectedCat, isEnglishMode, selectedDate]);

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

      {/* 2. Mobile Gamified Study Streak & Daily Challenge Card (Strictly mobile only: md:hidden) */}
      {activeQuiz && (
        <div className="md:hidden bg-white border border-[#ded8cb] rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2.5">
          {/* Header Row with Streak */}
          <div className="flex items-center justify-between pb-2 border-b border-[#f4efe4]">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Flame className={`w-4 h-4 ${isEnglishMode ? "text-blue-600 fill-blue-600" : "text-orange-500 fill-orange-500"}`} />
              <span className={isEnglishMode ? "text-blue-900" : "text-amber-900"}>
                {isEnglishMode ? "Daily Streak" : "ডেইলি স্ট্রিক"}
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                isEnglishMode ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200"
              }`}>
                {streakDays} {isEnglishMode ? "Days!" : "দিন!"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileQuizExpanded(!isMobileQuizExpanded)}
              className="text-xs text-[#717887] hover:text-[#1c1d21] flex items-center gap-1 font-medium"
            >
              <span>{isEnglishMode ? "10s Recall" : "১০-সেকেন্ড রিকল"}</span>
              {isMobileQuizExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expandable Daily Challenge Body */}
          {isMobileQuizExpanded && (
            <div className="space-y-2.5 pt-0.5">
              <p className="text-xs font-bold text-[#1c1d21] leading-snug">
                {activeQuiz.question}
              </p>

              <div className="space-y-1.5">
                {activeQuiz.options?.map((opt: string, idx: number) => {
                  let btnStyle = "bg-[#faf8f4] border-[#ded8cb] hover:bg-[#f0ebe0] text-[#343a46]";
                  if (mobileQuizAnswered) {
                    if (idx === activeQuiz.correctOption) {
                      btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold";
                    } else if (mobileQuizSelected === idx) {
                      btnStyle = "bg-rose-50 border-rose-400 text-rose-950";
                    }
                  } else if (mobileQuizSelected === idx) {
                    btnStyle = "bg-[#f5ebeb] border-[#842323] text-[#842323] font-semibold";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={mobileQuizAnswered}
                      onClick={() => handleMobileQuizSelect(idx)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {mobileQuizAnswered && idx === activeQuiz.correctOption && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {mobileQuizAnswered && mobileQuizSelected === idx && idx !== activeQuiz.correctOption && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {mobileQuizAnswered && (
                <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-[11px] text-[#3b414d] leading-relaxed animate-fade-in">
                  <span className="font-bold text-[#1c1d21]">ব্যাখ্যা: </span>
                  {activeQuiz.explanation || "সঠিক উত্তর যাচাই সম্পন্ন হয়েছে।"}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Past 7-Day Date Archive Strip */}
      <DateArchiveStrip
        articles={articles}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* 4. Platform Mode Stream Banner & Category Pills */}
      <div
        id="tutorial-feed-language"
        className="bg-white border border-[#ded8cb] rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-2.5 transition-all"
      >
        {/* Mode Stream Switcher (Desktop and Tablet helper, compact on mobile) */}
        <div className="flex items-center justify-between pb-2 border-b border-[#f4efe4] px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#404652]">
            {isEnglishMode ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-[#1e40af]" />
                <span className="hidden sm:inline">Active Track: <strong className="text-[#1e40af]">English Learning</strong></span>
                <span className="sm:hidden font-bold text-[#1e40af]">English Track</span>
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5 text-[#842323]" />
                <span className="hidden sm:inline">সক্রিয় মোড: <strong className="text-[#842323]">চাকরি ও বিসিএস</strong></span>
                <span className="sm:hidden font-bold text-[#842323]">চাকরি ও বিসিএস</span>
              </>
            )}
          </div>

          <div className="inline-flex rounded-lg border border-[#ded8cc] bg-[#faf8f4] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode("job_prep")}
              className={`px-2.5 sm:px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 sm:gap-1.5 ${
                !isEnglishMode
                  ? "bg-[#842323] text-white shadow-2xs"
                  : "text-[#525a68] hover:text-[#1c1d21] hover:bg-[#ede7da]"
              }`}
            >
              <span>চাকরি ও বিসিএস</span>
              <span className="text-[10px] opacity-80 font-mono">({bnCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("english_learning")}
              className={`px-2.5 sm:px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 sm:gap-1.5 ${
                isEnglishMode
                  ? "bg-[#1e40af] text-white shadow-2xs"
                  : "text-[#525a68] hover:text-[#1c1d21] hover:bg-[#ede7da]"
              }`}
            >
              <span>English Feed</span>
              <span className="text-[10px] opacity-80 font-mono">({enCount})</span>
            </button>
          </div>
        </div>

        {/* Category Pills Bar (Horizontal swipeable on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {filterPills.map((pill) => {
            const isSelected = selectedCat === pill.slug;

            return (
              <button
                key={pill.slug}
                type="button"
                onClick={() => setSelectedCat(pill.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                  isSelected
                    ? isEnglishMode
                      ? "bg-[#1e40af] text-white shadow-2xs font-bold"
                      : "bg-[#842323] text-white shadow-2xs font-bold"
                    : "bg-[#faf8f4] hover:bg-[#ece7da] text-[#404652] border border-[#ded8cb]"
                }`}
              >
                {pill.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Main Social Newsfeed Stream */}
      <div className="space-y-3 sm:space-y-4">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article, index) => (
            <div
              key={article.id}
              {...(index === 0 ? { id: "tutorial-smart-reading" } : {})}
            >
              <SocialFeedCard
                article={article}
                studentId={studentId}
              />
            </div>
          ))
        ) : (
          <div className="p-8 sm:p-12 text-center bg-white border border-[#ded8cb] rounded-2xl space-y-2">
            <BookOpen className="w-8 h-8 text-[#8e9aa8] mx-auto" />
            <h4 className="text-sm font-bold text-[#1c1d21]">
              {selectedDate !== "all"
                ? `${selectedDate} তারিখে নির্বাচিত ক্যাটাগরিতে কোনো প্রতিবেদন পাওয়া যায়নি`
                : isEnglishMode
                ? "No English learning articles found in this category"
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
                  onClick={() => setSelectedDate("all")}
                  className={`px-4 py-2 text-white rounded-lg text-xs font-bold ${
                    isEnglishMode ? "bg-[#1e40af]" : "bg-[#842323]"
                  }`}
                >
                  {isEnglishMode ? "View All Dates" : "সব তারিখের খবর দেখুন"}
                </button>
              )}
              {selectedCat !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCat("all")}
                  className={`px-4 py-2 text-white rounded-lg text-xs font-bold ${
                    isEnglishMode ? "bg-[#1e40af]" : "bg-[#842323]"
                  }`}
                >
                  {isEnglishMode ? "All Categories" : "সকল বিভাগে ফিরুন"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setMode(isEnglishMode ? "job_prep" : "english_learning")}
                className={`px-4 py-2 bg-[#f4efe4] border border-[#ded8cc] rounded-lg text-xs font-bold ${
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
