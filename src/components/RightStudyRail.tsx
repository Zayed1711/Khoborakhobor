"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Flame, Sparkles, TrendingUp, HelpCircle, 
  CheckCircle2, XCircle, ArrowRight, ShieldCheck 
} from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";

interface RightStudyRailProps {
  streakDays?: number;
  featuredQuiz?: {
    question: string;
    options: string[];
    correctOption: number;
    explanation?: string | null;
  };
}

export default function RightStudyRail({
  streakDays = 14,
  featuredQuiz = {
    question: "কেন্দ্রীয় ব্যাংকের সম্প্রসারিত মুদ্রানীতির প্রাথমিক লক্ষ্য কোনটি?",
    options: [
      "অর্থ সরবরাহ বৃদ্ধি ও অর্থনৈতিক বিনিয়োগ বাড়ানো",
      "ব্যাংকিং সুদের হার সর্বোচ্চ বৃদ্ধি করা",
      "নিত্যপ্রয়োজনীয় পণ্যের আমদানি সম্পূর্ণ বন্ধ করা",
      "সরকারি বৈদেশিক রিজার্ভ হ্রাস করা"
    ],
    correctOption: 0,
    explanation: "সম্প্রসারিত মুদ্রানীতি (Expansionary Monetary Policy) বাজারে অর্থ সরবরাহ বাড়িয়ে বিনিয়োগ ও উৎপাদন ত্বরান্বিত করে।"
  },
}: RightStudyRailProps) {
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const TRENDING_HASHTAGS = [
    { tag: "বিসিএস৫২", count: "১২টি বিশ্লেষণ" },
    { tag: "মুদ্রানীতি", count: "৮টি প্রতিবেদন" },
    { tag: "মেট্রোরেল", count: "৫টি সংবাদ" },
    { tag: "কৃত্রিম_বুদ্ধিমত্তা", count: "১৪টি প্রবন্ধ" },
    { tag: "মধ্যপ্রাচ্য_কূটনীতি", count: "৯টি আপডেট" },
  ];

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOpt(idx);
    setAnswered(true);
  };

  return (
    <aside className="w-80 shrink-0 hidden xl:flex flex-col gap-4 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto py-2 pr-1 select-none">
      {/* 1. Daily Study Streak Card */}
      <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 rounded-2xl shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>ডেইলি স্টাডি স্ট্রিক</span>
          </div>
          <span className="text-xs font-black font-mono text-orange-600 bg-white px-2 py-0.5 rounded-full border border-orange-200">
            {streakDays} দিন!
          </span>
        </div>
        <p className="text-xs text-amber-800/80 leading-relaxed font-sans">
          ধারাবাহিকতা সাফল্যের মূল চাবিকাঠি। প্রতিদিন অন্তত ৩টি বিশ্লেষণ পাঠ সম্পন্ন করুন।
        </p>
      </div>

      {/* 2. Micro-Quiz of the Day Challenge */}
      <div id="tutorial-daily-quiz" className="p-4 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-3 transition-all">
        <div className="flex items-center justify-between pb-2 border-b border-[#f4efe4]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#842323]">
            <HelpCircle className="w-4 h-4 text-[#842323]" />
            <span>আজকের কুইজ চ্যালেঞ্জ</span>
          </div>
          <span className="text-[10px] text-[#717887]">একটিভ রিকল</span>
        </div>

        <p className="text-xs font-bold text-[#1c1d21] leading-snug">
          {featuredQuiz.question}
        </p>

        <div className="space-y-1.5">
          {featuredQuiz.options.map((opt, idx) => {
            let btnStyle = "bg-[#fbf9f5] border-[#ded8cb] hover:bg-[#f6f2e8] text-[#343a46]";
            if (answered) {
              if (idx === featuredQuiz.correctOption) {
                btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold";
              } else if (selectedOpt === idx) {
                btnStyle = "bg-rose-50 border-rose-300 text-rose-900";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={answered}
                onClick={() => handleSelect(idx)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {answered && idx === featuredQuiz.correctOption && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {answered && selectedOpt === idx && idx !== featuredQuiz.correctOption && (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="p-2.5 bg-[#faf8f4] border border-[#ded8cb] rounded-lg text-[11px] text-[#404652] leading-relaxed animate-fade-in">
            <span className="font-bold text-[#1c1d21]">ব্যাখ্যা: </span>
            {featuredQuiz.explanation}
          </div>
        )}
      </div>

      {/* 3. Trending Topics & Hashtags */}
      <div className="p-4 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c1d21] pb-2 border-b border-[#f4efe4]">
          <TrendingUp className="w-4 h-4 text-[#842323]" />
          <span>আজকের ট্রেন্ডিং বিষয়বস্তু</span>
        </div>

        <div className="space-y-2">
          {TRENDING_HASHTAGS.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs hover:bg-[#faf8f4] p-1.5 rounded-lg transition"
            >
              <span className="font-semibold text-[#343a46]">
                #{h.tag}
              </span>
              <span className="text-[10px] text-[#788191] font-mono">
                {h.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Eye-Care Reading Themes */}
      <div className="p-4 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#737b88] block">
          কাগজের আভা ও চোখের প্রশান্তি:
        </span>
        <ThemeSwitcher />
      </div>

      {/* 5. Copyright Notice (Signature hidden in data attribute) */}
      <div 
        data-digital-signature="KK-RAIL-AUTH-2026"
        className="p-3 text-[10px] text-[#8e95a2] space-y-1 leading-relaxed font-sans"
      >
        <p>&copy; ২০২৬ খবরাখবর (KhoboraKhobor)</p>
        <p className="text-[9px] text-[#a0a8b5]">সর্বস্বত্ব সংরক্ষিত।</p>
      </div>
    </aside>
  );
}

