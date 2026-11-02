"use client";

import { 
  Eye, EyeOff, Share2, 
  Type, Edit3, Check, Volume2, BookOpen
} from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";

interface ReaderToolbarProps {
  articleTitle: string;
  onFontSizeChange: (size: "normal" | "large" | "xlarge") => void;
  fontSize: "normal" | "large" | "xlarge";
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  isNotebookOpen: boolean;
  onToggleNotebook: () => void;
  noteCount: number;
  copied: boolean;
  onCopyLink: () => void;
  onOpenShare?: () => void;
  // English Scaffolding props
  isEnglishArticle?: boolean;
  showPhonics?: boolean;
  onTogglePhonics?: () => void;
  onOpenDictionary?: (initialWord?: string) => void;
}

export default function ReaderToolbar({
  onFontSizeChange,
  fontSize,
  isFocusMode,
  onToggleFocusMode,
  isNotebookOpen,
  onToggleNotebook,
  noteCount,
  copied,
  onCopyLink,
  onOpenShare,
  isEnglishArticle = false,
  onOpenDictionary,
}: ReaderToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 sm:px-4 mb-6 sm:mb-8 bg-[#ffffff] border border-[#e2dcd0] rounded-xl shadow-2xs text-xs text-[#525964]">
      {/* Group 1: Typography & Theme Controls */}
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
        {/* Font Size Adjusters */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#737b88] flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-[#88909d]" />
            <span className="hidden sm:inline">হরফ:</span>
          </span>
          <div className="inline-flex bg-[#f3efe6] p-0.5 rounded-lg border border-[#ded8cb]">
            <button
              onClick={() => onFontSizeChange("normal")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                fontSize === "normal"
                  ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                  : "text-[#6b7280] hover:text-[#1c1d21]"
              }`}
            >
              সাধারণ
            </button>
            <button
              onClick={() => onFontSizeChange("large")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                fontSize === "large"
                  ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                  : "text-[#6b7280] hover:text-[#1c1d21]"
              }`}
            >
              মাঝারি
            </button>
            <button
              onClick={() => onFontSizeChange("xlarge")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                fontSize === "xlarge"
                  ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                  : "text-[#6b7280] hover:text-[#1c1d21]"
              }`}
            >
              বড়
            </button>
          </div>
        </div>

        {/* English Audio Speech Feature Badge (Desktop only) */}
        {isEnglishArticle && (
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200/80 text-xs font-medium shadow-2xs">
            <Volume2 className="w-3.5 h-3.5 text-blue-700" />
            <span>শব্দে ক্লিক করে শুনুন</span>
          </div>
        )}

        {/* Paper Theme Switcher */}
        <div className="flex items-center border-l border-[#ece7dc] pl-2 sm:pl-3">
          <ThemeSwitcher compact />
        </div>
      </div>

      {/* Group 2: Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0eae0]">
        {/* Quick Dictionary Button */}
        {onOpenDictionary && (
          <button
            type="button"
            onClick={() => onOpenDictionary()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50/70 hover:bg-blue-100 text-blue-900 border border-blue-200 transition text-xs font-semibold shadow-2xs active:scale-95"
            title="শব্দ অনুসন্ধান ও উচ্চারণ অভিধান খুলুন"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#1e40af]" />
            <span>অভিধান</span>
          </button>
        )}

        {/* Distraction Free Focus Mode Toggle */}
        <button
          onClick={onToggleFocusMode}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg transition text-xs border font-medium active:scale-95 ${
            isFocusMode
              ? "bg-[#1f2733] text-white border-[#1f2733] shadow-xs"
              : "bg-[#faf8f4] text-[#3d4450] border-[#ded8cb] hover:bg-[#ede7da]"
          }`}
          title="সম্পূর্ণ একাগ্রতার সাথে পড়ার জন্য ফোকাস মোড"
        >
          {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#842323]" />}
          <span className="hidden sm:inline">{isFocusMode ? "স্বাভাবিক দৃশ্য" : "ফোকাস মোড"}</span>
          <span className="sm:hidden">{isFocusMode ? "স্বাভাবিক" : "ফোকাস"}</span>
        </button>

        {/* Active Side Note & Dictionary Panel Toggle */}
        <button
          onClick={onToggleNotebook}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs border font-medium active:scale-95 ${
            isNotebookOpen
              ? "bg-[#842323] text-white border-[#842323] shadow-xs"
              : "bg-[#faf8f4] text-[#3d4450] border-[#ded8cb] hover:bg-[#ede7da]"
          }`}
          title="ক্লাউড নোটবুক ও অভিধান প্যানেল খুলুন"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>নোটবুক</span>
          {noteCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isNotebookOpen ? "bg-white text-[#842323]" : "bg-[#842323] text-white"
              }`}
            >
              {noteCount}
            </span>
          )}
        </button>

        {/* Share Study Modal Trigger */}
        <button
          onClick={onOpenShare || onCopyLink}
          className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#faf8f4] hover:bg-[#ede7da] text-[#3d4450] border border-[#ded8cb] transition text-xs font-medium active:scale-95 shrink-0"
          title="সহপাঠীদের সাথে শেয়ার করুন"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#2e744a]" /> : <Share2 className="w-3.5 h-3.5 text-[#842323]" />}
          <span className="hidden sm:inline">{copied ? "কপি হয়েছে" : "শেয়ার"}</span>
        </button>
      </div>
    </div>
  );
}
