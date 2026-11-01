"use client";

import { useState, useMemo } from "react";
import SocialFeedCard from "./SocialFeedCard";
import CapsuleStoryPills from "./CapsuleStoryPills";
import DateArchiveStrip from "./DateArchiveStrip";
import { Sparkles, Filter, BookOpen, Globe, Languages, GraduationCap } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { isBengaliText } from "@/lib/bilingual";

interface SocialFeedStreamProps {
  articles: any[];
  capsuleArticles: any[];
  categories: { id: string; name: string; slug: string }[];
  studentId?: string;
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
}: SocialFeedStreamProps) {
  const { mode, setMode, isEnglishMode } = useAppMode();
  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");

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
    // If English mode, strictly display English articles
    // If Job Prep mode, display Bengali articles (or fall back to list if empty)
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
    <div className="space-y-4">
      {/* 1. Instagram / LinkedIn Style Story Capsules */}
      <CapsuleStoryPills capsuleArticles={filteredCapsules} />

      {/* 2. Past 7-Day Date Archive Strip */}
      <DateArchiveStrip
        articles={articles}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* 3. Platform Mode Toggle Banner & Category Filters */}
      <div
        id="tutorial-feed-language"
        className="bg-white border border-[#ded8cb] rounded-2xl p-2.5 shadow-2xs space-y-2 transition-all"
      >
        {/* Mode Stream Switcher */}
        <div className="flex items-center justify-between pb-2 border-b border-[#f4efe4] px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#404652]">
            {isEnglishMode ? (
              <>
                <BookOpen className="w-3.5 h-3.5 text-[#1e40af]" />
                <span>Active Track: <strong className="text-[#1e40af]">English Learning</strong></span>
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5 text-[#842323]" />
                <span>সক্রিয় মোড: <strong className="text-[#842323]">চাকরি ও বিসিএস প্রস্তুতি</strong></span>
              </>
            )}
          </div>

          <div className="inline-flex rounded-lg border border-[#ded8cc] bg-[#faf8f4] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMode("job_prep")}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
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
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                isEnglishMode
                  ? "bg-[#1e40af] text-white shadow-2xs"
                  : "text-[#525a68] hover:text-[#1c1d21] hover:bg-[#ede7da]"
              }`}
            >
              <span>🇬🇧 English Feed</span>
              <span className="text-[10px] opacity-80 font-mono">({enCount})</span>
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
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

      {/* 4. Main Social Newsfeed Stream */}
      <div className="space-y-4">
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
          <div className="p-12 text-center bg-white border border-[#ded8cb] rounded-2xl space-y-2">
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
