"use client";

import { useState } from "react";
import { QuizQuestion } from "@/types";
import { submitQuizAnswerAction } from "@/actions/student";
import { HelpCircle, CheckCircle2, XCircle, Award, RotateCcw, BookOpen } from "lucide-react";

interface MicroQuizProps {
  questions: any[];
  studentId: string;
  isEnglishMode?: boolean;
}

export default function MicroQuiz({ questions, studentId, isEnglishMode = false }: MicroQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<
    Record<string, { isCorrect: boolean; correctOption: number; explanation?: string | null }>
  >({});
  const [submitting, setSubmitting] = useState(false);

  if (!questions || questions.length === 0) return null;

  const handleSelect = (questionId: string, optionIdx: number) => {
    if (results[questionId]) return; // already evaluated
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleVerify = async (q: any) => {
    const chosen = selectedAnswers[q.id];
    if (chosen === undefined) return;

    // 1. Client-side evaluation for dynamic scaffolded questions
    if (typeof q.correctOption === "number") {
      const isCorrect = chosen === q.correctOption;
      setResults((prev) => ({
        ...prev,
        [q.id]: {
          isCorrect,
          correctOption: q.correctOption,
          explanation: q.explanation,
        },
      }));
      return;
    }

    // 2. Server-side database evaluation for stored questions
    setSubmitting(true);
    try {
      const res = await submitQuizAnswerAction(studentId, q.id, chosen);
      setResults((prev) => ({
        ...prev,
        [q.id]: {
          isCorrect: res.isCorrect,
          correctOption: res.correctOption,
          explanation: res.explanation,
        },
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const buttonAccent = isEnglishMode ? "bg-[#1e40af] hover:bg-blue-700" : "bg-[#842323] hover:bg-[#6e1c1c]";
  const selectedBorder = isEnglishMode ? "bg-blue-50 border-[#1e40af] text-[#1e40af]" : "bg-[#f5ebeb] border-[#842323] text-[#842323]";

  return (
    <div className="my-10 p-5 bg-[#ffffff] border border-[#e2dcd0] rounded-2xl shadow-2xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ece7dc]">
        <div className="flex items-center gap-2">
          {isEnglishMode ? (
            <BookOpen className="w-5 h-5 text-[#1e40af]" />
          ) : (
            <HelpCircle className="w-5 h-5 text-[#842323]" />
          )}
          <div>
            <h4 className="text-sm font-bold text-[#1c1d21] uppercase tracking-wide">
              {isEnglishMode
                ? "ইংরেজি পাঠ মূল্যায়ন ও কুইজ (Scaffolded Active Recall)"
                : "পঠন মূল্যায়ন ও কুইজ (Active Recall Comprehension)"}
            </h4>
            <p className="text-[11px] text-[#717887]">
              {isEnglishMode
                ? "প্যাসেজে ব্যবহৃত শব্দার্থ ও ব্যাকরণের ওপর আপনার দখল যাচাই করুন"
                : "প্রতিবেদনটি পড়ে আপনার বোধগম্যতা ও সাধারণ জ্ঞান যাচাই করুন"}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded font-semibold border ${
          isEnglishMode
            ? "bg-blue-50 text-[#1e40af] border-blue-200"
            : "bg-[#f4efe4] text-[#842323] border-[#e4d9c7]"
        }`}>
          {questions.length}টি প্রশ্ন
        </span>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const res = results[q.id];
          const chosen = selectedAnswers[q.id];
          const optionsList: string[] = Array.isArray(q.options)
            ? q.options
            : typeof q.options === "string"
            ? JSON.parse(q.options)
            : [];

          return (
            <div key={q.id} className="p-4 bg-[#fbf9f5] rounded-xl border border-[#eee9df]">
              {/* Context Citation Quote Anchor */}
              {q.contextQuote && (
                <div className="mb-3 p-3 bg-white border border-[#e8e2d5] rounded-lg text-xs shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] text-[#64748b] font-medium mb-1.5 pb-1 border-b border-[#f1ece2]">
                    <span className="font-semibold text-[#1c1d21]">প্রতিবেদনের প্রাসঙ্গিক তথ্যসূত্র:</span>
                    {q.paragraphRef && (
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isEnglishMode ? "bg-blue-50 text-blue-800 border border-blue-200" : "bg-[#f5ebeb] text-[#842323] border border-[#eccaca]"
                      }`}>
                        {q.paragraphRef}
                      </span>
                    )}
                  </div>
                  <p className="italic text-[#334155] leading-relaxed">
                    "{q.contextQuote}"
                  </p>
                </div>
              )}

              <div className="flex items-start justify-between gap-2 mb-3">
                <h5 className="text-xs sm:text-sm font-bold text-[#1c1d21] leading-snug">
                  {idx + 1}. {q.question}
                </h5>
                {q.topicTag && (
                  <span className="text-[10px] bg-slate-100 text-[#475569] px-2 py-0.5 rounded font-mono font-medium shrink-0">
                    {q.topicTag}
                  </span>
                )}
              </div>

              {/* Options */}
              <div className="space-y-2 mb-3">
                {optionsList.map((opt, oIdx) => {
                  let optStyle = "bg-[#ffffff] border-[#ded8cb] text-[#343a46] hover:bg-[#f6f2e8]";

                  if (res) {
                    if (oIdx === res.correctOption) {
                      optStyle = "bg-[#edf7ed] border-[#4caf50] text-[#1e4620] font-bold";
                    } else if (chosen === oIdx && !res.isCorrect) {
                      optStyle = "bg-[#fdeeed] border-[#e53935] text-[#5f1412]";
                    }
                  } else if (chosen === oIdx) {
                    optStyle = `${selectedBorder} font-semibold`;
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={!!res}
                      onClick={() => handleSelect(q.id, oIdx)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-center justify-between ${optStyle}`}
                    >
                      <span className="leading-relaxed">{opt}</span>
                      {res && oIdx === res.correctOption && (
                        <CheckCircle2 className="w-4 h-4 text-[#2e744a] shrink-0 ml-2" />
                      )}
                      {res && chosen === oIdx && !res.isCorrect && (
                        <XCircle className="w-4 h-4 text-[#c62828] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action / Explanation Box */}
              {!res ? (
                <button
                  disabled={chosen === undefined || submitting}
                  onClick={() => handleVerify(q)}
                  className={`px-4 py-1.5 ${buttonAccent} text-white text-xs font-semibold rounded-lg transition shadow-2xs disabled:opacity-40`}
                >
                  উত্তর যাচাই করুন
                </button>
              ) : (
                <div
                  className={`p-3 rounded-lg text-xs border ${
                    res.isCorrect
                      ? "bg-[#edf7ed] border-[#c8e6c9] text-[#1e4620]"
                      : "bg-[#fff8e1] border-[#ffe082] text-[#5d4037]"
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    {res.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#2e744a]" />
                        <span>সঠিক উত্তর! চমৎকার প্রস্তুতি।</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-[#c62828]" />
                        <span>উত্তরটি সঠিক হয়নি। ব্যাখ্যাটি মনোযোগ দিয়ে লক্ষ্য করুন।</span>
                      </>
                    )}
                  </p>
                  {res.explanation && (
                    <p className="text-[11px] leading-relaxed mt-0.5 text-[#454c59]">
                      ব্যাখ্যা: {res.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
