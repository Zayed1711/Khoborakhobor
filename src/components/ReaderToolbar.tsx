"use client";

import { 
  Eye, EyeOff, Share2, 
  Type, Edit3, Check
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
}: ReaderToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 mb-8 bg-[#ffffff] border border-[#e2dcd0] rounded-lg shadow-2xs text-xs text-[#525964]">
      {/* Font Size & Paper Reading Tone Group */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Font Size Adjusters */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-[#737b88] flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-[#88909d]" />
            <span>হরফ:</span>
          </span>
          <div className="inline-flex bg-[#f3efe6] p-0.5 rounded-md border border-[#ded8cb]">
            <button
              onClick={() => onFontSizeChange("normal")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                fontSize === "normal"
                  ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                  : "text-[#6b7280] hover:text-[#1c1d21]"
              }`}
            >
              সাধারণ
            </button>
            <button
              onClick={() => onFontSizeChange("large")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                fontSize === "large"
                  ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                  : "text-[#6b7280] hover:text-[#1c1d21]"
              }`}
            >
              মাঝারি
            </button>
            <button
              onClick={() => onFontSizeChange("xlarge")}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                fontSize === "xlarge"
                  ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
                  : "text-[#6b7280] hover:text-[#1c1d21]"
              }`}
            >
              বড়
            </button>
          </div>
        </div>

        {/* Paper Theme Switcher (Parchment & Sepia only) */}
        <div className="flex items-center gap-1.5 border-l border-[#ece7dc] pl-3">
          <ThemeSwitcher compact />
        </div>
      </div>

      {/* Action Buttons Group */}
      <div className="flex items-center gap-2">
        {/* Distraction Free Focus Mode Toggle */}
        <button
          onClick={onToggleFocusMode}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-xs border font-medium ${
            isFocusMode
              ? "bg-[#1f2733] text-white border-[#1f2733] shadow-xs"
              : "bg-[#faf8f4] text-[#3d4450] border-[#ded8cb] hover:bg-[#ede7da]"
          }`}
          title="সম্পূর্ণ একাগ্রতার সাথে পড়ার জন্য ফোকাস মোড চালু বা বন্ধ করুন"
        >
          {isFocusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#842323]" />}
          <span>{isFocusMode ? "স্বাভাবিক দৃশ্য" : "ফোকাস মোড"}</span>
        </button>

        {/* Active Side Note & Dictionary Panel Toggle */}
        <button
          onClick={onToggleNotebook}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition text-xs border font-medium ${
            isNotebookOpen
              ? "bg-[#842323] text-white border-[#842323] shadow-xs"
              : "bg-[#faf8f4] text-[#3d4450] border-[#ded8cb] hover:bg-[#ede7da]"
          }`}
          title="অ্যাক্টিভ ক্লাউড নোটবুক ও ডিকশনারি প্যানেল খুলুন"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>নোটবুক প্যানেল</span>
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#faf8f4] hover:bg-[#ede7da] text-[#3d4450] border border-[#ded8cb] transition text-xs font-medium"
          title="সহপাঠীদের সাথে শেয়ার করুন"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#2e744a]" /> : <Share2 className="w-3.5 h-3.5 text-[#842323]" />}
          <span>{copied ? "কপি হয়েছে" : "শেয়ার"}</span>
        </button>
      </div>
    </div>
  );
}
