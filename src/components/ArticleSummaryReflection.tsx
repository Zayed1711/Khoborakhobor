"use client";

import { useState } from "react";
import { MessageSquareQuote, Check, Sparkles, Send, Trash2 } from "lucide-react";
import { saveArticleSummaryReflectionAction, deleteStudyNoteAction } from "@/actions/student";
import { StudyNote, Student } from "@/types";
import Link from "next/link";

interface ArticleSummaryReflectionProps {
  articleSlug: string;
  articleTitle: string;
  student: Student | null;
  notes: StudyNote[];
  onNotesChange: (notes: StudyNote[]) => void;
}

export default function ArticleSummaryReflection({
  articleSlug,
  articleTitle,
  student,
  notes,
  onNotesChange,
}: ArticleSummaryReflectionProps) {
  const [summaryInput, setSummaryInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState(false);

  // Filter notes that are active summary reflections
  const summaryNotes = notes.filter((n) => n.memo?.includes("[সারসংক্ষেপ অনুশীলন]"));

  const handleSaveSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryInput.trim()) return;

    if (!student) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature: "notebook" } }));
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const newNote = await saveArticleSummaryReflectionAction(
        student.id,
        articleSlug,
        summaryInput.trim()
      );
      onNotesChange([newNote as any, ...notes]);
      setSummaryInput("");
      setSuccessFeedback(true);
      setTimeout(() => setSuccessFeedback(false), 3000);
    } catch (err: any) {
      console.error(err);
      // Handled gracefully without raw alert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSummary = async (noteId: string) => {
    try {
      await deleteStudyNoteAction(noteId, articleSlug);
      onNotesChange(notes.filter((n) => n.id !== noteId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="mt-12 p-6 sm:p-7 bg-[#faf7f0] border border-[#ded8cb] rounded-xl shadow-2xs font-sans">
      {/* Header Banner */}
      <div className="flex items-start gap-3.5 pb-4 border-b border-[#e5dfd2]">
        <div className="w-9 h-9 rounded-lg bg-[#842323] text-white flex items-center justify-center shrink-0 shadow-xs">
          <MessageSquareQuote className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-[#17191d] font-serif">
            পাঠোত্তর প্রতিফলন ও সারসংক্ষেপ অনুশীলন (Active Recall)
          </h3>
          <p className="text-xs text-[#525964] mt-1 leading-relaxed">
            প্রতিবেদনটি পড়া শেষ করার পর মূল ভাবটি নিজের ভাষায় ২-৩ বাক্যে লিখুন। এটি বিসিএস লিখিত ও ভর্তি পরীক্ষার ফোকাস রাইটিংয়ে আপনার নিজের ভাষায় উত্তর লেখার সক্ষমতা বহু গুণ বাড়িয়ে দেবে।
          </p>
        </div>
      </div>

      {/* Reflection Input Form */}
      <form onSubmit={handleSaveSummary} className="mt-4 space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={summaryInput}
            onChange={(e) => setSummaryInput(e.target.value)}
            placeholder="এই প্রতিবেদন পড়ে আপনি মূল কী শিখলেন? নিজের ভাষায় সংক্ষেপে লিখুন (যেমন: প্রতিবেদনে প্রধান ৩টি দিক তুলে ধরা হয়েছে—১... ২... ৩...)"
            className="w-full text-xs p-3.5 bg-white border border-[#d6cfc1] rounded-lg outline-none focus:border-[#842323] text-[#22252c] placeholder:text-[#9aa2b0] leading-relaxed resize-none shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#717887]">
            {summaryInput.length > 0 ? (
              <span>{summaryInput.length} হরফ লিখিত</span>
            ) : (
              <span>সরাসরি আপনার স্টাডি হাবে সংরক্ষিত হবে</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!student && (
              <span className="text-xs text-[#788191]">
                সংরক্ষণ করতে{" "}
                <Link href={`/login?redirect=/article/${articleSlug}`} className="text-[#842323] font-semibold underline">
                  লগইন
                </Link>{" "}
                করুন
              </span>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !summaryInput.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#842323] hover:bg-[#6e1c1c] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition shadow-xs"
            >
              {successFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>সারসংক্ষেপ সংরক্ষিত হয়েছে!</span>
                </>
              ) : isSubmitting ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>সারসংক্ষেপ সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* List of previously submitted reflections for this article */}
      {summaryNotes.length > 0 && (
        <div className="mt-6 pt-5 border-t border-[#e8e2d4] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c1d21]">
            আপনার লিখিত সারসংক্ষেপ ({summaryNotes.length} টি):
          </h4>
          <div className="space-y-2.5">
            {summaryNotes.map((note) => (
              <div
                key={note.id}
                className="p-3.5 bg-white border border-[#ded8cb] rounded-lg text-xs relative group flex items-start justify-between gap-3 shadow-2xs"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#842323] bg-[#f5ebeb] px-2 py-0.5 rounded">
                      সারসংক্ষেপ অনুশীলন
                    </span>
                    <span className="text-xs text-[#8e95a2]">
                      {new Date(note.createdAt).toLocaleDateString("bn-BD")}
                    </span>
                  </div>
                  <p className="text-xs text-[#2b2f38] leading-relaxed font-sans pt-1">
                    {note.quoteText}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSummary(note.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#a0a8b5] hover:text-[#842323] transition p-1"
                  title="মুছুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

