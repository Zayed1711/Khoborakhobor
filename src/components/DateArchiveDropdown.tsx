"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, RotateCcw } from "lucide-react";

interface DateArchiveDropdownProps {
  articles: any[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isEnglishMode?: boolean;
}

const BN_MONTHS = [
  "জানু", "ফেব", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"
];

const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBnDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export default function DateArchiveDropdown({
  articles,
  selectedDate,
  onSelectDate,
  isEnglishMode = false,
}: DateArchiveDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate past 7 calendar days dynamically
  const past7Days = useMemo(() => {
    const now = new Date();
    const days: Array<{
      dateKey: string;
      labelBn: string;
      labelEn: string;
      subLabelBn: string;
      subLabelEn: string;
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
      const monthEn = EN_MONTHS[d.getMonth()];
      const dayNumEn = d.getDate();

      let labelBn = "";
      let labelEn = "";
      if (i === 0) {
        labelBn = "আজ";
        labelEn = "Today";
      } else if (i === 1) {
        labelBn = "গতকাল";
        labelEn = "Yesterday";
      } else {
        labelBn = `${dayNumBn} ${monthBn}`;
        labelEn = `${dayNumEn} ${monthEn}`;
      }

      days.push({
        dateKey,
        labelBn,
        labelEn,
        subLabelBn: `${dayNumBn} ${monthBn}`,
        subLabelEn: `${dayNumEn} ${monthEn}`,
        dayIndex: i,
      });
    }

    return days;
  }, []);

  // Compute article counts per calendar date
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

  // Active label for dropdown button
  const currentSelectionLabel = useMemo(() => {
    if (selectedDate === "all") {
      return isEnglishMode
        ? `All Dates (Past 7 Days - ${allCount})`
        : `সব তারিখ (বিগত ৭ দিন - ${toBnDigits(allCount)})`;
    }
    const matched = past7Days.find((d) => d.dateKey === selectedDate);
    if (!matched) {
      return isEnglishMode ? "Select Date" : "তারিখ নির্বাচন করুন";
    }
    const count = dateCounts.get(selectedDate) || 0;
    return isEnglishMode
      ? `${matched.labelEn} (${matched.subLabelEn}) - ${count}`
      : `${matched.labelBn} (${matched.subLabelBn}) - ${toBnDigits(count)}টি`;
  }, [selectedDate, past7Days, dateCounts, allCount, isEnglishMode]);

  return (
    <div
      id="tutorial-date-archive"
      className="bg-white border border-[#ded8cb] rounded-2xl p-2.5 sm:p-3 shadow-2xs transition-all flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
    >
      {/* Left: Section Header & Descriptive Subtext */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-[#faf8f4] border border-[#ded8cb] flex items-center justify-center text-[#842323] shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1c1d21]">
              {isEnglishMode ? "Date Archive" : "সংবাদ আর্কাইভ"}
            </span>
            <span className="text-[10px] font-semibold text-[#842323] bg-[#fbf5f5] px-1.5 py-0.2 rounded border border-[#f2dede]">
              {isEnglishMode ? "Past 7 Days" : "বিগত ৭ দিন"}
            </span>
          </div>
          <span className="text-[11px] text-[#717887] hidden sm:block truncate">
            {isEnglishMode
              ? "Filter editorial feed by specific publication date"
              : "নির্দিষ্ট তারিখের সংবাদ ও বিষয়ভিত্তিক সম্পাদকীয় ফিল্টার করুন"}
          </span>
        </div>
      </div>

      {/* Right: Dropdown Menu & Quick Reset */}
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end" ref={dropdownRef}>
        {selectedDate !== "all" && (
          <button
            type="button"
            onClick={() => onSelectDate("all")}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#842323] hover:underline px-2 py-1 bg-[#fbf5f5] rounded-lg border border-[#f2dede] transition"
            title={isEnglishMode ? "Reset to all dates" : "সব তারিখের সংবাদে ফিরে যান"}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isEnglishMode ? "Reset" : "রিসেট"}</span>
          </button>
        )}

        <div className="relative w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full sm:w-auto inline-flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl border border-[#ded8cb] bg-[#fbf9f5] hover:bg-[#f4efe4] text-xs font-semibold text-[#1c1d21] transition shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#842323]/50 cursor-pointer min-w-[200px]"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Calendar className="w-3.5 h-3.5 text-[#842323] shrink-0" />
              <span className="truncate">{currentSelectionLabel}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#717887] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Floating Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-full sm:w-72 bg-white border border-[#ded8cb] rounded-xl shadow-lg p-1.5 z-40 space-y-1 animate-fade-in">
              {/* Option: All Dates */}
              <button
                type="button"
                onClick={() => {
                  onSelectDate("all");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                  selectedDate === "all"
                    ? "bg-[#842323] text-white font-bold"
                    : "hover:bg-[#faf8f4] text-[#2d323c]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {selectedDate === "all" && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{isEnglishMode ? "All News (Past 7 Days)" : "সব সংবাদ (বিগত ৭ দিন)"}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  selectedDate === "all" ? "bg-white/20 text-white" : "bg-[#f4efe4] text-[#842323] font-bold"
                }`}>
                  {isEnglishMode ? allCount : toBnDigits(allCount)}
                </span>
              </button>

              <div className="border-t border-[#f0ebdf] my-1" />

              {/* Past 7 Individual Calendar Days */}
              {past7Days.map((d) => {
                const isSelected = selectedDate === d.dateKey;
                const count = dateCounts.get(d.dateKey) || 0;

                return (
                  <button
                    key={d.dateKey}
                    type="button"
                    onClick={() => {
                      onSelectDate(d.dateKey);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                      isSelected
                        ? "bg-[#842323] text-white font-bold"
                        : "hover:bg-[#faf8f4] text-[#2d323c]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <span className="w-3.5" />
                      )}
                      <span>{isEnglishMode ? d.labelEn : d.labelBn}</span>
                      <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-[#717887]"}`}>
                        ({isEnglishMode ? d.subLabelEn : d.subLabelBn})
                      </span>
                    </div>

                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : count > 0
                        ? "bg-[#f4efe4] text-[#842323] font-bold"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {isEnglishMode ? count : toBnDigits(count)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
