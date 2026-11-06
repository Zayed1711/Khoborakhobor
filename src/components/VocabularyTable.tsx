"use client";

import { useState } from "react";
import { VocabularyTableRow } from "@/lib/vocabulary-table-engine";
import { Student } from "@/types";
import { saveCustomDictionaryTermAction } from "@/actions/student";
import { 
  Volume2, BookmarkPlus, Check, Copy, Sparkles, 
  BookOpen, Lightbulb, BookmarkCheck, Eye, EyeOff
} from "lucide-react";
import ProAuthGateModal from "./ProAuthGateModal";
import { openDictionary } from "./DictionaryHost";

interface VocabularyTableProps {
  rows: VocabularyTableRow[];
  articleSlug: string;
  articleTitle: string;
  student: Student | null;
  onSaveFeedback?: (msg: string) => void;
}

export default function VocabularyTable({
  rows,
  articleSlug,
  articleTitle,
  student,
  onSaveFeedback,
}: VocabularyTableProps) {
  const [savedWordIds, setSavedWordIds] = useState<Record<string, boolean>>({});
  const [copiedAll, setCopiedAll] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState(false);
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  if (!rows || rows.length === 0) return null;

  // 1-Click Audio Pronunciation via Web Speech API with Fallback
  const handlePlayAudio = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.88; // Slightly measured pace for clear academic articulation

      // Try to select an authentic English voice
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find((v) => v.lang.startsWith("en-") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")));
      if (enVoice) {
        utterance.voice = enVoice;
      }

      setPlayingWord(word);
      utterance.onend = () => setPlayingWord(null);
      utterance.onerror = () => setPlayingWord(null);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle Reveal for a word in Self-Test Mode
  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1-Click Save single word to Student's Word Bank
  const handleSaveWord = async (row: VocabularyTableRow) => {
    if (!student) {
      setIsAuthGateOpen(true);
      return;
    }

    try {
      await saveCustomDictionaryTermAction(
        student.id,
        articleSlug,
        row.word,
        `${row.banglaMeaning} | ${row.englishDefinition}`,
        row.freshExampleEn
      );
      setSavedWordIds((prev) => ({ ...prev, [row.id]: true }));
      if (onSaveFeedback) {
        onSaveFeedback(`"${row.word}" আপনার ওয়ার্ড ব্যাংকে সংরক্ষিত হয়েছে!`);
      }
    } catch (err) {
      console.error(err);
      if (onSaveFeedback) {
        onSaveFeedback("সংরক্ষণ করতে সমস্যা হয়েছে।");
      }
    }
  };

  // Batch Save all words in table
  const handleSaveAll = async () => {
    if (!student) {
      setIsAuthGateOpen(true);
      return;
    }

    setSavingAll(true);
    try {
      for (const row of rows) {
        await saveCustomDictionaryTermAction(
          student.id,
          articleSlug,
          row.word,
          `${row.banglaMeaning} | ${row.englishDefinition}`,
          row.freshExampleEn
        );
      }
      const allSaved: Record<string, boolean> = {};
      rows.forEach((r) => { allSaved[r.id] = true; });
      setSavedWordIds(allSaved);
      if (onSaveFeedback) {
        onSaveFeedback("সবগুলো শব্দ আপনার ওয়ার্ড ব্যাংকে যুক্ত হয়েছে!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAll(false);
    }
  };

  // Copy entire vocabulary matrix formatted for study notebook
  const handleCopyAll = () => {
    if (typeof window === "undefined") return;

    let text = `খবরাখবর — ইংরেজি শব্দকোষ ও প্রয়োগ ছক (Vocabulary Matrix)\n`;
    text += `প্রতিবেদন: "${articleTitle}"\n`;
    text += `--------------------------------------------------\n\n`;

    rows.forEach((r, idx) => {
      text += `${idx + 1}. ${r.word} [উচ্চারণ: ${r.banglaPhonetic}] (${r.partOfSpeech})\n`;
      if (r.banglaMeaning) text += `   • বাংলা অর্থ: ${r.banglaMeaning}\n`;
      text += `   • English: ${r.englishDefinition}\n`;
      if (r.synonyms && r.synonyms.length > 0) {
        text += `   • Synonyms: ${r.synonyms.join(", ")}\n`;
      }
      text += `   • প্রতিবেদনে ব্যবহার (In the story):\n`;
      text += `     "${r.freshExampleEn}"\n`;
      text += r.freshExampleBn ? `     (${r.freshExampleBn})\n\n` : "\n";
    });

    text += `--------------------------------------------------\n`;
    text += `উৎস: খবরাখবর ইংরেজি শিক্ষা প্ল্যাটফর্ম\n`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2400);
  };

  return (
    <>
      <section className="my-8 rounded-2xl bg-white border border-[#ded8cb] shadow-sm overflow-hidden select-text">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-50/90 via-[#f8faff] to-[#f4f7fc] border-b border-[#e2e8f0] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#0f172a] font-serif">
                  শব্দভাণ্ডার ও বাস্তব প্রয়োগ ছক (Vocabulary Matrix)
                </h3>
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  {rows.length}টি মূল শব্দ
                </span>
              </div>
              <p className="text-xs text-[#64748b] mt-0.5">
                এই প্রতিবেদন থেকে বাছাই করা শব্দ: অর্থ, উচ্চারণ ও প্রতিবেদনে ব্যবহার
              </p>
            </div>
          </div>

          {/* Interactive Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Self-Test / Active Recall Flashcard Mode */}
            <button
              type="button"
              onClick={() => setIsFlashcardMode(!isFlashcardMode)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs ${
                isFlashcardMode
                  ? "bg-amber-100 border-amber-300 text-amber-900"
                  : "bg-white border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#334155]"
              }`}
              title="অর্থ গোপন রেখে নিজের স্মৃতি পরীক্ষা করুন (Active Recall Mode)"
            >
              {isFlashcardMode ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-800" />
                  <span>স্মৃতি যাচাই সক্রিয়</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-[#64748b]" />
                  <span>স্মৃতি যাচাই মোড</span>
                </>
              )}
            </button>

            {/* Copy Table Button */}
            <button
              type="button"
              onClick={handleCopyAll}
              className="px-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#334155] text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
              title="সম্পূর্ণ শব্দতালিকা ও উদাহরণ ক্লিপবোর্ডে কপি করুন"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#64748b]" />}
              <span>{copiedAll ? "কপি হয়েছে!" : "ছক কপি"}</span>
            </button>

            {/* Save All to Word Bank */}
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll}
              className="px-3 py-1.5 rounded-lg bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs disabled:opacity-70"
              title="সবগুলো শব্দ আপনার ব্যক্তিগত ওয়ার্ড ব্যাংকে যুক্ত করুন"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{savingAll ? "সংরক্ষণ হচ্ছে..." : "সব সেভ করুন"}</span>
            </button>
          </div>
        </div>

        {/* Self-Test Banner when Flashcard Mode is ON */}
        {isFlashcardMode && (
          <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>স্মৃতি যাচাই মোড চালু:</strong> শব্দটির অর্থ মনে করার চেষ্টা করুন, এরপর বক্সে ক্লিক করে উত্তর যাচাই করুন।
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRevealedIds({})}
              className="text-xs underline font-semibold text-amber-800 hover:text-amber-950"
            >
              সব পুনরায় ঢাকুন
            </button>
          </div>
        )}

        {/* Responsive Table Layout */}
        <div className="overflow-x-auto">
          {/* Desktop View Table */}
          <table className="w-full text-left hidden md:table border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-xs font-bold text-[#475569] uppercase tracking-wider font-mono">
                <th className="py-3 px-4 w-[28%]">১. শব্দ ও উচ্চারণ (Word & Phonics)</th>
                <th className="py-3 px-4 w-[36%]">২. দ্বৈত অর্থ ও সমার্থক (Meanings)</th>
                <th className="py-3 px-4 w-[36%]">৩. প্রতিবেদনে ব্যবহার (In the story)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2f7] text-xs">
              {rows.map((row) => {
                const isSaved = Boolean(savedWordIds[row.id]);
                const isPlaying = playingWord === row.word;
                const isRevealed = Boolean(revealedIds[row.id]);
                const shouldMask = isFlashcardMode && !isRevealed;

                return (
                  <tr key={row.id} className="hover:bg-[#fbfcfe] transition-colors">
                    {/* Column 1: Word & Pronunciation */}
                    <td className="py-4 px-4 align-top space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#0f172a] tracking-tight">
                          {row.word}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(row.word)}
                          className={`p-1.5 rounded-full transition ${
                            isPlaying
                              ? "bg-blue-600 text-white animate-pulse shadow-xs"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                          title="উচ্চারণ শুনুন (Listen Native Audio)"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded font-mono font-medium text-xs">
                          {row.banglaPhonetic ? `[${row.banglaPhonetic}]` : null}
                        </span>
                        <span className="text-xs text-[#64748b] font-medium">
                          {row.partOfSpeech}
                        </span>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleSaveWord(row)}
                          disabled={isSaved}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                            isSaved
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] border border-[#cbd5e1]"
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>সেভ হয়েছে</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3 h-3 text-[#1e40af]" />
                              <span>ওয়ার্ড ব্যাংকে সেভ</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Column 2: Dual Meanings & Synonyms */}
                    <td className="py-4 px-4 align-top space-y-2">
                      <div
                        onClick={() => shouldMask && toggleReveal(row.id)}
                        className={`${shouldMask ? "cursor-pointer group relative" : ""} ${row.banglaMeaning ? "" : "hidden"}`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-800 block mb-0.5">
                          বাংলা অর্থ:
                        </span>
                        {shouldMask ? (
                          <div className="bg-amber-50/70 border border-dashed border-amber-300 rounded-lg p-2.5 text-center text-amber-900 font-semibold group-hover:bg-amber-100 transition">
                            <span className="text-xs">ক্লিক করে অর্থ দেখুন (Reveal)</span>
                          </div>
                        ) : (
                          <p className="text-xs text-[#1e293b] leading-relaxed font-sans font-medium">
                            {row.banglaMeaning}
                          </p>
                        )}
                      </div>

                      <div className="pt-1 border-t border-[#f1f5f9]">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#64748b] block mb-0.5 font-mono">
                          English Concept:
                        </span>
                        <p className="text-xs text-[#475569] leading-relaxed italic">
                          "{row.englishDefinition}"
                        </p>
                        {!row.banglaMeaning && (
                          <button type="button" onClick={() => openDictionary(row.word)} className="text-xs text-[#1e40af] font-semibold hover:underline text-left">
                            (বাংলা অর্থ জানতে অভিধান ব্যবহার করুন)
                          </button>
                        )}
                      </div>

                      {row.synonyms && row.synonyms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          <span className="text-xs text-[#64748b] font-semibold">Synonyms:</span>
                          {row.synonyms.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-xs bg-slate-100 text-[#334155] px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Column 3: the sentence from this story where the word is used */}
                    <td className="py-4 px-4 align-top">
                      <div className="p-3 bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-xl border border-[#e2e8f0] space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 font-mono">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>প্রতিবেদনে ব্যবহার (In the story):</span>
                        </div>
                        <p className="text-xs text-[#0f172a] font-medium leading-relaxed">
                          &ldquo;<Highlighted text={row.freshExampleEn} word={row.word} />&rdquo;
                        </p>
                        {row.freshExampleBn && (
                          <p className="text-xs text-[#475569] leading-relaxed border-t border-slate-200/80 pt-1.5">{row.freshExampleBn}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mobile View: Vertical Card Flow */}
          <div className="md:hidden divide-y divide-[#e2e8f0]">
            {rows.map((row) => {
              const isSaved = Boolean(savedWordIds[row.id]);
              const isPlaying = playingWord === row.word;
              const isRevealed = Boolean(revealedIds[row.id]);
              const shouldMask = isFlashcardMode && !isRevealed;

              return (
                <div key={row.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-[#0f172a]">
                        {row.word}
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(row.word)}
                        className={`p-1.5 rounded-full ${
                          isPlaying ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveWord(row)}
                      disabled={isSaved}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                        isSaved
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {isSaved ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                      <span>{isSaved ? "সেভড" : "সেভ"}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-xs font-mono font-medium">
                      {row.banglaPhonetic ? `[${row.banglaPhonetic}]` : null}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      {row.partOfSpeech}
                    </span>
                  </div>

                  <div
                    onClick={() => shouldMask && toggleReveal(row.id)}
                    className={`space-y-1 ${shouldMask ? "cursor-pointer" : ""} ${row.banglaMeaning ? "" : "hidden"}`}
                  >
                    <span className="text-xs font-bold text-blue-800 block">বাংলা অর্থ:</span>
                    {shouldMask ? (
                      <div className="bg-amber-50 border border-dashed border-amber-300 rounded-lg p-2 text-center text-amber-900 text-xs font-semibold">
                        ক্লিক করে অর্থ দেখুন (Reveal)
                      </div>
                    ) : (
                      <p className="text-xs text-[#1e293b] leading-relaxed">
                        {row.banglaMeaning}
                      </p>
                    )}
                  </div>

                  {row.englishDefinition && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#64748b] block font-mono">English meaning:</span>
                      <p className="text-xs text-[#475569] leading-relaxed italic">{row.englishDefinition}</p>
                      {row.synonyms && row.synonyms.length > 0 && <p className="text-xs text-[#64748b]">Synonyms: {row.synonyms.join(", ")}</p>}
                      {!row.banglaMeaning && (
                        <button type="button" onClick={() => openDictionary(row.word)} className="text-xs text-[#1e40af] font-semibold hover:underline text-left">
                          (বাংলা অর্থ জানতে অভিধান ব্যবহার করুন)
                        </button>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] space-y-1.5">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block font-mono">
                      প্রতিবেদনে ব্যবহার (In the story):
                    </span>
                    <p className="text-xs text-[#0f172a] font-medium leading-relaxed">
                      &ldquo;<Highlighted text={row.freshExampleEn} word={row.word} />&rdquo;
                    </p>
                    {row.freshExampleBn && <p className="text-xs text-[#475569] leading-relaxed pt-1 border-t border-slate-200">{row.freshExampleBn}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="px-4 py-2 text-[11px] text-[#94a3b8] border-t border-[#e2e8f0]">
            Words chosen from this story. English meanings: Wiktionary (CC BY-SA), via the Free Dictionary API.
          </p>
        </div>
      </section>

      {/* Auth Gate Modal when saving while unauthenticated */}
      <ProAuthGateModal
        isOpen={isAuthGateOpen}
        onClose={() => setIsAuthGateOpen(false)}
        feature="dictionary"
        customTitle="ব্যক্তিগত ওয়ার্ড ব্যাংক (Personal Word Bank)"
        customDescription="গুরুত্বপূর্ণ ইংরেজি শব্দার্থ ও উদাহরণ আপনার ক্লাউড ওয়ার্ড ব্যাংকে সংরক্ষণ করতে এবং নিয়মিত ফ্ল্যাশকার্ড রিভিশন দিতে বিনামূল্যে লগইন করুন।"
      />
    </>
  );
}

/** The example sentence with the word (in any form) in bold. */
function Highlighted({ text, word }: { text: string; word: string }) {
  const stem = word.toLowerCase().replace(/(?:e|ed|es|s|ing)$/, "").slice(0, Math.max(4, word.length - 3));
  const safe = stem.replace(/[^a-z]/g, "");
  if (!safe) return <>{text}</>;
  const parts = text.split(new RegExp(`(\\b${safe}[a-z]*\\b)`, "i"));
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className="text-emerald-800">{p}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}
