import Link from "next/link";
import { CalendarClock } from "lucide-react";
import type { ExamSummary } from "@/actions/exam";

/**
 * Homepage notice for the weekly exam: while it is live, and from the evening before
 * it opens. Nothing is shown at other times.
 */
export default function ExamBanner({ summary }: { summary: ExamSummary | null }) {
  if (!summary) return null;
  const now = new Date(summary.serverNow).getTime();
  const soon = summary.phase === "scheduled" && new Date(summary.opensAt).getTime() - now < 14 * 3600_000;
  if (summary.phase !== "live" && !soon) return null;
  const live = summary.phase === "live";
  const text = live
    ? summary.myState === "submitted"
      ? "You have submitted this week's exam. Results at 12:00 pm."
      : "সাপ্তাহিক পরীক্ষা চলছে — Weekly exam is live until 12:00 pm"
    : "সাপ্তাহিক পরীক্ষা আগামীকাল সকাল ৭টায় — Weekly exam opens tomorrow at 7:00 am";
  return (
    <Link
      href="/exam"
      className={`mb-3 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        live ? "border-[#842323] bg-[#842323] text-white hover:bg-[#6e1d1d]" : "border-[#ded8cb] bg-white text-[#17191d] hover:border-[#842323]"
      }`}
    >
      <CalendarClock className="w-5 h-5 shrink-0" />
      <span className="flex-1">{text}</span>
      <span className="text-xs underline underline-offset-2">{live && summary.myState !== "submitted" ? "Start" : "Details"}</span>
    </Link>
  );
}
