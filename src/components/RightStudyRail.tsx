"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Flame, Sparkles, TrendingUp, HelpCircle, 
  CheckCircle2, XCircle, ArrowRight, ShieldCheck, BookOpen, GraduationCap 
} from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import { useAppMode } from "@/context/LanguageContext";

interface RightStudyRailProps {
  streakDays?: number;
  featuredQuiz?: {
    question: string;
    options: string[];
    correctOption: number;
    explanation?: string | null;
  };
}

const DEFAULT_GK_QUIZ = {
  question: "কেন্দ্রীয় ব্যাংকের সম্প্রসারিত মুদ্রানীতির প্রাথমিক লক্ষ্য কোনটি?",
  options: [
    "অর্থ সরবরাহ বৃদ্ধি ও অর্থনৈতিক বিনিয়োগ বাড়ানো",
    "ব্যাংকিং সুদের হার সর্বোচ্চ বৃদ্ধি করা",
    "নিত্যপ্রয়োজনীয় পণ্যের আমদানি সম্পূর্ণ বন্ধ করা",
    "সরকারি বৈদেশিক রিজার্ভ হ্রাস করা",
  ],
  correctOption: 0,
  explanation: "সম্প্রসারিত মুদ্রানীতি (Expansionary Monetary Policy) বাজারে অর্থ সরবরাহ বাড়িয়ে বিনিয়োগ ও উৎপাদন ত্বরান্বিত করে।",
};

const DEFAULT_ENGLISH_QUIZ = {
  question: "এই প্যাসেজে \"rein in\" শব্দটা দিয়ে কী বোঝানো হয়েছে?",
  options: [
    "Control or restrain (নিয়ন্ত্রণ বা রাশ টেনে ধরা)",
    "Increase rapidly (দ্রুত হারে বৃদ্ধি পাওয়া)",
    "Postpone indefinitely (অনির্দিষ্টকালের জন্য পিছিয়ে দেওয়া)",
    "Ignore completely (পুরোপুরি এড়িয়ে চলা)",
  ],
  correctOption: 0,
  explanation: "\"Rein in\" একটি অত্যন্ত গুরুত্বপূর্ণ ইংরেজি phrasal verb, যার অর্থ লাগাম টেনে ধরা বা কোনো কিছুকে নিয়ন্ত্রণে রাখা।",
};

const GK_TRENDING_HASHTAGS = [
  { tag: "বিসিএস৫২", count: "১২টি বিশ্লেষণ" },
  { tag: "মুদ্রানীতি", count: "৮টি প্রতিবেদন" },
  { tag: "মেট্রোরেল", count: "৫টি সংবাদ" },
  { tag: "কৃত্রিম_বুদ্ধিমত্তা", count: "১৪টি প্রবন্ধ" },
  { tag: "মধ্যপ্রাচ্য_কূটনীতি", count: "৯টি আপডেট" },
];

const ENGLISH_TRENDING_HASHTAGS = [
  { tag: "TheDailyStar_Editorial", count: "১৫টি বিশ্লেষণ" },
  { tag: "Vocabulary_Builder", count: "২৮টি নতুন শব্দ" },
  { tag: "TBS_Business", count: "১০টি প্রতিবেদন" },
  { tag: "IELTS_Reading", count: "১৮টি প্যাসেজ" },
  { tag: "Global_Diplomacy", count: "১২টি খবর" },
];

export default function RightStudyRail({
  streakDays = 14,
  featuredQuiz = DEFAULT_GK_QUIZ,
}: RightStudyRailProps) {
  const { isEnglishMode } = useAppMode();
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const activeQuiz = isEnglishMode ? DEFAULT_ENGLISH_QUIZ : (featuredQuiz || DEFAULT_GK_QUIZ);
  const activeHashtags = isEnglishMode ? ENGLISH_TRENDING_HASHTAGS : GK_TRENDING_HASHTAGS;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOpt(idx);
    setAnswered(true);
  };

  return (
    <aside className="w-80 shrink-0 hidden xl:flex flex-col gap-4 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto py-2 pr-1 select-none">
      {/* 1. Daily Study Streak Card */}
      <div className={`p-4 rounded-2xl shadow-2xs space-y-2 border transition-all ${
        isEnglishMode
          ? "bg-gradient-to-br from-blue-50 to-indigo-50/40 border-blue-200/80"
          : "bg-gradient-to-br from-amber-50 to-orange-50/40 border-amber-200/80"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Flame className={`w-4 h-4 ${isEnglishMode ? "text-blue-600 fill-blue-600" : "text-orange-500 fill-orange-500"}`} />
            <span className={isEnglishMode ? "text-blue-900" : "text-amber-900"}>
              {isEnglishMode ? "Daily English Streak" : "ডেইলি স্টাডি স্ট্রিক"}
            </span>
          </div>
          <span className={`text-xs font-black font-mono bg-white px-2 py-0.5 rounded-full border ${
            isEnglishMode
              ? "text-blue-700 border-blue-200"
              : "text-orange-600 border-orange-200"
          }`}>
            {streakDays} {isEnglishMode ? "Days!" : "দিন!"}
          </span>
        </div>
        <p className={`text-xs leading-relaxed font-sans ${
          isEnglishMode ? "text-blue-800/80" : "text-amber-800/80"
        }`}>
          {isEnglishMode
            ? "ধারাবাহিক রিডিংই শব্দভাণ্ডার ও ফ্লুয়েন্সির মূল চাবিকাঠি। প্রতিদিন অন্তত ২টি ইংরেজি সম্পাদকীয় পাঠ করুন।"
            : "ধারাবাহিকতা সাফল্যের মূল চাবিকাঠি। প্রতিদিন অন্তত ৩টি বিশ্লেষণ পাঠ সম্পন্ন করুন।"}
        </p>
      </div>

      {/* 2. Micro-Quiz of the Day Challenge */}
      <div id="tutorial-daily-quiz" className="p-4 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-3 transition-all">
        <div className="flex items-center justify-between pb-2 border-b border-[#f4efe4]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#842323]">
            {isEnglishMode ? (
              <>
                <BookOpen className="w-4 h-4 text-[#1e40af]" />
                <span className="text-[#1e40af]">ডেইলি ইংলিশ চ্যালেঞ্জ</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4 text-[#842323]" />
                <span>আজকের কুইজ চ্যালেঞ্জ</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-[#717887]">
            {isEnglishMode ? "শব্দার্থ ও প্রয়োগ" : "একটিভ রিকল"}
          </span>
        </div>

        <p className="text-xs font-bold text-[#1c1d21] leading-snug">
          {activeQuiz.question}
        </p>

        <div className="space-y-1.5">
          {activeQuiz.options.map((opt, idx) => {
            let btnStyle = "bg-[#fbf9f5] border-[#ded8cb] hover:bg-[#f6f2e8] text-[#343a46]";
            if (answered) {
              if (idx === activeQuiz.correctOption) {
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
                {answered && idx === activeQuiz.correctOption && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {answered && selectedOpt === idx && idx !== activeQuiz.correctOption && (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="p-2.5 bg-[#faf8f4] border border-[#ded8cb] rounded-lg text-[11px] text-[#404652] leading-relaxed animate-fade-in">
            <span className="font-bold text-[#1c1d21]">ব্যাখ্যা: </span>
            {activeQuiz.explanation}
          </div>
        )}
      </div>

      {/* 3. Trending Topics & Hashtags */}
      <div className="p-4 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c1d21] pb-2 border-b border-[#f4efe4]">
          <TrendingUp className={`w-4 h-4 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
          <span>{isEnglishMode ? "Trending English Topics" : "আজকের ট্রেন্ডিং বিষয়বস্তু"}</span>
        </div>

        <div className="space-y-2">
          {activeHashtags.map((h, i) => (
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

      {/* 5. Copyright Notice */}
      <div 
        data-digital-signature="KK-RAIL-AUTH-2026"
        className="p-3 text-[10px] text-[#8e95a2] space-y-1 leading-relaxed font-sans"
      >
        <p>&copy; ২০২৬ খবরাখবর (KhoboraKhobor)</p>
        <p className="text-[9px] text-[#a0a8b5]">
          {isEnglishMode ? "Dual-Track Academic Edition" : "সর্বস্বত্ব সংরক্ষিত।"}
        </p>
      </div>
    </aside>
  );
}
