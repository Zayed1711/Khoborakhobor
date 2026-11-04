"use client";

import { useState } from "react";
import { FactTableRow, Student } from "@/types";
import {
  Table,
  BookmarkCheck,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  BookOpen,
  Landmark,
  BarChart3,
  Scale,
  Target,
  Lightbulb,
} from "lucide-react";
import { createStudyNoteAction } from "@/actions/student";

interface FactSheetTableProps {
  factTable?: FactTableRow[];
  articleSlug: string;
  articleTitle: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  student: Student | null;
  onSaveToNotebook?: (quote: string, memo: string) => void;
}

// Icon and color badge mapping for the 4 tiers of high-yield facts
const ROW_TIER_STYLES = [
  {
    icon: Landmark,
    badgeBg: "bg-indigo-50 border-indigo-200 text-indigo-900",
    iconColor: "text-indigo-700",
    label: "কর্তৃপক্ষ ও মূল পক্ষ",
  },
  {
    icon: BarChart3,
    badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-900",
    iconColor: "text-emerald-700",
    label: "উপাত্ত ও প্রধান সিদ্ধান্ত",
  },
  {
    icon: Scale,
    badgeBg: "bg-amber-50 border-amber-200 text-amber-900",
    iconColor: "text-amber-700",
    label: "আইনি ভিত্তি ও পটভূমি",
  },
  {
    icon: Target,
    badgeBg: "bg-rose-50 border-rose-200 text-rose-900",
    iconColor: "text-rose-700",
    label: "বিসিএস ও ভর্তি পরীক্ষা কোণ",
  },
];

export default function FactSheetTable({
  factTable,
  articleSlug,
  articleTitle,
  sourceName,
  sourceUrl,
  student,
  onSaveToNotebook,
}: FactSheetTableProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!factTable || factTable.length === 0) {
    return null;
  }

  // Generate formatted structured text for study card copying
  const formattedStudyCard = [
    `[বিসিএস ও ভর্তি পরীক্ষা উপাত্ত ছক]`,
    `প্রতিবেদন: "${articleTitle}"`,
    `--------------------------------------------------`,
    ...factTable.map((row, i) => {
      const tier = ROW_TIER_STYLES[i % ROW_TIER_STYLES.length];
      return `• ${row.parameter}: ${row.value}\n  └ গুরুত্ব: ${row.relevance}`;
    }),
    `--------------------------------------------------`,
    `উৎস: ${sourceName || "খবরাখবর একাডেমিক সংকলন"}`,
  ].join("\n");

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(formattedStudyCard);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSaveToNotebook = async () => {
    if (!student) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature: "notebook" } }));
      }
      return;
    }

    try {
      setIsSaving(true);
      const quoteText = formattedStudyCard;
      const memo = "বিসিএস লিখিত ও প্রিলিমিনারি রিভিশন উপাত্ত ছক";

      if (onSaveToNotebook) {
        onSaveToNotebook(quoteText, memo);
      } else {
        await createStudyNoteAction(student.id, articleSlug, quoteText, memo);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save fact sheet to notebook:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="my-8 bg-[#fdfbf7] border border-[#e4ded3] rounded-2xl shadow-xs overflow-hidden transition-all duration-200">
      {/* Top Banner Header */}
      <div className="bg-[#f5f0e6] border-b border-[#e2dcd0] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#842323] text-white flex items-center justify-center shadow-2xs">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1c1d21] font-serif">
                বিসিএস ও ভর্তি পরীক্ষা তথ্য ছক (Exam Fact Sheet)
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                হাই-ইল্ড ডেটা
              </span>
            </div>
            <p className="text-[11px] text-[#6b7280]">
              প্রিলিমিনারি নৈর্ব্যক্তিক ও লিখিত রচনায় কোটেশনযোগ্য সুনির্দিষ্ট পরিসংখ্যান
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg border border-[#ded8cb] bg-white hover:bg-[#faf8f4] text-[#404652] text-xs font-medium transition flex items-center gap-1 shadow-2xs cursor-pointer"
            title="সম্পূর্ণ তথ্য ছক কপি করুন"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">কপি হয়েছে</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#6b7280]" />
                <span>স্টাডি কার্ড কপি</span>
              </>
            )}
          </button>

          {student && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveToNotebook}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-[#842323] hover:bg-[#6e1c1c] text-white"
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{saved ? "নোটবুকে সংরক্ষিত ✓" : isSaving ? "সংরক্ষণ হচ্ছে..." : "নোটবুকে যুক্ত করুন"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#eae4d8] bg-[#faf6ee] text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#525a68]">
              <th className="py-2.5 px-4 sm:px-5 w-1/4">ক্ষেত্র / সূচক</th>
              <th className="py-2.5 px-4 sm:px-5 w-5/12 text-[#1c1d21]">সুনির্দিষ্ট তথ্য ও পরিসংখ্যান</th>
              <th className="py-2.5 px-4 sm:px-5 w-1/3">পরীক্ষার প্রাসঙ্গিকতা</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ece6db] text-xs sm:text-[13px]">
            {factTable.map((row, idx) => {
              const tier = ROW_TIER_STYLES[idx % ROW_TIER_STYLES.length];
              const TierIcon = tier.icon;
              return (
                <tr
                  key={idx}
                  className="hover:bg-[#fbf7ef] transition-colors odd:bg-white even:bg-[#fdfcf9]"
                >
                  <td className="py-3 px-4 sm:px-5 font-semibold text-[#1c1d21] align-top">
                    <div className="flex items-start gap-2">
                      <div className={`p-1 rounded-md border shrink-0 mt-0.5 ${tier.badgeBg}`}>
                        <TierIcon className={`w-3.5 h-3.5 ${tier.iconColor}`} />
                      </div>
                      <div>
                        <span className="text-[#1c1d21] font-bold block">{row.parameter}</span>
                        <span className="text-[10px] text-[#717887] font-normal block sm:hidden">
                          {tier.label}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 sm:px-5 text-[#2a2f3a] font-medium leading-relaxed align-top">
                    <span className="inline-block bg-[#f5f1e8] text-[#1a1c22] px-2.5 py-1 rounded-md font-mono font-bold text-xs sm:text-[13px] border border-[#e5dfd4] shadow-2xs">
                      {row.value}
                    </span>
                  </td>
                  <td className="py-3 px-4 sm:px-5 text-[#5e6675] leading-relaxed align-top">
                    <div className="flex items-center gap-1.5 text-xs text-[#4b5563]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#842323] shrink-0" />
                      <span className="italic">{row.relevance}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* High-Yield Exam Tip Callout Box */}
      <div className="bg-[#faf6ee] border-t border-[#ece4d5] px-4 sm:px-6 py-3 flex items-start gap-2.5">
        <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-[#524b3a] leading-relaxed">
          <span className="font-bold text-[#842323]">পরীক্ষার প্রস্তুতিতে যেভাবে ব্যবহার করবেন: </span>
          বিসিএস লিখিত পরীক্ষায় বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলিতে কিংবা ইংরেজি রচনায় (Essay) এই সুনির্দিষ্ট উপাত্ত, প্রতিষ্ঠান ও সাল ভূমিকা বা উপসংহারে উদ্ধৃতি (Quotation) হিসেবে জুড়ে দিলে খাতায় উচ্চ নম্বর প্রাপ্তি নিশ্চিত হয়।
        </div>
      </div>

      {/* Bottom Source Note & Authoritative Outbound Link */}
      <div className="px-4 sm:px-6 py-3 bg-[#faf7f0] border-t border-[#e8e2d6] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6b7280]">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#842323]" />
          <span>খবরাখবর বিশেষ একাডেমিক ফ্যাক্টশিট ও পরীক্ষা প্রস্তুতি সংকলন</span>
        </div>

        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#842323] hover:text-[#5e1919] hover:underline transition"
          >
            <span>সংবাদপত্রের বিস্তারিত প্রতিবেদন দেখুন</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
