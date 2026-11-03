"use client";

import { Highlighter, Edit3, X, BookOpen } from "lucide-react";

interface HighlighterTooltipProps {
  position: { top: number; left: number } | null;
  selectedText: string;
  onApplyHighlight: (colorName: "হলুদ মার্কার" | "সবুজ মার্কার" | "বেগুনি মার্কার") => void;
  onOpenMemo: () => void;
  onDismiss: () => void;
  onLookupDictionary?: (text: string) => void;
}

export default function HighlighterTooltip({
  position,
  selectedText,
  onApplyHighlight,
  onOpenMemo,
  onDismiss,
  onLookupDictionary,
}: HighlighterTooltipProps) {
  if (!position || !selectedText) return null;

  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 800;
  const safeLeft = Math.max(10, Math.min(position.left, screenWidth - 290));

  return (
    <div
      style={{
        position: "fixed",
        top: `${Math.max(10, position.top - 48)}px`,
        left: `${safeLeft}px`,
        zIndex: 50,
      }}
      className="max-w-[calc(100vw-20px)] overflow-x-auto scrollbar-none animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 bg-[#17191d] text-white p-1.5 px-2 rounded-full shadow-2xl border border-[#3b4252] select-none"
    >
      {/* 1-Click Dictionary Lookup Button */}
      {onLookupDictionary && (
        <>
          <button
            onClick={() => onLookupDictionary(selectedText)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-300 hover:text-white hover:bg-white/10 transition border border-amber-300/40 shrink-0"
            title="শব্দের অর্থ, উচ্চারণ ও সংজ্ঞা দেখুন (Dictionary Lookup)"
          >
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span>অভিধান</span>
            <span className="text-[8px] font-bold px-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
              PRO
            </span>
          </button>
          <div className="w-[1px] h-3.5 bg-white/20 mx-0.5 shrink-0" />
        </>
      )}

      <span className="text-[10px] text-[#9ca3af] font-medium pl-0.5 flex items-center gap-1 shrink-0">
        <Highlighter className="w-3 h-3 text-[#f5c66b]" />
        <span className="hidden sm:inline">মার্কার:</span>
      </span>

      {/* Yellow Highlighter */}
      <button
        onClick={() => onApplyHighlight("হলুদ মার্কার")}
        className="w-5 h-5 rounded-full bg-[#fde047] hover:scale-110 active:scale-95 transition border border-white/40 shadow-xs shrink-0"
        title="হলুদ মার্কার দিয়ে হাইলাইট করুন"
      />

      {/* Green Highlighter */}
      <button
        onClick={() => onApplyHighlight("সবুজ মার্কার")}
        className="w-5 h-5 rounded-full bg-[#86efac] hover:scale-110 active:scale-95 transition border border-white/40 shadow-xs shrink-0"
        title="সবুজ মার্কার দিয়ে হাইলাইট করুন"
      />

      {/* Purple Highlighter */}
      <button
        onClick={() => onApplyHighlight("বেগুনি মার্কার")}
        className="w-5 h-5 rounded-full bg-[#d8b4fe] hover:scale-110 active:scale-95 transition border border-white/40 shadow-xs shrink-0"
        title="বেগুনি মার্কার দিয়ে হাইলাইট করুন"
      />

      <div className="w-[1px] h-3.5 bg-white/20 mx-0.5 shrink-0" />

      {/* Add with Memo button */}
      <button
        onClick={onOpenMemo}
        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-white hover:bg-white/10 transition shrink-0"
        title="ব্যক্তিগত নোট বা ব্যাখ্যা যুক্ত করুন"
      >
        <Edit3 className="w-3 h-3" />
        <span>নোট</span>
      </button>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition ml-0.5 shrink-0"
        title="বাতিল করুন"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
