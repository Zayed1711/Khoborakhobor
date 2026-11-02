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
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP READER TOOLBAR (Strictly md:flex, Zero Squeeze)*/}
      {/* ======================================================== */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-3 p-3 px-4 mb-8 bg-[#ffffff] border border-[#e2dcd0] rounded-lg shadow-2xs text-xs text-[#525964]">
        {/* Left: Typography & Utility Tools */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Font Size Adjusters */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-medium text-[#737b88] flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-[#88909d]" />
              <span>হরফ:</span>
            </span>
            <div className="inline-flex bg-[#f3efe6] p-0.5 rounded-md border border-[#ded8cb]">
              <button
                type="button"
                onClick={() => onFontSizeChange("normal")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
                  fontSize === "normal"
                    ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                    : "text-[#6b7280] hover:text-[#1c1d21]"
                }`}
              >
                সাধারণ
              </button>
              <button
                type="button"
                onClick={() => onFontSizeChange("large")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
                  fontSize === "large"
                    ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                    : "text-[#6b7280] hover:text-[#1c1d21]"
                }`}
              >
                মাঝারি
              </button>
              <button
                type="button"
                onClick={() => onFontSizeChange("xlarge")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition whitespace-nowrap ${
                  fontSize === "xlarge"
                    ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                    : "text-[#6b7280] hover:text-[#1c1d21]"
                }`}
              >
                বড়
              </button>
            </div>
          </div>

          {/* English Audio Speech Feature Badge (Never squashed) */}
          {isEnglishArticle && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200/80 text-xs font-medium shadow-2xs whitespace-nowrap shrink-0">
              <Volume2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>শব্দে ক্লিক করে শুনুন</span>
            </div>
          )}

          {/* Quick Dictionary Button */}
          {onOpenDictionary && (
            <button
              type="button"
              onClick={() => onOpenDictionary()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/70 hover:bg-blue-100 text-blue-900 border border-blue-200 transition text-xs font-semibold shadow-2xs whitespace-nowrap shrink-0"
              title="শব্দ অনুসন্ধান ও উচ্চারণ অভিধান খুলুন"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1e40af] shrink-0" />
              <span>অভিধান</span>
            </button>
          )}

          {/* Paper Theme Switcher */}
          <div className="flex items-center border-l border-[#ece7dc] pl-3 shrink-0">
            <ThemeSwitcher compact />
          </div>
        </div>

        {/* Right: Reading Mode & Share Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Distraction Free Focus Mode Toggle */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-xs border font-medium whitespace-nowrap ${
              isFocusMode
                ? "bg-[#1f2733] text-white border-[#1f2733] shadow-xs"
                : "bg-[#faf8f4] text-[#3d4450] border-[#ded8cb] hover:bg-[#ede7da]"
            }`}
            title="সম্পূর্ণ একাগ্রতার সাথে পড়ার জন্য ফোকাস মোড"
          >
            {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#842323]" />}
            <span>{isFocusMode ? "স্বাভাবিক দৃশ্য" : "ফোকাস মোড"}</span>
          </button>

          {/* Active Side Note & Dictionary Panel Toggle */}
          <button
            type="button"
            onClick={onToggleNotebook}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-xs border font-medium whitespace-nowrap ${
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
            type="button"
            onClick={onOpenShare || onCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#faf8f4] hover:bg-[#ede7da] text-[#3d4450] border border-[#ded8cb] transition text-xs font-medium whitespace-nowrap"
            title="সহপাঠীদের সাথে শেয়ার করুন"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2e744a]" /> : <Share2 className="w-3.5 h-3.5 text-[#842323]" />}
            <span>{copied ? "কপি হয়েছে" : "শেয়ার"}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MOBILE READER TOOLBAR (Strictly md:hidden, 2 Rows)    */}
      {/* ======================================================== */}
      <div className="md:hidden flex flex-col gap-2.5 p-2.5 mb-6 bg-[#ffffff] border border-[#e2dcd0] rounded-xl shadow-2xs text-xs text-[#525964]">
        {/* Row 1: Font Size Controls + Theme Switcher */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-[#88909d]" />
            <div className="inline-flex bg-[#f3efe6] p-0.5 rounded-lg border border-[#ded8cb]">
              <button
                type="button"
                onClick={() => onFontSizeChange("normal")}
                className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                  fontSize === "normal"
                    ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                    : "text-[#6b7280]"
                }`}
              >
                সাধারণ
              </button>
              <button
                type="button"
                onClick={() => onFontSizeChange("large")}
                className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                  fontSize === "large"
                    ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                    : "text-[#6b7280]"
                }`}
              >
                মাঝারি
              </button>
              <button
                type="button"
                onClick={() => onFontSizeChange("xlarge")}
                className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                  fontSize === "xlarge"
                    ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                    : "text-[#6b7280]"
                }`}
              >
                বড়
              </button>
            </div>
          </div>

          <ThemeSwitcher compact />
        </div>

        {/* Row 2: Mobile Action Buttons */}
        <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[#f0eae0]">
          {onOpenDictionary && (
            <button
              type="button"
              onClick={() => onOpenDictionary()}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50/70 text-blue-900 border border-blue-200 text-xs font-semibold"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#1e40af]" />
              <span>অভিধান</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs border font-medium ${
              isFocusMode
                ? "bg-[#1f2733] text-white border-[#1f2733]"
                : "bg-[#faf8f4] text-[#3d4450] border-[#ded8cb]"
            }`}
          >
            {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#842323]" />}
            <span>{isFocusMode ? "স্বাভাবিক" : "ফোকাস"}</span>
          </button>

          <button
            type="button"
            onClick={onToggleNotebook}
            className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs border font-medium ${
              isNotebookOpen
                ? "bg-[#842323] text-white border-[#842323]"
                : "bg-[#faf8f4] text-[#3d4450] border-[#ded8cb]"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>নোটবুক</span>
            {noteCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                isNotebookOpen ? "bg-white text-[#842323]" : "bg-[#842323] text-white"
              }`}>
                {noteCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenShare || onCopyLink}
            className="inline-flex items-center justify-center p-2 rounded-lg bg-[#faf8f4] text-[#3d4450] border border-[#ded8cb] shrink-0"
            title="শেয়ার"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#2e744a]" /> : <Share2 className="w-3.5 h-3.5 text-[#842323]" />}
          </button>
        </div>
      </div>
    </>
  );
}
