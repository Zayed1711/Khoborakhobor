"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle, Newspaper, XCircle } from "lucide-react";

/**
 * The daily challenge card, shared by the desktop study rail and the phone feed so
 * they always behave the same.
 *
 * Every daily quiz is a fill-in-the-blank built from one sentence of a real story, so
 * it can only be answered after reading that story. The card therefore names the
 * story first and links to it, then asks the question. The source sentence (which
 * contains the answer) is shown only after an answer is chosen.
 */

export interface DailyQuiz {
  question: string;
  options: string[];
  correctOption: number;
  explanation?: string | null;
  sourceName?: string | null;
  articleTitle?: string | null;
  articleSlug?: string | null;
}

const PREFIX_BN = ["(ক)", "(খ)", "(গ)", "(ঘ)"];
const PREFIX_EN = ["(A)", "(B)", "(C)", "(D)"];

export default function DailyQuizCard({
  quiz,
  isEnglishMode = false,
  id,
  className = "",
}: {
  quiz: DailyQuiz;
  isEnglishMode?: boolean;
  id?: string;
  className?: string;
}) {
  const [answeredKey, setAnsweredKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  // Reset when a different quiz is shown (e.g. switching language mode)
  const answered = answeredKey === quiz.question;

  const source = quiz.sourceName?.split("(")[0]?.trim();
  const storyHref = quiz.articleSlug ? `/article/${quiz.articleSlug}` : null;
  const accent = isEnglishMode ? "text-[#1e40af]" : "text-[#842323]";

  const choose = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnsweredKey(quiz.question);
  };

  return (
    <div id={id} className={`bg-white border border-[#ded8cb] rounded-2xl p-3.5 space-y-3 ${className}`}>
      <div className={`flex items-center gap-1.5 text-sm font-semibold ${accent}`}>
        <HelpCircle className="w-4 h-4" />
        <span>{isEnglishMode ? "Today's quiz" : "আজকের কুইজ"}</span>
      </div>

      {/* The story the question comes from, with a clear way to read it first */}
      {storyHref && quiz.articleTitle && (
        <div className="rounded-xl bg-[#fbf9f5] border border-[#e9e3d8] p-3 space-y-1.5">
          <p className="text-xs text-[#68707f] flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5" />
            {isEnglishMode ? "From this story" : "এই খবর থেকে"}
            {source ? ` · ${source}` : ""}
          </p>
          <Link href={storyHref} className="block font-serif text-[15px] leading-snug text-[#17191d] hover:text-[#842323]">
            {quiz.articleTitle}
          </Link>
          <Link href={storyHref} className={`inline-flex items-center gap-1 text-sm font-semibold ${accent} hover:underline`}>
            {isEnglishMode ? "Read the story" : "খবরটি পড়ুন"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {!answered && (
        <p className="text-xs text-[#68707f]">
          {isEnglishMode ? "Read the story first, then answer." : "আগে খবরটি পড়ুন, তারপর উত্তর দিন।"}
        </p>
      )}

      <p className="text-sm font-semibold text-[#1c1d21] leading-relaxed break-words whitespace-pre-line">{quiz.question}</p>

      <div className="space-y-1.5">
        {quiz.options.map((opt, idx) => {
          let style = "bg-[#fbf9f5] border-[#ded8cb] hover:bg-[#f6f2e8] text-[#343a46]";
          if (answered) {
            if (idx === quiz.correctOption) style = "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold";
            else if (selected === idx) style = "bg-rose-50 border-rose-300 text-rose-900";
            else style = "bg-white border-[#ece6db] text-[#8a909b]";
          }
          return (
            <button
              key={idx}
              type="button"
              disabled={answered}
              onClick={() => choose(idx)}
              className={`w-full text-left p-2.5 rounded-lg border text-sm transition flex items-start justify-between gap-2 ${style}`}
            >
              <span className="flex items-start gap-1.5 min-w-0">
                <span className="text-xs text-[#717887] mt-0.5 shrink-0">
                  {(isEnglishMode ? PREFIX_EN : PREFIX_BN)[idx] || `(${idx + 1})`}
                </span>
                <span className="break-words leading-snug">{opt}</span>
              </span>
              {answered && idx === quiz.correctOption && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {answered && selected === idx && idx !== quiz.correctOption && <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {answered && quiz.explanation && (
        <p className="p-2.5 bg-[#faf8f4] border border-[#ded8cb] rounded-lg text-sm text-[#404652] leading-relaxed">
          <span className="font-semibold text-[#1c1d21]">{isEnglishMode ? "Explanation: " : "ব্যাখ্যা: "}</span>
          {quiz.explanation}
        </p>
      )}
    </div>
  );
}
