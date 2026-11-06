"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, BookOpenCheck, ExternalLink } from "lucide-react";
import { checkPracticeAnswerAction } from "@/actions/practice";
import type { PracticeForClient } from "@/lib/study/ielts-store";

type Result = { isCorrect: boolean; correctAnswer: string; sourceSentence: string };

/** "Question 3" or "Questions 3–4" */
const range = (from: number, to: number) => (from === to ? `Question ${from}` : `Questions ${from}–${to}`);

/**
 * IELTS-style reading practice for an English story: multiple choice and one-word
 * sentence completion, all from the story's summary and key points shown above.
 * Answers are checked on the server.
 */
export default function IeltsPractice({
  items,
  passage = [],
  sourceName,
  sourceUrl,
}: {
  items: PracticeForClient[];
  /** The passage the questions come from: the author's summary and key points shown on this page */
  passage?: string[];
  sourceName?: string | null;
  sourceUrl?: string | null;
}) {
  if (!items.length) return null;
  const mcqs = items.filter((i) => i.kind === "mcq");
  const blanks = items.filter((i) => i.kind === "blank");

  return (
    <section className="space-y-4" aria-label="IELTS Reading practice">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#17191d] flex items-center gap-2">
          <BookOpenCheck className="w-5 h-5 text-[#1e40af]" />
          IELTS Reading practice
        </h2>
        <p className="text-sm text-[#68707f] mt-0.5">Read the passage, then answer the questions. Every answer is in the passage.</p>
      </div>

      {passage.length > 0 && (
        <figure className="rounded-xl border border-[#d6dcea] bg-[#f6f8fc] p-4 space-y-3">
          <figcaption className="text-xs font-bold uppercase tracking-wide text-[#1e40af]">Reading passage</figcaption>
          <p className="text-[15px] leading-relaxed text-[#1c1d21]">{passage.join(" ")}</p>
          {sourceName && (
            <p className="text-xs text-[#68707f] flex flex-wrap items-center gap-x-2">
              <span>
                From the summary and key points of a report by <span className="font-semibold">{sourceName}</span>.
              </span>
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#1e40af] font-semibold hover:underline">
                  Read the full story <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </p>
          )}
        </figure>
      )}

      {mcqs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1e40af]">{range(1, mcqs.length)}: Choose the correct answer.</h3>
          {mcqs.map((q, i) => (q.kind === "mcq" ? <McqItem key={q.id} q={q} n={i + 1} /> : null))}
        </div>
      )}

      {blanks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1e40af]">
            {range(mcqs.length + 1, mcqs.length + blanks.length)}: Complete the {blanks.length > 1 ? "sentences" : "sentence"}. Write ONE WORD from the passage.
          </h3>
          {blanks.map((q, i) => (q.kind === "blank" ? <BlankItem key={q.id} q={q} n={mcqs.length + i + 1} /> : null))}
        </div>
      )}
    </section>
  );
}

function Feedback({ result }: { result: Result }) {
  return (
    <div
      className={`rounded-lg border p-3 text-sm leading-relaxed ${
        result.isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "border-rose-300 bg-rose-50 text-rose-950"
      }`}
    >
      <p className="font-semibold flex items-center gap-1.5">
        {result.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        {result.isCorrect ? "Correct." : `Not quite. The answer is: ${result.correctAnswer}`}
      </p>
      {result.sourceSentence && <p className="mt-1 text-[#404652]">From the passage: “{result.sourceSentence}”</p>}
    </div>
  );
}

function McqItem({ q, n }: { q: Extract<PracticeForClient, { kind: "mcq" }>; n: number }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    if (chosen === null || busy) return;
    setBusy(true);
    const r = await checkPracticeAnswerAction(q.id, chosen);
    if (r.ok) setResult({ isCorrect: r.isCorrect, correctAnswer: r.correctAnswer, sourceSentence: r.sourceSentence });
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-[#ded8cb] bg-white p-4 space-y-3">
      <p className="text-[15px] leading-relaxed text-[#1c1d21]">
        <span className="font-bold text-[#1e40af] mr-1.5">{n}.</span>
        {q.question}
      </p>
      <div className="grid gap-2">
        {q.options.map((opt, i) => {
          const isAnswer = result && opt === result.correctAnswer;
          const isWrongPick = result && i === chosen && !result.isCorrect;
          return (
            <button
              key={i}
              type="button"
              disabled={!!result}
              onClick={() => setChosen(i)}
              className={`text-left rounded-lg border px-3 py-2 text-sm leading-snug transition ${
                isAnswer
                  ? "border-emerald-500 bg-emerald-50 font-semibold"
                  : isWrongPick
                  ? "border-rose-400 bg-rose-50"
                  : chosen === i
                  ? "border-[#1e40af] bg-[#eef2fb]"
                  : "border-[#ded8cb] hover:bg-[#faf8f4]"
              }`}
            >
              <span className="font-semibold mr-1.5">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>
      {result ? (
        <Feedback result={result} />
      ) : (
        <button
          type="button"
          onClick={check}
          disabled={chosen === null || busy}
          className="px-4 py-2 rounded-lg bg-[#1e40af] text-white text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Checking…" : "Check answer"}
        </button>
      )}
    </div>
  );
}

function BlankItem({ q, n }: { q: Extract<PracticeForClient, { kind: "blank" }>; n: number }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const r = await checkPracticeAnswerAction(q.id, text.trim());
    if (r.ok) setResult({ isCorrect: r.isCorrect, correctAnswer: r.correctAnswer, sourceSentence: r.sourceSentence });
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-[#ded8cb] bg-white p-4 space-y-3">
      <p className="text-[15px] leading-relaxed text-[#1c1d21]">
        <span className="font-bold text-[#1e40af] mr-1.5">{n}.</span>
        {q.question}
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!!result}
          maxLength={40}
          placeholder="One word"
          aria-label={`Answer to question ${n}`}
          className="flex-1 min-w-0 rounded-lg border border-[#ded8cb] px-3 py-2 text-sm outline-none focus:border-[#1e40af]"
        />
        {!result && (
          <button type="submit" disabled={!text.trim() || busy} className="px-4 py-2 rounded-lg bg-[#1e40af] text-white text-sm font-semibold disabled:opacity-50">
            {busy ? "Checking…" : "Check"}
          </button>
        )}
      </form>
      {result && <Feedback result={result} />}
    </div>
  );
}
