"use client";

import { useState } from "react";
import { VocabularyTerm } from "@/types";
import { saveWordToBankAction } from "@/actions/student";
import { BookA, Bookmark, Check, Sparkles, X } from "lucide-react";

interface VocabularyModalProps {
  terms: VocabularyTerm[];
  studentId: string;
}

export default function VocabularyModal({ terms, studentId }: VocabularyModalProps) {
  const [selectedTerm, setSelectedTerm] = useState<VocabularyTerm | null>(null);
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  if (!terms || terms.length === 0) return null;

  const handleToggleSave = async (termId: string) => {
    if (!studentId) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature: "dictionary" } }));
      }
      return;
    }
    try {
      const res = await saveWordToBankAction(studentId, termId);
      setSavedStatus((prev) => ({ ...prev, [termId]: res.saved }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="my-8 p-4 bg-[#f8f5ee] border border-[#e2dcd0] rounded-lg shadow-2xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e7e1d5]">
        <div className="flex items-center gap-2">
          <BookA className="w-4 h-4 text-[#842323]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c1d21]">
            শিক্ষণীয় পারিভাষিক শব্দভাণ্ডার (Vocabulary & Concept Bank)
          </h4>
        </div>
        <span className="text-[11px] text-[#717887]">শব্দে ক্লিক করে সংজ্ঞা ও বিশ্লেষণ জানুন</span>
      </div>

      {/* Interactive Word Badges */}
      <div className="flex flex-wrap gap-2">
        {terms.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTerm(t)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#ffffff] hover:bg-[#ede7da] text-[#2d333f] text-xs font-semibold border border-[#ded8cb] transition shadow-2xs"
          >
            <Sparkles className="w-3 h-3 text-[#c29547]" />
            <span>{t.term}</span>
          </button>
        ))}
      </div>

      {/* Definition Drawer / Overlay Modal */}
      {selectedTerm && (
        <div className="mt-4 p-4 bg-[#ffffff] border border-[#ded8cb] rounded-md transition-all shadow-xs">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#842323] tracking-wider block">
                ধারণাগত ব্যাখ্যা ও সংজ্ঞা
              </span>
              <div className="flex items-center gap-2">
                <h5 className="text-base font-bold text-[#1c1d21] font-serif">
                  {selectedTerm.term}
                </h5>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleSave(selectedTerm.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs transition border font-medium ${
                  savedStatus[selectedTerm.id]
                    ? "bg-[#842323] text-white border-[#842323]"
                    : "bg-[#faf8f4] text-[#3d4450] border-[#ded8cb] hover:bg-[#ede7da]"
                }`}
              >
                {savedStatus[selectedTerm.id] ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>শব্দভাণ্ডারে সংরক্ষিত</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>ওয়ার্ড ব্যাংকে সংরক্ষণ</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedTerm(null)}
                className="p-1 rounded text-[#8e95a2] hover:text-[#1c1d21] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#3b414d] leading-relaxed font-sans">
            {selectedTerm.definition}
          </p>

          {selectedTerm.context && (
            <p className="mt-2 text-[11px] text-[#6b7280] italic bg-[#faf8f4] p-2 rounded border border-[#ece7dc]">
              প্রাসঙ্গিক প্রেক্ষাপট: {selectedTerm.context}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

