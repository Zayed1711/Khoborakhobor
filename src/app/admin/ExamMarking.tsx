"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Trophy } from "lucide-react";
import { adminMeritAction, listExamWritingsAction, markExamWritingAction } from "@/actions/exam-results";

type Notify = (type: "success" | "error" | "info", msg: string) => void;
type Writing = Awaited<ReturnType<typeof listExamWritingsAction>>[number];
type Merit = Awaited<ReturnType<typeof adminMeritAction>>;

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const fmtTime = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;

/** After the exam opens: mark the two writing tasks (out of 5) and watch the merit list. */
export default function ExamMarking({ examId, notify }: { examId: string; notify: Notify }) {
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<{ v: number; writings: Writing[]; merit: Merit } | null>(null);
  const [filter, setFilter] = useState<"pending" | "reviewed">("pending");
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    let live = true;
    Promise.all([listExamWritingsAction(examId), adminMeritAction(examId)])
      .then(([writings, merit]) => live && setData({ v: version, writings, merit }))
      .catch(() => live && setData({ v: version, writings: [], merit: [] }));
    return () => {
      live = false;
    };
  }, [examId, version]);

  if (!data) {
    return (
      <div className="flex justify-center py-8 text-[#8e9aa8]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  const pending = data.writings.filter((w) => w.status !== "reviewed");
  const shown = filter === "pending" ? pending : data.writings.filter((w) => w.status === "reviewed");

  return (
    <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-start">
      <section className="rounded-xl border border-[#212936] bg-[#141b24] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-white font-semibold">Writing marking</h3>
          {(["pending", "reviewed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${filter === f ? "bg-[#f5c66b] text-[#0b1017] border-[#f5c66b]" : "border-[#212936] text-[#8e9aa8]"}`}
            >
              {f === "pending" ? `To mark (${pending.length})` : `Marked (${data.writings.length - pending.length})`}
            </button>
          ))}
          <button onClick={reload} className="ml-auto p-1.5 rounded-lg border border-[#212936] text-[#8e9aa8] hover:text-white" aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-[#8e9aa8] py-6 text-center">{filter === "pending" ? "Nothing to mark." : "Nothing marked yet."}</p>
        ) : (
          shown.map((w) => (
            <MarkCard
              key={w.id + w.status}
              w={w}
              onSaved={() => {
                notify("success", "Marks saved. The merit list is updated.");
                reload();
              }}
              onError={(m) => notify("error", m)}
            />
          ))
        )}
      </section>

      <section className="rounded-xl border border-[#212936] bg-[#141b24] p-4 space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#f5c66b]" /> Merit list ({data.merit.length})
        </h3>
        {data.merit.length === 0 ? (
          <p className="text-sm text-[#8e9aa8]">No one has submitted yet.</p>
        ) : (
          <table className="w-full text-sm text-[#c8d0da]">
            <thead className="text-xs text-[#8e9aa8]">
              <tr>
                <th className="text-left py-1">#</th>
                <th className="text-left">Name</th>
                <th className="text-right">Total</th>
                <th className="text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.merit.slice(0, 50).map((m) => (
                <tr key={m.rank} className="border-t border-[#212936]">
                  <td className="py-1">{m.rank}</td>
                  <td className="text-white">{m.name}</td>
                  <td className="text-right">
                    {num(m.total)}
                    {m.writingPending && <span title="Writing not marked yet">*</span>}
                  </td>
                  <td className="text-right text-[#8e9aa8]">{fmtTime(m.timeTakenSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-[#8e9aa8]">* writing not marked yet. Students see this list after 12:00 pm.</p>
      </section>
    </div>
  );
}

function MarkCard({ w, onSaved, onError }: { w: Writing; onSaved: () => void; onError: (m: string) => void }) {
  const [marks, setMarks] = useState(w.marks !== null ? String(w.marks) : "");
  const [feedback, setFeedback] = useState(w.feedback || "");
  const [busy, setBusy] = useState(false);
  const steps = Array.from({ length: w.maxMarks * 2 + 1 }, (_, i) => i / 2);

  const save = async () => {
    if (marks === "" || busy) return;
    setBusy(true);
    const r = await markExamWritingAction(w.id, Number(marks), feedback);
    setBusy(false);
    if (r.ok) onSaved();
    else onError(r.message);
  };

  return (
    <div className="rounded-lg border border-[#212936] bg-[#0b1017] p-3 space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#8e9aa8]">
        <span className="text-white font-semibold">{w.studentName}</span>
        <span>· {w.task}</span>
        <span>· {w.wordCount} words</span>
        {w.status === "reviewed" && (
          <span className="ml-auto text-emerald-400 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {num(w.marks ?? 0)}/{w.maxMarks}
          </span>
        )}
      </div>
      <p className="text-[#c8d0da] italic">{w.prompt}</p>
      {w.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={w.imageUrl} alt="Chart for this task" className="max-h-48 rounded border border-[#212936] bg-white" />
      )}
      <p className="whitespace-pre-wrap leading-relaxed text-white bg-[#141b24] rounded-lg p-3 border border-[#212936]">{w.text}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs text-[#8e9aa8] flex items-center gap-2">
          Marks
          <select value={marks} onChange={(e) => setMarks(e.target.value)} className="rounded-lg bg-[#141b24] border border-[#212936] px-2 py-1 text-white">
            <option value="">—</option>
            {steps.map((s) => (
              <option key={s} value={s}>
                {s} / {w.maxMarks}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        placeholder="Feedback for the student (optional)"
        aria-label="Feedback"
        className="w-full rounded-lg bg-[#141b24] border border-[#212936] p-2 text-white outline-none focus:border-[#f5c66b]"
      />
      <div className="flex justify-end">
        <button onClick={save} disabled={marks === "" || busy} className="px-4 py-1.5 rounded-lg bg-[#f5c66b] text-[#0b1017] font-semibold disabled:opacity-50">
          {busy ? "Saving…" : w.status === "reviewed" ? "Update marks" : "Save marks"}
        </button>
      </div>
    </div>
  );
}
