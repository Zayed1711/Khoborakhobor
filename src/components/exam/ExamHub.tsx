"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock, Loader2, AlertTriangle } from "lucide-react";
import { startExamAction, type ExamSummary, type Paper } from "@/actions/exam";
import { EXAM_MINUTES, NEGATIVE_MARK, SECTIONS, TOTAL_MARKS } from "@/lib/exam/rules";
import ExamRunner from "@/components/exam/ExamRunner";

const fmtDay = (day: string) =>
  new Date(day + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function useCountdown(targetIso: string, serverNowIso: string) {
  const [offset] = useState(() => new Date(serverNowIso).getTime() - Date.now());
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(t);
  }, [offset]);
  return Math.max(0, new Date(targetIso).getTime() - now);
}

function fmtLeft(ms: number) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d} day${d > 1 ? "s" : ""} ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min ${s % 60} s`;
}

/** The weekly exam page: what is coming, the start screen, the exam itself, and "submitted". */
export default function ExamHub({ initial }: { initial: ExamSummary | null }) {
  const [paper, setPaper] = useState<Paper | null>(null);
  const [done, setDone] = useState(initial?.myState === "submitted");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (paper && !done) return <ExamRunner paper={paper} onSubmitted={() => setDone(true)} />;

  const start = async () => {
    if (!initial || busy) return;
    setBusy(true);
    setError("");
    const r = await startExamAction(initial.id);
    setBusy(false);
    if (r.ok) setPaper(r.paper);
    else setError(r.message);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[#17191d] flex items-center gap-2">
          <CalendarClock className="w-7 h-7 text-[#842323]" /> Weekly Exam
        </h1>
        <p className="text-sm text-[#68707f] mt-1">সাপ্তাহিক পরীক্ষা · every Friday, 7:00 am – 12:00 pm</p>
      </div>

      {!initial ? (
        <Card>
          <p className="text-lg font-semibold text-[#17191d]">No exam this week.</p>
          <p className="text-sm text-[#525a68] mt-1">The next exam will appear here once it is published. Keep reading the daily key notes — the questions come from them.</p>
        </Card>
      ) : done ? (
        <Card>
          <p className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Your exam is submitted.
          </p>
          <p className="text-sm text-[#525a68] mt-1">
            Results, correct answers and the merit list appear after the exam closes at 12:00 pm. Writing marks are added once they are checked.
          </p>
        </Card>
      ) : (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#842323]">{fmtDay(initial.day)}</p>
          <h2 className="text-xl font-bold text-[#17191d] mt-1">{initial.title}</h2>
          <Rules />
          {initial.phase === "scheduled" && <Opens summary={initial} />}
          {initial.phase === "closed" && <p className="mt-4 text-sm text-[#525a68]">This exam has closed. Results will appear here.</p>}
          {initial.phase === "live" && (
            <div className="mt-5 space-y-3">
              {initial.myState === "guest" ? (
                <Link href="/login?redirect=/exam" className="inline-block px-5 py-2.5 rounded-lg bg-[#842323] text-white font-semibold">
                  Log in to sit the exam
                </Link>
              ) : (
                <>
                  {initial.myState === "none" && initial.minutesIfStartNow < EXAM_MINUTES && (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      The exam closes at 12:00 pm, so if you start now you will have only {initial.minutesIfStartNow} minutes.
                    </p>
                  )}
                  <button onClick={start} disabled={busy} className="px-5 py-2.5 rounded-lg bg-[#842323] text-white font-semibold disabled:opacity-60">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin inline" /> : initial.myState === "started" ? "Continue the exam" : "Start the exam"}
                  </button>
                  {initial.myState === "none" && <p className="text-xs text-[#68707f]">You get one attempt. The timer starts when you press Start and does not stop.</p>}
                </>
              )}
              {error && <p className="text-sm text-rose-700">{error}</p>}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[#ded8cb] bg-white p-6">{children}</div>;
}

function Rules() {
  return (
    <ul className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-[#404652]">
      <li className="flex gap-2">
        <Clock className="w-4 h-4 text-[#842323] mt-0.5" /> {EXAM_MINUTES} minutes · {TOTAL_MARKS} marks
      </li>
      <li>−{NEGATIVE_MARK} for each wrong objective answer; blank answers cost nothing</li>
      {SECTIONS.map((s) => (
        <li key={s.id} className="text-[#68707f]">
          {s.label} — {s.marks} marks
        </li>
      ))}
    </ul>
  );
}

function Opens({ summary }: { summary: ExamSummary }) {
  const left = useCountdown(summary.opensAt, summary.serverNow);
  return (
    <p className="mt-5 text-sm text-[#17191d]">
      Opens at 7:00 am — in <span className="font-semibold">{fmtLeft(left)}</span>.
    </p>
  );
}
