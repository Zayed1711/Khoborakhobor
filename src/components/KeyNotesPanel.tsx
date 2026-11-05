"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NotebookPen, Copy, Check, Download, ChevronDown } from "lucide-react";
import { formatDay, notesToText, type KeyNoteDay } from "@/lib/study/key-notes";

interface KeyNotesPanelProps {
  days: KeyNoteDay[];
  /** Phones: starts collapsed so the ten stories stay at the top */
  collapsible?: boolean;
  className?: string;
}

const HEADING = "দৈনিক মূল নোট";

/**
 * One quoted point from each of the day's জরুরি ১০ stories, for active recall and
 * weekend revision. Students can copy a day or download the whole week.
 */
export default function KeyNotesPanel({ days, collapsible = false, className = "" }: KeyNotesPanelProps) {
  const withNotes = useMemo(() => days.filter((d) => d.items.length > 0), [days]);
  const [selected, setSelected] = useState(withNotes[0]?.day ?? "");
  const [open, setOpen] = useState(!collapsible);
  const [copied, setCopied] = useState(false);

  if (!withNotes.length) return null;
  const today = days[0]?.day;
  const yesterday = days[1]?.day;
  const label = (day: string) => (day === today ? "আজ" : day === yesterday ? "গতকাল" : formatDay(day).replace(/ ২০[০-৯]{2}$/, ""));
  const current = withNotes.find((d) => d.day === selected) ?? withNotes[0];

  const copyDay = async () => {
    try {
      await navigator.clipboard.writeText(notesToText([current], `${HEADING} (খবরাখবর)`));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadWeek = () => {
    // The byte-order mark makes Windows Notepad show Bengali correctly
    const text = "﻿" + notesToText(withNotes, `${HEADING}: গত ${withNotes.length.toLocaleString("bn-BD")} দিন (খবরাখবর)`);
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `khoborakhobor-notes-${today}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className={`bg-white border border-[#ded8cb] rounded-2xl shadow-2xs ${className}`} aria-label={HEADING}>
      <button
        type="button"
        onClick={() => collapsible && setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 p-4 ${collapsible ? "cursor-pointer" : "cursor-default"}`}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-left">
          <NotebookPen className="w-4 h-4 text-[#842323] shrink-0" />
          <span>
            <span className="block text-sm font-bold text-[#1c1d21]">{HEADING}</span>
            <span className="block text-xs text-[#717887]">জরুরি ১০ খবরের মূল তথ্য, প্রতিবেদন থেকে হুবহু</span>
          </span>
        </span>
        {collapsible && <ChevronDown className={`w-4 h-4 text-[#717887] transition ${open ? "rotate-180" : ""}`} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* Day chooser */}
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="দিন বেছে নিন">
            {withNotes.map((d) => (
              <button
                key={d.day}
                type="button"
                role="tab"
                aria-selected={d.day === current.day}
                onClick={() => setSelected(d.day)}
                className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap border transition ${
                  d.day === current.day
                    ? "bg-[#842323] text-white border-[#842323]"
                    : "bg-[#faf8f4] text-[#404652] border-[#ded8cb] hover:bg-[#f4efe4]"
                }`}
              >
                {label(d.day)}
              </button>
            ))}
          </div>

          <ol className="space-y-2.5">
            {current.items.map((n) => (
              <li key={n.slug} className="flex gap-2 text-sm leading-relaxed text-[#1c1d21]">
                <span className="text-[#842323] font-semibold shrink-0">{n.rank.toLocaleString("bn-BD")}.</span>
                <span className="min-w-0">
                  {n.point}
                  <Link
                    href={`/article/${encodeURIComponent(n.slug)}`}
                    className="text-xs text-[#68707f] hover:text-[#842323] hover:underline mt-0.5 line-clamp-1"
                  >
                    {n.title} · {n.sourceName.replace(/\s*\(.*\)\s*$/, "")}
                  </Link>
                </span>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap gap-2 pt-1 border-t border-[#f4efe4]">
            <button
              type="button"
              onClick={copyDay}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ded8cb] text-xs font-semibold text-[#404652] hover:bg-[#faf8f4]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "কপি হয়েছে" : `${label(current.day)}-এর নোট কপি`}
            </button>
            <button
              type="button"
              onClick={downloadWeek}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#842323] text-white text-xs font-semibold hover:bg-[#6e1c1c]"
            >
              <Download className="w-3.5 h-3.5" />
              {withNotes.length.toLocaleString("bn-BD")} দিনের নোট ডাউনলোড
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
