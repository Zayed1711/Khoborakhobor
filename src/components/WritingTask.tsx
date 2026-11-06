"use client";

import { useState } from "react";
import Link from "next/link";
import { PenLine, Clock, CheckCircle2 } from "lucide-react";
import { submitWritingAction, type WritingView } from "@/actions/writing";
import { WRITING_MAX_WORDS, WRITING_MIN_WORDS, wordCount } from "@/lib/study/writing-prompts";

interface Props {
  articleSlug: string;
  topic: string;
  prompt: string;
  loggedIn: boolean;
  /** This student's earlier writings on this story, newest first */
  previous: WritingView[];
}

/**
 * IELTS Writing Task 2 style short writing at the end of an English story.
 * The student argues a view in 4–5 sentences, using the story as evidence.
 * Submissions are reviewed by hand by the admin; feedback appears here and in the notebook.
 */
export default function WritingTask({ articleSlug, topic, prompt, loggedIn, previous }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mine, setMine] = useState<WritingView[]>(previous);
  const words = wordCount(text);
  const inRange = words >= WRITING_MIN_WORDS && words <= WRITING_MAX_WORDS;

  const submit = async () => {
    if (!inRange || busy) return;
    setBusy(true);
    setError("");
    const r = await submitWritingAction(articleSlug, text);
    if (r.ok) {
      setMine((m) => [r.writing, ...m]);
      setText("");
    } else setError(r.message);
    setBusy(false);
  };

  return (
    <section className="space-y-4" aria-label="Writing practice">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#17191d] flex items-center gap-2">
          <PenLine className="w-5 h-5 text-[#1e40af]" />
          Writing practice
        </h2>
        <p className="text-sm text-[#68707f] mt-0.5">IELTS Writing Task 2 style · Topic: {topic}</p>
      </div>

      <div className="rounded-xl border border-[#ded8cb] bg-white p-4 space-y-3">
        <p className="text-[15px] leading-relaxed text-[#1c1d21] font-medium">{prompt}</p>
        <p className="text-sm text-[#525a68] leading-relaxed">
          Write a short answer of 4–5 sentences ({WRITING_MIN_WORDS}–{WRITING_MAX_WORDS} words). State your opinion clearly, give a reason,
          and use a fact from this story as an example.
        </p>

        {loggedIn ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              maxLength={4000}
              aria-label="Your answer"
              placeholder="In my opinion, …"
              className="w-full rounded-lg border border-[#ded8cb] px-3 py-2 text-[15px] leading-relaxed outline-none focus:border-[#1e40af] resize-y"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-sm ${words === 0 || inRange ? "text-[#68707f]" : "text-rose-700"}`}>
                {words} {words === 1 ? "word" : "words"}
              </span>
              <button
                type="button"
                onClick={submit}
                disabled={!inRange || busy}
                className="px-4 py-2 rounded-lg bg-[#1e40af] text-white text-sm font-semibold disabled:opacity-50"
              >
                {busy ? "Submitting…" : "Submit for review"}
              </button>
            </div>
            {error && <p className="text-sm text-rose-700">{error}</p>}
          </>
        ) : (
          <p className="text-sm text-[#68707f]">
            <Link href={`/login?redirect=/article/${encodeURIComponent(articleSlug)}`} className="text-[#1e40af] font-semibold hover:underline">
              Log in
            </Link>{" "}
            to submit your writing and get feedback.
          </p>
        )}
      </div>

      {mine.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#1e40af]">Your submissions</h3>
          {mine.map((w) => (
            <WritingCard key={w.id} w={w} />
          ))}
        </div>
      )}
    </section>
  );
}

export function WritingCard({ w, showStory = false }: { w: WritingView; showStory?: boolean }) {
  const reviewed = w.status === "reviewed";
  return (
    <div className="rounded-xl border border-[#ded8cb] bg-white p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-[#68707f]">
          {new Date(w.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {w.wordCount} words
        </span>
        {reviewed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed{w.band !== null ? ` · Band ${w.band}` : ""}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 font-semibold">
            <Clock className="w-3.5 h-3.5" /> Waiting for review
          </span>
        )}
      </div>
      {showStory && (
        <Link href={`/article/${encodeURIComponent(w.articleSlug)}`} className="block text-sm font-semibold text-[#17191d] hover:text-[#1e40af]">
          {w.articleTitle}
        </Link>
      )}
      {showStory && <p className="text-sm text-[#525a68] italic">{w.prompt}</p>}
      <p className="text-[15px] leading-relaxed text-[#1c1d21] whitespace-pre-wrap">{w.text}</p>
      {reviewed && w.feedback && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm leading-relaxed text-emerald-950">
          <p className="font-semibold mb-1">Feedback</p>
          <p className="whitespace-pre-wrap">{w.feedback}</p>
        </div>
      )}
    </div>
  );
}
