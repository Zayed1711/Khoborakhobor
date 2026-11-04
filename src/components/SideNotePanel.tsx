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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature: "notebook" } }));
      }
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
      // Silent graceful failure with console log
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

  // Instant Dictionary Lookup
  const handleDictSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dictQuery.trim()) return;

    setIsSearchingDict(true);
    try {
      const result = await lookupConceptDictionary(dictQuery.trim());
      setActiveEntry(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingDict(false);
    }
  };

  // Save Dictionary Term into Student's Word Bank
  const handleSaveWordToStudyHub = async () => {
    if (!activeEntry) return;
    if (!student) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature: "dictionary" } }));
      }
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
      // Silent graceful failure with console log
    } finally {
      setIsSavingWord(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay (Click outside to dismiss) */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 md:hidden animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dual-Mode Container: Slide-Up Bottom Sheet on Mobile (< md) / Sticky Rail on Desktop (>= md) */}
      <aside className="
        fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-3xl shadow-2xl bg-[#ffffff] border-t border-[#ded8cb] p-4 sm:p-5 flex flex-col gap-4 text-xs text-[#2a2d34] overflow-y-auto animate-in slide-in-from-bottom duration-300
        md:relative md:inset-auto md:z-30 md:w-80 lg:w-88 xl:w-96 md:rounded-xl md:border md:border-[#e2dcd0] md:shadow-lg md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:animate-none
      ">
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-[#d5cfc2] rounded-full mx-auto -mt-1 mb-1 md:hidden shrink-0" />

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
              স্টাডি হাব →
            </Link>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#88909d] hover:text-[#17191d] hover:bg-[#f6f2e8] transition"
              title="প্যানেল বন্ধ করুন"
              aria-label="প্যানেল বন্ধ করুন"
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
                  <span>+ নোট যুক্ত করুন</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Saved Highlighting & Memos List */}
        <div className="space-y-2 pt-2 border-t border-[#ece7dc]">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-[#1c1d21] flex items-center gap-1.5">
              <Highlighter className="w-3.5 h-3.5 text-[#842323]" />
              <span>নিবন্ধের সংরক্ষিত অংশসমূহ ({notes.length})</span>
            </h4>
          </div>

          {notes.length === 0 ? (
            <div className="p-3 bg-[#faf8f3] rounded border border-dashed border-[#ded8cb] text-center text-[#788191]">
              <p className="text-[11px] leading-relaxed">
                নিবন্ধের যেকোনো বাক্য সিলেক্ট করে মার্কার দিয়ে চিহ্নিত করুন। সেগুলো সাথে সাথে এখানে জমা হবে।
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {notes.map((note) => {
                const noteColor = (note as any).color;
                let colorBorder = "border-l-amber-400 bg-amber-50/40";
                if (noteColor === "সবুজ মার্কার") colorBorder = "border-l-emerald-500 bg-emerald-50/40";
                if (noteColor === "বেগুনি মার্কার") colorBorder = "border-l-purple-400 bg-purple-50/40";

                return (
                  <div
                    key={note.id}
                    className={`p-2.5 rounded border border-[#ded8cb] border-l-4 ${colorBorder} space-y-1 relative group`}
                  >
                    <p className="text-xs text-[#17191d] font-serif leading-relaxed italic">
                      &ldquo;{note.quoteText || (note as any).snippet}&rdquo;
                    </p>
                    {note.memo && (
                      <p className="text-[11px] text-[#555e6d] bg-white/80 p-1 rounded font-sans border border-[#e8e2d6]">
                        {note.memo}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-[#8e95a2] pt-1">
                      <span>{noteColor || "মার্কার"}</span>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-red-700 hover:text-red-900 transition p-0.5"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Smart Concept Lexicon & Quick Dictionary */}
        <div className="space-y-2.5 pt-2 border-t border-[#ece7dc]">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-xs text-[#1c1d21] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#842323]" />
              <span>স্মার্ট ধারণা ও শব্দকোষ (Lexicon)</span>
            </h4>
            <span className="text-[10px] text-[#717887]">তাত্ক্ষণিক অর্থ ও উদাহরণ</span>
          </div>

          {/* Dictionary Search Input */}
          <form onSubmit={handleDictSearch} className="flex gap-1.5">
            <input
              type="text"
              value={dictQuery}
              onChange={(e) => setDictQuery(e.target.value)}
              placeholder="ইংরেজি শব্দ বা পারিভাষিক শব্দ খুঁজুন..."
              className="flex-1 bg-[#fdfcf9] border border-[#ded8cb] rounded px-2.5 py-1 text-xs outline-none focus:border-[#842323]"
            />
            <button
              type="submit"
              disabled={isSearchingDict || !dictQuery.trim()}
              className="px-2.5 py-1 bg-[#252c38] text-white rounded text-xs hover:bg-[#17191d] disabled:opacity-50 transition flex items-center gap-1"
            >
              {isSearchingDict ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
            </button>
          </form>

          {/* Active Entry Result Card */}
          {activeEntry && (
            <div className="p-3 bg-[#faf8f4] border border-[#ded8cb] rounded-lg space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#842323] font-serif">
                  {activeEntry.term}
                </span>
                <span className="text-[10px] bg-[#ede7dc] text-[#555d6b] px-1.5 py-0.5 rounded font-mono">
                  {activeEntry.category}
                </span>
              </div>

              <p className="text-xs text-[#2c323f] leading-relaxed">
                {activeEntry.definition}
              </p>

              {activeEntry.realLifeExample && (
                <div className="text-[11px] text-[#3e4552] bg-white p-2 rounded border border-[#e4dcce] space-y-0.5">
                  <span className="font-semibold text-[#842323] block text-[10px]">বাস্তব প্রয়োগ / উদাহরণ:</span>
                  <p className="italic">{activeEntry.realLifeExample}</p>
                </div>
              )}

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
    </>
  );
}
