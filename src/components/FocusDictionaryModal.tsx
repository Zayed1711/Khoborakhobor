"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { lookupConceptDictionary, DictionaryEntry } from "@/lib/dictionary-engine";
import { getBanglaPronunciation } from "@/lib/phonetics/en-to-bn";
import { saveCustomDictionaryTermAction, trackWordLookupAction } from "@/actions/student";
import { Student } from "@/types";
import { 
  Search, Volume2, BookmarkPlus, Check, X, 
  Sparkles, BookOpen, Loader2, ArrowRight
} from "lucide-react";

interface FocusDictionaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord?: string;
  articleSlug: string;
  student: Student | null;
  onSaveFeedback?: (msg: string) => void;
}

export default function FocusDictionaryModal({
  isOpen,
  onClose,
  initialWord = "",
  articleSlug,
  student,
  onSaveFeedback,
}: FocusDictionaryModalProps) {
  const [searchTerm, setSearchTerm] = useState(initialWord);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialWord && initialWord.trim().length > 0) {
      setSearchTerm(initialWord.trim());
      handleLookup(initialWord.trim());
    }
  }, [initialWord]);

  if (!mounted || !isOpen) return null;

  const handleLookup = async (word: string) => {
    const q = word.trim();
    if (!q) return;

    setLoading(true);
    setSaved(false);
    try {
      const res = await lookupConceptDictionary(q);
      setEntry(res);
      if (res && student) {
        trackWordLookupAction(q).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(searchTerm);
  };

  const handlePlayAudio = () => {
    const wordToPlay = entry ? entry.query || entry.term.split("(")[0].trim() : searchTerm;
    if (typeof window !== "undefined" && "speechSynthesis" in window && wordToPlay) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordToPlay);
      utterance.lang = "en-US";
      utterance.rate = 0.88;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveToWordBank = async () => {
    if (!entry) return;
    if (!student) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature: "dictionary" } }));
      }
      return;
    }

    try {
      await saveCustomDictionaryTermAction(
        student.id,
        articleSlug,
        entry.term,
        entry.banglaMeaning || entry.definition,
        entry.simplifiedMeaning || entry.realLifeExample
      );
      setSaved(true);
      if (onSaveFeedback) {
        onSaveFeedback(`"${entry.term}" আপনার ওয়ার্ড ব্যাংকে যুক্ত হয়েছে!`);
      }
    } catch (err) {
      console.error(err);
      if (onSaveFeedback) { onSaveFeedback("সংরক্ষণ করতে সমস্যা হয়েছে।"); }
    }
  };

  const cleanQuery = entry ? entry.query || entry.term.split("(")[0].trim() : searchTerm;
  const banglaPhonetic = getBanglaPronunciation(cleanQuery);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#ffffff] border border-[#ded8cb] rounded-2xl shadow-2xl overflow-hidden select-text animate-in zoom-in-95 duration-150 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Search Bar */}
        <div className="p-4 bg-gradient-to-r from-[#1e293b] to-[#0f172a] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold tracking-wide">
              স্মার্ট অভিধান ও উচ্চারণ (Smart Lexicon)
            </h3>
            <span className="px-1.5 py-0.5 rounded text-xs font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
              PRO • FREE IN NOV
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="যেকোনো ইংরেজি শব্দের অর্থ ও উচ্চারণ খুঁজুন..."
              className="w-full pl-9 pr-24 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#0f172a] outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 px-3 py-1 bg-[#1e40af] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "অনুসন্ধান"}
            </button>
          </form>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-10 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs text-[#64748b]">অভিধান ও উচ্চারণ বিশ্লেষণ করা হচ্ছে...</p>
            </div>
          ) : entry ? (
            <div className="space-y-4">
              {/* Word & Phonetics Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#f1f5f9]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] font-serif">
                      {cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1)}
                    </h2>
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      className={`p-1.5 rounded-full transition ${
                        isPlayingAudio
                          ? "bg-blue-600 text-white animate-pulse"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                      title="শুনুন (Listen Pronunciation)"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {banglaPhonetic && (
                      <span className="text-xs bg-amber-50 text-amber-950 font-mono font-medium px-2 py-0.5 rounded border border-amber-200">
                        উচ্চারণ: [{banglaPhonetic}]
                      </span>
                    )}
                    <span className="text-xs text-[#64748b] bg-slate-100 px-2 py-0.5 rounded font-medium">
                      {entry.category || "ইংরেজি শব্দকোষ"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToWordBank}
                  disabled={saved}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    saved
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-[#1e40af] hover:bg-blue-700 text-white shadow-2xs"
                  }`}
                >
                  {saved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  <span>{saved ? "সংরক্ষিত" : "ওয়ার্ড ব্যাংকে সেভ"}</span>
                </button>
              </div>

              {/* Bangla Meaning Box */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block font-mono">
                  সহজ বাংলা অর্থ:
                </span>
                <p className="text-xs sm:text-sm text-[#0f172a] font-medium leading-relaxed font-sans">
                  {entry.banglaMeaning}
                </p>
              </div>

              {/* English Conceptual Definition */}
              {entry.simplifiedMeaning && (
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748b] block font-mono">
                    English Definition:
                  </span>
                  <p className="text-xs text-[#334155] leading-relaxed italic bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                    "{entry.simplifiedMeaning}"
                  </p>
                </div>
              )}

              {/* Real-Life Practical Example */}
              {entry.realLifeExample && (
                <div className="p-3 bg-gradient-to-br from-[#faf8f5] to-[#f5f0e6] rounded-xl border border-[#ded8cb] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 font-mono uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>বাস্তব বাক্যে প্রয়োগ ও প্রসঙ্গ:</span>
                  </div>
                  <p className="text-xs text-[#1e293b] leading-relaxed">
                    {entry.realLifeExample}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#64748b]">
              যেকোনো ইংরেজি শব্দের অর্থ, বাংলা উচ্চারণ ও বাস্তব বাক্যে প্রয়োগ দেখতে অনুসন্ধান করুন।
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
          <span>খবরাখবর স্মার্ট ডিকশনারি ইঞ্জিন</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#1e40af] hover:underline"
          >
            পড়ায় ফিরে যান →
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
