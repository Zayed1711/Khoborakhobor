"use client";

import { useState } from "react";
import { 
  BookOpen, Search, BookmarkPlus, Check, Trash2, 
  ExternalLink, Sparkles, Feather, Highlighter, X,
  Lightbulb, Loader2
} from "lucide-react";
import { lookupConceptDictionary, DictionaryEntry } from "@/lib/dictionary-engine";
import { 
  createStudyNoteAction, 
  deleteStudyNoteAction, 
  saveCustomDictionaryTermAction 
} from "@/actions/student";
import { StudyNote, Student } from "@/types";
import Link from "next/link";

interface SideNotePanelProps {
  articleSlug: string;
  articleTitle: string;
  student: Student | null;
  notes: StudyNote[];
  onNotesChange: (notes: StudyNote[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function SideNotePanel({
  articleSlug,
  articleTitle,
  student,
  notes,
  onNotesChange,
  isOpen,
  onClose,
}: SideNotePanelProps) {
  // Active Notebook State
  const [notebookText, setNotebookText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  // Dictionary State
  const [dictQuery, setDictQuery] = useState("");
  const [activeEntry, setActiveEntry] = useState<DictionaryEntry | null>(null);
  const [isSearchingDict, setIsSearchingDict] = useState(false);
  const [isSavingWord, setIsSavingWord] = useState(false);
  const [wordSavedFeedback, setWordSavedFeedback] = useState(false);

  // Free-form Note Saving
  const handleSaveFreeformNote = async () => {
    if (!notebookText.trim()) return;
    if (!student) {
      alert("ব্যক্তিগত ক্লাউড নোটবুকে সংরক্ষণ করতে অনুগ্রহ করে লগইন করুন।");
      return;
    }

    setIsSavingNote(true);
    try {
      const newNote = await createStudyNoteAction(
        student.id,
        articleSlug,
        notebookText.trim(),
        "[মুক্তচিন্তা ও লেকচার নোট]"
      );
      onNotesChange([newNote as any, ...notes]);
      setNotebookText("");
      setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 2500);
    } catch (err) {
      console.error(err);
      alert("নোট সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSavingNote(false);
    }
  };

  // Remove Note
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteStudyNoteAction(noteId, articleSlug);
      onNotesChange(notes.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error(err);
    }
  };

  // Dictionary Lookup (Async with Curated + API support)
  const handleSearchDictionary = async (e?: React.FormEvent, customTerm?: string) => {
    if (e) e.preventDefault();
    const queryTerm = (customTerm || dictQuery).trim();
    if (!queryTerm) return;

    if (customTerm) {
      setDictQuery(customTerm);
    }

    setIsSearchingDict(true);
    try {
      const entry = await lookupConceptDictionary(queryTerm);
      setActiveEntry(entry);
      setWordSavedFeedback(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingDict(false);
    }
  };

  // 1-Click Save Word to Study Hub
  const handleSaveWordToStudyHub = async () => {
    if (!activeEntry) return;
    if (!student) {
      alert("শব্দভাণ্ডারে সংরক্ষণ করতে অনুগ্রহ করে লগইন করুন।");
      return;
    }

    setIsSavingWord(true);
    try {
      await saveCustomDictionaryTermAction(
        student.id,
        articleSlug,
        activeEntry.term,
        activeEntry.definition,
        activeEntry.context || `বিষয়: ${activeEntry.category}`
      );
      setWordSavedFeedback(true);
      setTimeout(() => setWordSavedFeedback(false), 3000);
    } catch (err) {
      console.error(err);
      alert("শব্দভাণ্ডারে সংরক্ষণ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSavingWord(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-full lg:w-88 xl:w-96 shrink-0 bg-[#ffffff] border border-[#e2dcd0] rounded-xl shadow-lg p-4 sm:p-5 flex flex-col gap-5 text-xs text-[#2a2d34] transition-all duration-200 lg:sticky lg:top-6 max-h-[calc(100vh-3rem)] overflow-y-auto z-30">
      {/* Panel Header (Sticky within panel) */}
      <div className="flex items-center justify-between pb-3 border-b border-[#ece7dc] sticky top-0 bg-white z-10 -mt-1 pt-1">
        <div className="flex items-center gap-2">
          <Feather className="w-4 h-4 text-[#842323]" />
          <h3 className="font-bold text-sm text-[#17191d] font-serif">
            ক্লাউড স্টাডি নোটবুক
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/saved"
            className="text-[11px] text-[#842323] hover:underline font-medium"
            title="সম্পূর্ণ স্টাডি হাব খুলুন"
          >
            স্টাডি হাব &rarr;
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#88909d] hover:text-[#17191d] hover:bg-[#f6f2e8] transition"
            title="প্যানেল বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION 1: Active Lined Notebook Feature */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#1c1d21] flex items-center gap-1.5">
            <span>পঠনকালীন খসড়া নোটবুক</span>
          </label>
          <span className="text-[10px] text-[#788191]">স্বয়ংক্রিয় ক্লাউড সিঙ্ক</span>
        </div>

        {/* Lined Digital Notebook Area */}
        <div className="relative rounded-lg border border-[#ded8cb] bg-[#fdfcf9] p-2.5 shadow-2xs focus-within:border-[#842323] transition">
          <textarea
            rows={4}
            value={notebookText}
            onChange={(e) => setNotebookText(e.target.value)}
            placeholder="সাধারণ খাতার মতো এখানে আপনার চিন্তা, পরীক্ষার পয়েন্ট বা রিভিশন নোট লিখে রাখুন..."
            className="w-full bg-transparent resize-none text-xs leading-relaxed text-[#23272e] placeholder:text-[#9ea6b3] outline-none"
          />
          <div className="flex items-center justify-between pt-2 border-t border-[#f0eae0] mt-1">
            <span className="text-[10px] text-[#8e95a2]">
              {notebookText.length} হরফ
            </span>
            <button
              onClick={handleSaveFreeformNote}
              disabled={isSavingNote || !notebookText.trim()}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#842323] hover:bg-[#6e1c1c] disabled:opacity-50 text-white rounded text-xs font-semibold transition"
            >
              {noteSavedFeedback ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span>সংরক্ষিত!</span>
                </>
              ) : isSavingNote ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <span>নোটবুকে সংরক্ষণ</span>
              )}
            </button>
          </div>
        </div>

        {/* Saved Notes & Highlights Stream for this Article */}
        {notes.length > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t border-[#ece7dc]">
            <span className="text-[11px] font-bold text-[#68707f] block">
              এই প্রতিবেদনের সংরক্ষিত নোট ({notes.length}):
            </span>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="p-2.5 bg-[#faf8f4] border border-[#e8e2d5] rounded-md text-xs relative group flex flex-col gap-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="italic font-serif text-[#23272e] leading-snug line-clamp-3">
                      "{n.quoteText}"
                    </p>
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#a0a8b5] hover:text-[#842323] transition shrink-0 p-0.5"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {n.memo && (
                    <span className="text-[10px] font-medium text-[#842323] bg-[#f5ebeb] px-1.5 py-0.5 rounded self-start">
                      {n.memo}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Small Conceptual Dictionary (SLM Lexicon Engine) */}
      <div className="pt-4 border-t border-[#ece7dc] space-y-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-[#842323]" />
            <h4 className="text-xs font-bold text-[#1c1d21]">
              স্মার্ট পারিভাষিক শব্দকোষ (AI Lexicon)
            </h4>
          </div>
          <p className="text-[11px] text-[#6b7280]">
            কঠিন কোনো শব্দ পেস্ট বা লিখুন—অর্থ জেনে এক ক্লিকে স্টাডি নোটে যুক্ত করুন:
          </p>
        </div>

        {/* Dictionary Query Form */}
        <form onSubmit={handleSearchDictionary} className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={dictQuery}
              onChange={(e) => setDictQuery(e.target.value)}
              placeholder="শব্দ পেস্ট করুন (যেমন: collapse, সংকট, inflation, রাজস্ব)..."
              className="w-full text-xs p-2 pl-7.5 bg-[#fbf9f5] border border-[#ded8cb] rounded-md outline-none focus:border-[#842323]"
            />
            <Search className="w-3.5 h-3.5 text-[#8e95a2] absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            disabled={isSearchingDict || !dictQuery.trim()}
            className="px-3.5 py-2 bg-[#1f2733] hover:bg-[#121720] disabled:opacity-50 text-white text-xs font-semibold rounded-md transition flex items-center gap-1 shrink-0"
          >
            {isSearchingDict ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>অর্থ</span>
            )}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        {!activeEntry && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {["Collapse", "Crisis", "মুদ্রানীতি", "Inflation", "সার্বভৌম বন্ড", "Deficit", "ঘাটতি"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleSearchDictionary(undefined, term)}
                className="text-[10px] px-2 py-0.5 bg-[#f4efe5] hover:bg-[#eae3d4] text-[#4d5462] rounded-full border border-[#ded8cb] transition"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Dictionary Lookup Result Card */}
        {activeEntry && (
          <div className="p-3.5 bg-[#faf7f0] border border-[#dfd6c5] rounded-xl space-y-2.5 mt-2 shadow-2xs">
            {/* Header: Term & Language/Category Badges */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#ede6d8]">
              <div>
                <h5 className="font-bold text-xs text-[#1c1d21]">
                  {activeEntry.term}
                </h5>
                <span className="text-[11px] font-bold text-[#842323] block mt-0.5">
                  {activeEntry.banglaMeaning}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[9px] bg-[#f0eae0] text-[#5b6271] px-2 py-0.5 rounded-full font-medium">
                  {activeEntry.category}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-[#842323]">
                  {activeEntry.language === "english" ? "EN ➔ BN" : "BN ব্যাখ্যা"}
                </span>
              </div>
            </div>

            {/* Simplified Meaning Block */}
            {activeEntry.simplifiedMeaning && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#646c7a] block uppercase tracking-wider">
                  {activeEntry.language === "english"
                    ? "Simplified English (সহজ ইংরেজি অর্থ):"
                    : "সহজ ভাষায় মূল ভাব ও ইংরেজি রূপ:"}
                </span>
                <p className="text-xs text-[#2b2f38] leading-relaxed font-sans bg-white/75 p-2 rounded-lg border border-[#ede5d6]">
                  {activeEntry.simplifiedMeaning}
                </p>
              </div>
            )}

            {/* Real-life Example Box (বাস্তব জীবনের সহজ উদাহরণ) */}
            {activeEntry.realLifeExample && (
              <div className="p-2.5 bg-[#fdfaf3] border border-[#f0e4cc] rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#b45309]">
                  <Lightbulb className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                  <span>বাস্তব জীবনের সহজ উদাহরণ:</span>
                </div>
                <p className="text-xs text-[#42341f] leading-relaxed font-sans">
                  {activeEntry.realLifeExample}
                </p>
              </div>
            )}

            {/* Exam Relevance */}
            {activeEntry.examRelevance && (
              <p className="text-[10px] text-[#555e6d] bg-[#f3ede1] p-1.5 rounded border border-[#e4dcce]">
                <strong>পরীক্ষার প্রস্তুতিতে গুরুত্ব:</strong> {activeEntry.examRelevance}
              </p>
            )}

            {/* 1-Click Saving Option to Study Hub */}
            <div className="pt-2 border-t border-[#ede6d8] flex items-center justify-between gap-2">
              <span className="text-[10px] text-[#717887]">
                ওয়ার্ড ব্যাংক ও ডাউনলোডে যুক্ত হবে
              </span>
              <button
                onClick={handleSaveWordToStudyHub}
                disabled={isSavingWord || wordSavedFeedback}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#842323] hover:bg-[#6e1c1c] disabled:bg-[#2e744a] text-white rounded text-xs font-semibold transition shrink-0"
              >
                {wordSavedFeedback ? (
                  <>
                    <Check className="w-3 h-3 text-white" />
                    <span>সংরক্ষিত হয়েছে!</span>
                  </>
                ) : isSavingWord ? (
                  <span>সংরক্ষণ...</span>
                ) : (
                  <>
                    <BookmarkPlus className="w-3 h-3" />
                    <span>+ শব্দভাণ্ডারে সংরক্ষণ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guest Notice if not logged in */}
      {!student && (
        <div className="p-3 bg-[#f6f2e8] border border-[#e2dcd0] rounded-lg text-center">
          <p className="text-[11px] text-[#555d6b]">
            নোট ও শব্দগুলো স্থায়ীভাবে আপনার অ্যাকাউন্টে সংরক্ষণ করতে{" "}
            <Link href={`/login?redirect=/article/${articleSlug}`} className="text-[#842323] font-bold underline">
              লগইন করুন
            </Link>
          </p>
        </div>
      )}
    </aside>
  );
}

