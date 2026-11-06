"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { listWritingsForReviewAction, reviewWritingAction } from "@/actions/writing";

type Item = Awaited<ReturnType<typeof listWritingsForReviewAction>>["items"][number];

/** The admin reads each student's writing and leaves feedback (and an optional IELTS band). */
export default function WritingReviewTab({ showNotify }: { showNotify: (type: "success" | "error" | "info", msg: string) => void }) {
  const [status, setStatus] = useState<"pending" | "reviewed">("pending");
  const [reload, setReload] = useState(0);
  const key = `${status}:${reload}`;
  const [data, setData] = useState<{ key: string; items: Item[]; pending: number; failed: boolean } | null>(null);
  const loading = data?.key !== key;
  const items = data?.items ?? [];
  const pending = data?.pending ?? 0;
  const load = () => setReload((n) => n + 1);

  useEffect(() => {
    let live = true;
    listWritingsForReviewAction(status)
      .then((r) => live && setData({ key, items: r.items, pending: r.pending, failed: false }))
      .catch(() => live && setData({ key, items: [], pending: 0, failed: true }));
    return () => {
      live = false;
    };
  }, [key, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "reviewed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              status === s ? "bg-[#f5c66b] text-[#0b1017] border-[#f5c66b]" : "border-[#212936] text-[#8e9aa8] hover:text-white"
            }`}
          >
            {s === "pending" ? `Waiting for review (${pending})` : "Reviewed"}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-2 rounded-lg border border-[#212936] text-[#8e9aa8] hover:text-white" aria-label="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-[#8e9aa8]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : data?.failed ? (
        <p className="rounded-xl border border-rose-900 p-6 text-center text-sm text-rose-300">Could not load writings. Press refresh to try again.</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#212936] p-8 text-center text-sm text-[#8e9aa8]">
          {status === "pending" ? "No writing is waiting for review." : "Nothing reviewed yet."}
        </p>
      ) : (
        items.map((w) => (
          <ReviewCard
            key={w.id}
            w={w}
            onSaved={() => {
              showNotify("success", "Feedback saved. The student can see it now.");
              load();
            }}
            onError={(m) => showNotify("error", m)}
          />
        ))
      )}
    </div>
  );
}

function ReviewCard({ w, onSaved, onError }: { w: Item; onSaved: () => void; onError: (m: string) => void }) {
  const [feedback, setFeedback] = useState(w.feedback || "");
  const [band, setBand] = useState(w.band !== null ? String(w.band) : "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!feedback.trim() || busy) return;
    setBusy(true);
    const r = await reviewWritingAction(w.id, feedback, band === "" ? null : Number(band));
    setBusy(false);
    if (r.ok) onSaved();
    else onError(r.message);
  };

  return (
    <div className="rounded-xl border border-[#212936] bg-[#141b24] p-4 space-y-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8e9aa8]">
        <span>
          <span className="text-white font-semibold">{w.studentName}</span> · {new Date(w.createdAt).toLocaleString("en-GB")} · {w.wordCount} words ·{" "}
          {w.topic}
        </span>
        {w.status === "reviewed" && (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed{w.band !== null ? ` · Band ${w.band}` : ""}
          </span>
        )}
      </div>
      <a href={`/article/${encodeURIComponent(w.articleSlug)}`} target="_blank" rel="noreferrer" className="block font-semibold text-[#f5c66b] hover:underline">
        {w.articleTitle}
      </a>
      <p className="text-[#c8d0da] italic">{w.prompt}</p>
      <p className="whitespace-pre-wrap leading-relaxed text-white bg-[#0b1017] rounded-lg p-3 border border-[#212936]">{w.text}</p>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={4}
        placeholder="Feedback for the student: what is good, what to improve (grammar, ideas, use of the story)…"
        aria-label="Feedback"
        className="w-full rounded-lg bg-[#0b1017] border border-[#212936] p-3 text-white outline-none focus:border-[#f5c66b]"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-[#8e9aa8]">
          Band (optional)
          <select value={band} onChange={(e) => setBand(e.target.value)} className="rounded-lg bg-[#0b1017] border border-[#212936] px-2 py-1 text-white">
            <option value="">—</option>
            {Array.from({ length: 17 }, (_, i) => 1 + i * 0.5).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={save}
          disabled={!feedback.trim() || busy}
          className="ml-auto px-4 py-2 rounded-lg bg-[#f5c66b] text-[#0b1017] font-semibold disabled:opacity-50"
        >
          {busy ? "Saving…" : w.status === "reviewed" ? "Update feedback" : "Save feedback"}
        </button>
      </div>
    </div>
  );
}
