"use client";

import { useMemo } from "react";
import { History, Calendar, Check, RotateCcw } from "lucide-react";

interface DateArchiveStripProps {
  articles: any[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const BN_MONTHS = [
  "জানু", "ফেব", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"
];

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBnDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export default function DateArchiveStrip({
  articles,
  selectedDate,
  onSelectDate,
}: DateArchiveStripProps) {
  // Generate past 7 calendar days dynamically
  const past7Days = useMemo(() => {
    // Determine base date: either today or the latest article's date if present
    const now = new Date();
    const days: Array<{
      dateKey: string;
      label: string;
      subLabel: string;
      dayIndex: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const dayNumBn = toBnDigits(d.getDate());
      const monthBn = BN_MONTHS[d.getMonth()];

      let label = "";
      let subLabel = `${dayNumBn} ${monthBn}`;

      if (i === 0) {
        label = "আজ";
      } else if (i === 1) {
        label = "গতকাল";
      } else {
        label = `${dayNumBn} ${monthBn}`;
      }

      days.push({
        dateKey,
        label,
        subLabel,
        dayIndex: i,
      });
    }

    return days;
  }, []);

  // Compute counts for each day based on article createdAt
  const dateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) {
      const rawDate = a.createdAtIso || a.createdAt;
      if (rawDate) {
        const key = typeof rawDate === "string" 
          ? rawDate.split("T")[0] 
          : new Date(rawDate).toISOString().split("T")[0];
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return counts;
  }, [articles]);

  const allCount = articles.length;

  return (
    <div
      id="tutorial-date-archive"
      className="bg-white border border-[#ded8cb] rounded-2xl p-3 shadow-2xs space-y-2 transition-all"
    >
      {/* Top Header Label */}
      <div className="flex items-center justify-between pb-2 border-b border-[#f4efe4] px-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#1c1d21]">
          <History className="w-3.5 h-3.5 text-[#842323]" />
          <span>সংবাদ আর্কাইভ (বিগত ৭ দিন):</span>
          <span className="text-[10px] font-normal text-[#717887] hidden sm:inline">
            নির্দিষ্ট তারিখের সংবাদ ও বিশ্লেষণ
          </span>
        </div>

        {selectedDate !== "all" && (
          <button
            type="button"
            onClick={() => onSelectDate("all")}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#842323] hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>সব তারিখ দেখুন</span>
          </button>
        )}
      </div>

      {/* 7-Day Horizontal Pill Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {/* 'All Recent' Default Pill */}
        <button
          type="button"
          onClick={() => onSelectDate("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 flex items-center gap-1.5 ${
            selectedDate === "all"
              ? "bg-[#842323] text-white shadow-2xs font-bold border border-[#842323]"
              : "bg-[#faf8f4] hover:bg-[#ece7da] text-[#404652] border border-[#ded8cb]"
          }`}
          title="সকল তারিখের সাম্প্রতিক সংবাদ"
        >
          <span>সব খবর</span>
          <span className={`text-[10px] font-mono px-1 py-0.2 rounded-full ${
            selectedDate === "all" ? "bg-white/20 text-white" : "bg-[#ede8dc] text-[#525a68]"
          }`}>
            {toBnDigits(allCount)}
          </span>
        </button>

        {/* 7 Individual Days Pills */}
        {past7Days.map((day) => {
          const isSelected = selectedDate === day.dateKey;
          const count = dateCounts.get(day.dateKey) || 0;

          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => onSelectDate(day.dateKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#842323] text-white shadow-2xs font-bold border border-[#842323]"
                  : "bg-[#faf8f4] hover:bg-[#ece7da] text-[#404652] border border-[#ded8cb]"
              }`}
              title={`${day.dateKey} তারিখের সংবাদ`}
            >
              <span>{day.label}</span>
              <span className={`text-[10px] font-mono px-1 py-0.2 rounded-full ${
                isSelected
                  ? "bg-white/20 text-white"
                  : count > 0
                  ? "bg-[#ede8dc] text-[#525a68]"
                  : "bg-transparent text-[#a0a8b5]"
              }`}>
                {toBnDigits(count)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

