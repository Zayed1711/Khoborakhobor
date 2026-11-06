"use client";

import { useEffect, useState } from "react";
import { Sun, BookOpen } from "lucide-react";

export type ReadingTheme = "parchment" | "sepia";

interface ThemeSwitcherProps {
  compact?: boolean;
  className?: string;
}

/** Apply the reading theme to the page (declared before use, so it is always defined). */
function applyTheme(newTheme: ReadingTheme) {
  if (typeof document === "undefined") return;
  if (newTheme === "parchment") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", newTheme);
  }
}

export default function ThemeSwitcher({ compact = false, className = "" }: ThemeSwitcherProps) {
  const [theme, setTheme] = useState<ReadingTheme>("parchment");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("khobor_theme") as ReadingTheme | null;
    if (saved === "sepia" || saved === "parchment") {
      setTheme(saved);
      applyTheme(saved);
    } else {
      applyTheme("parchment");
    }
  }, []);


  const handleSelect = (newTheme: ReadingTheme) => {
    setTheme(newTheme);
    localStorage.setItem("khobor_theme", newTheme);
    applyTheme(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`inline-flex items-center gap-1 opacity-70 ${className}`}>
        <span className="w-16 h-6 bg-black/5 rounded"></span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center bg-[#f3efe6] p-0.5 rounded-lg border border-[#ded8cb] h-8 ${className}`}>
        <button
          type="button"
          onClick={() => handleSelect("parchment")}
          title="প্যাচমেন্ট কাগজ থিম (সংবাদপত্র ফিল)"
          className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
            theme === "parchment"
              ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
              : "text-[#6b7280] hover:text-[#1c1d21]"
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-[#c29547]" />
          <span>প্যাচমেন্ট</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect("sepia")}
          title="সেপিয়া থিম (বইয়ের পাতার মৃদু উষ্ণতা)"
          className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
            theme === "sepia"
              ? "bg-[#faf4e6] text-[#332616] shadow-2xs font-bold border border-[#dfd1b8]"
              : "text-[#6b7280] hover:text-[#1c1d21]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#b38234]" />
          <span>সেপিয়া</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-[#525964] ${className}`}>
      <span className="text-xs font-medium text-[#737b88] hidden sm:inline">কাগজের আভা:</span>
      <div className="inline-flex bg-[#f3efe6] p-0.5 rounded-md border border-[#ded8cb]">
        <button
          type="button"
          onClick={() => handleSelect("parchment")}
          title="প্যাচমেন্ট (ডিফল্ট সংবাদপত্র প্রিন্ট ফিল)"
          className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
            theme === "parchment"
              ? "bg-[#ffffff] text-[#1c1d21] shadow-2xs font-bold"
              : "text-[#6b7280] hover:text-[#1c1d21]"
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-[#c29547]" />
          <span>প্যাচমেন্ট</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect("sepia")}
          title="সেপিয়া (বইয়ের পাতার মৃদু অ্যাম্বার আলো)"
          className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
            theme === "sepia"
              ? "bg-[#faf4e6] text-[#332616] shadow-2xs font-bold border border-[#dfd1b8]"
              : "text-[#6b7280] hover:text-[#1c1d21]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#b38234]" />
          <span>সেপিয়া</span>
        </button>
      </div>
    </div>
  );
}
