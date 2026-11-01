"use client";

import { useState, useMemo } from "react";
import SocialFeedCard from "./SocialFeedCard";
import CapsuleStoryPills from "./CapsuleStoryPills";
import DateArchiveStrip from "./DateArchiveStrip";
import { Sparkles, Filter, BookOpen, Globe, Languages, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { isBengaliText } from "@/lib/bilingual";

interface SocialFeedStreamProps {
  articles: any[];
  capsuleArticles: any[];
  categories: { id: string; name: string; slug: string }[];
  studentId?: string;
}

export default function SocialFeedStream({
  articles,
  capsuleArticles,
  categories,
  studentId,
}: SocialFeedStreamProps) {
  const { language, setLanguage } = useLanguage();
  const [selectedCat, setSelectedCat] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");

  const FILTER_PILLS = [
    { name: "সব খবর (All Feed)", slug: "all" },
    ...categories.map((c) => ({ name: c.name.split("(")[0].trim(), slug: c.slug })),
  ];

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

  // Filter by category, language mode, and selected archive date
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

    // 3. Language filter:
    // If language is "bn", display Bengali articles
    // If language is "en", display English articles
    if (language === "bn") {
      const bnOnly = list.filter((a) => isBengaliText(a.title));
      return bnOnly.length > 0 ? bnOnly : (selectedDate === "all" && selectedCat === "all" ? bnOnly : list);
    } else {
      const enOnly = list.filter((a) => !isBengaliText(a.title));
      return enOnly.length > 0 ? enOnly : (selectedDate === "all" && selectedCat === "all" ? enOnly : list);
    }
  }, [articles, selectedCat, language, selectedDate]);

  // Filter capsule stories by language mode so Bengali readers see Bengali capsules
  const filteredCapsules = useMemo(() => {
    if (language === "bn") {
      const bnCaps = capsuleArticles.filter((a) => isBengaliText(a.title));
      return bnCaps.length > 0 ? bnCaps : capsuleArticles;
    } else {
      const enCaps = capsuleArticles.filter((a) => !isBengaliText(a.title));
      return enCaps.length > 0 ? enCaps : capsuleArticles;
    }
  }, [capsuleArticles, language]);

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

      {/* 3. Language Mode Toggle Banner & Category Filters */}
      <div
        id="tutorial-feed-language"
        className="bg-white border border-[#ded8cb] rounded-2xl p-2.5 shadow-2xs space-y-2 transition-all"
      >
        {/* Language Stream Switcher */}
        <div className="flex items-center justify-between pb-2 border-b border-[#f4efe4] px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#404652]">
            <Globe className="w-3.5 h-3.5 text-[#842323]" />
            <span>ফিড ভাষা (Feed Language):</span>
          </div>

          <div className="inline-flex rounded-lg border border-[#ded8cc] bg-[#faf8f4] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLanguage("bn")}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                language === "bn"
                  ? "bg-[#842323] text-white shadow-2xs"
                  : "text-[#525a68] hover:text-[#1c1d21] hover:bg-[#ede7da]"
              }`}
            >
              <span>বাংলা সংবাদ</span>
              <span className="text-[10px] opacity-80 font-mono">({bnCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 ${
                language === "en"
                  ? "bg-[#842323] text-white shadow-2xs"
                  : "text-[#525a68] hover:text-[#1c1d21] hover:bg-[#ede7da]"
              }`}
            >
              <span>English Studies</span>
              <span className="text-[10px] opacity-80 font-mono">({enCount})</span>
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {FILTER_PILLS.map((pill) => {
            const isSelected = selectedCat === pill.slug;

            return (
              <button
                key={pill.slug}
                type="button"
                onClick={() => setSelectedCat(pill.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                  isSelected
                    ? "bg-[#842323] text-white shadow-2xs font-bold"
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
                : language === "bn"
                ? "এই ফিল্টারে বর্তমানে কোনো বাংলা প্রতিবেদন পাওয়া যায়নি"
                : "No English study articles found in this category"}
            </h4>
            <p className="text-xs text-[#717887]">
              অন্যান্য বিভাগে চোখ রাখুন অথবা &apos;সব খবর&apos; ও সব তারিখে ফিরে যান।
            </p>
            <div className="flex items-center justify-center flex-wrap gap-2 pt-2">
              {selectedDate !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedDate("all")}
                  className="px-4 py-2 bg-[#842323] text-white rounded-lg text-xs font-bold"
                >
                  সব তারিখের খবর দেখুন
                </button>
              )}
              {selectedCat !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedCat("all")}
                  className="px-4 py-2 bg-[#842323] text-white rounded-lg text-xs font-bold"
                >
                  সকল বিভাগে ফিরুন
                </button>
              )}
              <button
                type="button"
                onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
                className="px-4 py-2 bg-[#f4efe4] text-[#842323] border border-[#ded8cc] rounded-lg text-xs font-bold"
              >
                {language === "bn" ? "English ফিড দেখুন" : "বাংলা ফিড দেখুন"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

