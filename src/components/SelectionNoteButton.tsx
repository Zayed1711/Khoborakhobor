"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { createStudyNoteAction } from "@/actions/student";

const MIN_CHARS = 3;
const MAX_CHARS = 2000;

interface Props {
  /** Only text selected inside this element can be saved */
  containerRef: RefObject<HTMLElement | null>;
  articleSlug: string;
  studentId: string | null;
  english: boolean;
  /** Called with the saved note, so the page can show it straight away */
  onSaved: (note: { id: string; quoteText: string; memo: string | null; createdAt: Date }) => void;
}

/**
 * Select any part of a story and a small "Save to notes" button appears next to it.
 * It saves exactly the selected text, nothing more. Text typed into boxes (answers,
 * writing) is not offered.
 */
export default function SelectionNoteButton({ containerRef, articleSlug, studentId, english, onSaved }: Props) {
  const [pick, setPick] = useState<{ text: string; top: number; left: number } | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const busy = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const read = () => {
      if (busy.current) return;
      const sel = window.getSelection();
      const container = containerRef.current;
      if (!sel || sel.isCollapsed || !sel.rangeCount || !container) return setPick(null);
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const el = node.nodeType === 1 ? (node as Element) : node.parentElement;
      if (!el || !container.contains(el) || el.closest("input, textarea, [contenteditable], [data-no-note]")) return setPick(null);
      const text = sel.toString().replace(/\s+\n/g, "\n").trim();
      if (text.length < MIN_CHARS) return setPick(null);
      const rect = range.getBoundingClientRect();
      const above = rect.top > 56;
      setPick({
        text: text.slice(0, MAX_CHARS),
        top: above ? rect.top - 46 : rect.bottom + 10,
        left: Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90),
      });
      setState("idle");
    };
    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(read, 180);
    };
    const hide = () => !busy.current && setPick(null);
    document.addEventListener("selectionchange", onChange);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("selectionchange", onChange);
      window.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
    };
  }, [containerRef]);

  if (!pick) return null;

  const save = async () => {
    if (!studentId) {
      window.dispatchEvent(new CustomEvent("khobor_open_auth_gate", { detail: { feature: "notebook" } }));
      return;
    }
    busy.current = true;
    setState("saving");
    try {
      const note = await createStudyNoteAction(studentId, articleSlug, pick.text);
      onSaved({ id: note.id, quoteText: note.quoteText, memo: note.memo, createdAt: new Date(note.createdAt) });
      setState("saved");
      window.getSelection()?.removeAllRanges();
      setTimeout(() => {
        busy.current = false;
        setPick(null);
        setState("idle");
      }, 1400);
    } catch {
      busy.current = false;
      setState("error");
    }
  };

  const label =
    state === "saving"
      ? english ? "Saving…" : "সংরক্ষণ হচ্ছে…"
      : state === "saved"
      ? english ? "Saved to notes" : "নোটে সংরক্ষিত"
      : state === "error"
      ? english ? "Could not save — try again" : "সংরক্ষণ হয়নি — আবার চেষ্টা করুন"
      : !studentId
      ? english ? "Log in to save to notes" : "নোটে রাখতে লগইন করুন"
      : english ? "Save to notes" : "নোটে সংরক্ষণ করুন";

  return (
    <button
      type="button"
      // Keep the selection when the button is pressed
      onMouseDown={(e) => e.preventDefault()}
      onClick={save}
      disabled={state === "saving" || state === "saved"}
      style={{ top: pick.top, left: pick.left }}
      className="no-print fixed z-50 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-[#17191d] text-white text-xs font-semibold px-3.5 py-2 shadow-lg hover:bg-[#842323] disabled:opacity-90"
      aria-live="polite"
    >
      {state === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : state === "saved" ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
      {label}
      {state === "idle" && <span className="font-normal opacity-70">· {pick.text.split(/\s+/).length} {english ? "words" : "শব্দ"}</span>}
    </button>
  );
}
