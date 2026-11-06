"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { saveExamAnswerAction, submitExamAction, type Paper, type PaperQuestion } from "@/actions/exam";
import { TFNG } from "@/lib/exam/rules";
import { wordCount } from "@/lib/study/writing-prompts";

type SaveState = "saved" | "saving" | "error";

/** The exam itself: timer, questions, answers saved as the student goes, and hand-in. */
export default function ExamRunner({ paper, onSubmitted }: { paper: Paper; onSubmitted: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>(paper.answers);
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Server clock, so a wrong phone clock cannot add time
  const [offset] = useState(() => new Date(paper.serverNow).getTime() - Date.now());
  const deadline = new Date(paper.deadline).getTime();
  const [left, setLeft] = useState(() => Math.max(0, deadline - (Date.now() + offset)));

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<string, Promise<unknown>>>({});
  const submitted = useRef(false);

  const save = useCallback(
    (qid: string, value: string) => {
      setSaveState((s) => ({ ...s, [qid]: "saving" }));
      const p = saveExamAnswerAction(paper.examId, qid, value)
        .then((r) => setSaveState((s) => ({ ...s, [qid]: r.ok ? "saved" : "error" })))
        .catch(() => setSaveState((s) => ({ ...s, [qid]: "error" })));
      pending.current[qid] = p;
      return p;
    },
    [paper.examId]
  );

  const answer = (qid: string, value: string, delay = 0) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    clearTimeout(timers.current[qid]);
    if (delay) {
      setSaveState((s) => ({ ...s, [qid]: "saving" }));
      timers.current[qid] = setTimeout(() => save(qid, value), delay);
    } else save(qid, value);
  };

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const handIn = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    // Send any typing that is still waiting, then hand in
    const waiting = Object.entries(timers.current);
    for (const [, t] of waiting) clearTimeout(t);
    await Promise.all([
      ...Object.values(pending.current),
      ...waiting.map(([qid]) => save(qid, answersRef.current[qid] ?? "")),
    ]).catch(() => {});
    const r = await submitExamAction(paper.examId).catch(() => ({ ok: false as const, message: "Could not reach the server." }));
    if (r.ok) onSubmitted();
    else {
      submitted.current = false;
      setSubmitting(false);
      setError(r.message + " Please try again.");
    }
  }, [paper.examId, onSubmitted, save]);

  // Timer; hand in automatically when it reaches zero
  useEffect(() => {
    const t = setInterval(() => {
      const ms = Math.max(0, deadline - (Date.now() + offset));
      setLeft(ms);
      if (ms <= 0) handIn();
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, offset, handIn]);

  // Warn before leaving the page during the exam
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!submitted.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const all = paper.sections.flatMap((s) => s.questions);
  const answered = all.filter((q) => (answers[q.id] || "").trim()).length;
  const states = Object.values(saveState);
  const status = states.includes("error") ? "error" : states.includes("saving") ? "saving" : "saved";
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  const number = Object.fromEntries(all.map((q, i) => [q.id, i + 1]));

  return (
    <div className="space-y-6">
      {/* Sticky bar */}
      <div className="sticky top-[60px] z-30 -mx-4 sm:mx-0 px-4 py-3 bg-white/95 backdrop-blur border-b sm:border sm:rounded-xl border-[#ded8cb] flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className={`font-mono text-lg font-bold flex items-center gap-1.5 ${left < 5 * 60000 ? "text-rose-700" : "text-[#17191d]"}`} aria-live="polite">
          <Clock className="w-5 h-5" />
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
        <span className="text-sm text-[#525a68]">
          {answered}/{all.length} answered
        </span>
        <span className={`text-xs ${status === "error" ? "text-rose-700" : "text-[#68707f]"}`}>
          {status === "saving" ? "Saving…" : status === "error" ? "Some answers are not saved — check your connection" : "All answers saved"}
        </span>
        <button onClick={() => setConfirming(true)} disabled={submitting} className="ml-auto px-4 py-2 rounded-lg bg-[#842323] text-white text-sm font-semibold disabled:opacity-60">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
        </button>
        <nav className="w-full flex gap-2 overflow-x-auto text-xs" aria-label="Sections">
          {paper.sections.map((s) => (
            <a key={s.id} href={`#sec-${s.id}`} className="shrink-0 px-2.5 py-1 rounded-full border border-[#ded8cb] text-[#404652] hover:border-[#842323]">
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {paper.sections.map((s) => (
        <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-48 space-y-3">
          <h2 className="font-serif text-xl font-bold text-[#17191d]">
            {s.label} <span className="text-sm font-normal text-[#68707f]">· {s.marks} marks</span>
          </h2>
          {s.passage && (
            <div className="rounded-xl border border-[#ded8cb] bg-[#faf8f4] p-4 text-[15px] leading-relaxed text-[#1c1d21] whitespace-pre-wrap">{s.passage}</div>
          )}
          {s.questions.map((q) => (
            <QuestionBlock key={q.id} q={q} n={number[q.id]} value={answers[q.id] || ""} state={saveState[q.id]} onAnswer={answer} disabled={submitting} />
          ))}
        </section>
      ))}

      <div className="flex justify-end">
        <button onClick={() => setConfirming(true)} disabled={submitting} className="px-5 py-2.5 rounded-lg bg-[#842323] text-white font-semibold disabled:opacity-60">
          Submit the exam
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Submit the exam">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <p className="text-lg font-semibold text-[#17191d]">Submit the exam?</p>
            <p className="text-sm text-[#525a68]">
              You have answered {answered} of {all.length}.{" "}
              {answered < all.length ? "Unanswered questions get no marks (and no negative marks)." : ""} You cannot change your answers after this.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirming(false)} className="px-4 py-2 rounded-lg border border-[#ded8cb] text-sm">
                Keep working
              </button>
              <button
                onClick={() => {
                  setConfirming(false);
                  handIn();
                }}
                className="px-4 py-2 rounded-lg bg-[#842323] text-white text-sm font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionBlock({
  q,
  n,
  value,
  state,
  onAnswer,
  disabled,
}: {
  q: PaperQuestion;
  n: number;
  value: string;
  state?: SaveState;
  onAnswer: (qid: string, value: string, delay?: number) => void;
  disabled: boolean;
}) {
  const choice = (v: string, label: string, i?: number) => (
    <button
      key={v}
      type="button"
      disabled={disabled}
      onClick={() => onAnswer(q.id, value === v ? "" : v)}
      aria-pressed={value === v}
      className={`text-left rounded-lg border px-3 py-2 text-sm transition ${value === v ? "border-[#842323] bg-[#f5ebeb] font-semibold" : "border-[#ded8cb] hover:bg-[#faf8f4]"}`}
    >
      {i !== undefined && <span className="font-semibold mr-1.5">{String.fromCharCode(65 + i)}</span>}
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border border-[#ded8cb] bg-white p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="font-bold text-[#842323]">{n}.</span>
        <p className="flex-1 text-[15px] leading-relaxed text-[#1c1d21] whitespace-pre-wrap">{q.question}</p>
        {state === "saved" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Saved" />}
        {state === "error" && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" aria-label="Not saved" />}
      </div>
      {q.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={q.imageUrl} alt="Chart for this task" className="max-h-80 rounded-lg border border-[#ded8cb]" />
      )}
      {q.kind === "mcq" && <div className="grid gap-2">{q.options.map((o, i) => choice(String(i), o, i))}</div>}
      {q.kind === "tfng" && <div className="flex flex-wrap gap-2">{TFNG.map((t) => choice(t, t))}</div>}
      {q.kind === "blank" && (
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => onAnswer(q.id, e.target.value, 700)}
          maxLength={60}
          placeholder="Your answer"
          aria-label={`Answer to question ${n}`}
          className="w-full sm:w-72 rounded-lg border border-[#ded8cb] px-3 py-2 text-sm outline-none focus:border-[#842323]"
        />
      )}
      {q.kind === "writing" && (
        <div className="space-y-1">
          <textarea
            value={value}
            disabled={disabled}
            onChange={(e) => onAnswer(q.id, e.target.value, 1200)}
            rows={9}
            maxLength={6000}
            aria-label={`Your answer to question ${n}`}
            className="w-full rounded-lg border border-[#ded8cb] px-3 py-2 text-[15px] leading-relaxed outline-none focus:border-[#842323] resize-y"
          />
          <p className="text-xs text-[#68707f]">
            {wordCount(value)} words · {q.marks} marks, checked by hand
          </p>
        </div>
      )}
    </div>
  );
}
