"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Flame, Sparkles, TrendingUp, HelpCircle, 
  CheckCircle2, XCircle, ArrowRight, ShieldCheck, GraduationCap 
} from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import ProAuthGateModal from "./ProAuthGateModal";
import KeyNotesPanel from "./KeyNotesPanel";
import type { KeyNoteDay } from "@/lib/study/key-notes";
import { getCurrentSession } from "@/actions/auth";
import { useAppMode } from "@/context/LanguageContext";
import { 
  TrendingHashtagsData, 
  TrendingHashtagItem, 
  getTrendingHashtagsAction 
} from "@/actions/search";

interface RightStudyRailProps {
  streakDays?: number;
  /** Daily key notes (job/BCS mode); English mode will show vocabulary here */
  keyNotes?: KeyNoteDay[];
  initialTrending?: TrendingHashtagsData;
}


const DEFAULT_GK_HASHTAGS: TrendingHashtagItem[] = [
  { tag: "বিসিএস", query: "বিসিএস", count: 1182, countLabel: "১,১৮২টি বিশ্লেষণ" },
  { tag: "অর্থনীতি", query: "অর্থনীতি", count: 274, countLabel: "২৭৪টি প্রতিবেদন" },
  { tag: "আন্তর্জাতিক", query: "আন্তর্জাতিক", count: 376, countLabel: "৩৭৬টি আপডেট" },
  { tag: "সুশাসন", query: "সুশাসন", count: 336, countLabel: "৩৩৬টি নিবন্ধ" },
  { tag: "বাণিজ্য", query: "বাণিজ্য", count: 116, countLabel: "১১৬টি সংবাদ" },
];

const DEFAULT_EN_HASHTAGS: TrendingHashtagItem[] = [
  { tag: "Bangladesh", query: "Bangladesh", count: 100, countLabel: "100 articles" },
  { tag: "National", query: "National", count: 46, countLabel: "46 briefs" },
  { tag: "Education", query: "Education", count: 14, countLabel: "14 readings" },
  { tag: "Business", query: "Business", count: 9, countLabel: "9 reports" },
  { tag: "Trade", query: "Trade", count: 8, countLabel: "8 analyses" },
];

export default function RightStudyRail({
  streakDays = 14,
  initialTrending,
  keyNotes = [],
}: RightStudyRailProps) {
  const { isEnglishMode } = useAppMode();
  const [isProGateOpen, setIsProGateOpen] = useState(false);
  const [trending, setTrending] = useState<TrendingHashtagsData>(
    initialTrending || { bn: DEFAULT_GK_HASHTAGS, en: DEFAULT_EN_HASHTAGS }
  );

  const activeHashtags = isEnglishMode ? trending.en : trending.bn;

  useEffect(() => {
    if (!initialTrending) {
      getTrendingHashtagsAction()
        .then((data) => {
          if (data && data.bn && data.bn.length > 0) {
            setTrending(data);
          }
        })
        .catch(() => {});
    }
  }, [initialTrending]);

  return (
    <aside className="w-72 xl:w-80 shrink-0 hidden min-[1140px]:flex flex-col gap-4 sticky top-[185px] h-[calc(100vh-12.5rem)] overflow-y-auto overflow-x-hidden py-2 pr-1 pl-0.5 select-none">
      {/* 1. Daily Study Streak Card */}
      <div className={`shrink-0 p-3 sm:p-3.5 rounded-2xl shadow-2xs space-y-1.5 border transition-all ${
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

      {/* 2. Daily key notes: one quoted point from each of the day's ten (job/BCS mode) */}
      {!isEnglishMode && <KeyNotesPanel days={keyNotes} className="shrink-0" />}

      {/* 3. Trending Topics & Hashtags (Interactive Search Filter) */}
      <div className="shrink-0 p-4 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c1d21] pb-2 border-b border-[#f4efe4]">
          <TrendingUp className={`w-4 h-4 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
          <span>{isEnglishMode ? "Trending English Topics" : "আজকের ট্রেন্ডিং বিষয়বস্তু"}</span>
        </div>

        <div className="space-y-1">
          {activeHashtags.map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("khobor_open_search", {
                      detail: { query: h.query || h.tag.replace(/_/g, " ") },
                    })
                  );
                }
              }}
              className="w-full flex items-center justify-between text-xs hover:bg-[#faf8f4] hover:text-[#842323] p-1.5 rounded-lg transition text-left cursor-pointer group"
              title={`${h.tag} সম্পর্কিত প্রতিবেদন অনুসন্ধান করুন`}
            >
              <span className="font-semibold text-[#343a46] group-hover:text-[#842323] transition-colors">
                #{h.tag}
              </span>
              <span className="text-xs text-[#788191] font-mono group-hover:text-[#842323] transition-colors">
                {h.countLabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Eye-Care Reading Themes */}
      <div className="shrink-0 p-4 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#737b88] block">
          কাগজের আভা ও চোখের প্রশান্তি:
        </span>
        <ThemeSwitcher />
      </div>

      {/* 5. Copyright Notice */}
      <div 
        data-digital-signature="KK-RAIL-AUTH-2026"
        className="shrink-0 p-3 text-xs text-[#8e95a2] space-y-1 leading-relaxed font-sans"
      >
        <p>&copy; ২০২৬ খবরাখবর (KhoboraKhobor)</p>
        <p className="text-xs text-[#a0a8b5]">
          {isEnglishMode ? "Dual-Track Academic Edition" : "সর্বস্বত্ব সংরক্ষিত।"}
        </p>
      </div>

      {/* Pro Auth Gate Modal for Daily Quiz */}
      <ProAuthGateModal
        isOpen={isProGateOpen}
        onClose={() => setIsProGateOpen(false)}
        feature="quiz"
      />
    </aside>
  );
}
