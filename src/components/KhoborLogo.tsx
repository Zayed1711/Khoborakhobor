"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppMode } from "@/context/LanguageContext";

export interface KhoborLogoProps {
  variant?: "horizontal" | "vertical" | "compact" | "icon" | "masthead";
  size?: "sm" | "md" | "lg" | "xl" | "responsive";
  theme?: "light" | "dark" | "auto";
  showTagline?: boolean;
  className?: string;
  href?: string | null;
  englishModeOverride?: boolean;
}

/**
 * KhoborLogo - The Official Brand Emblem & Masthead Component for KhoboraKhobor.
 * Features the signature embossed golden 'খ' emblem seal, broadsheet masthead, and authentic branding.
 */
export default function KhoborLogo({
  variant = "horizontal",
  size = "md",
  theme = "light",
  showTagline = true,
  className = "",
  href = "/",
  englishModeOverride,
}: KhoborLogoProps) {
  const { isEnglishMode: contextIsEnglish } = useAppMode();
  const isEnglishMode = englishModeOverride !== undefined ? englishModeOverride : contextIsEnglish;

  const isDark = theme === "dark";

  // Accent colors according to mode & theme
  const trackBgColor = isEnglishMode
    ? isDark ? "bg-blue-900/60 text-blue-200 border-blue-700" : "bg-blue-50 text-[#1e40af] border-blue-200"
    : isDark ? "bg-[#540f0f]/60 text-amber-200 border-amber-800/40" : "bg-[#f5ebeb] text-[#842323] border-[#ecd9d9]";

  const textColor = isDark ? "text-white" : "text-[#17191d]";

  // Render the official circular emblem seal with embossed golden star
  const renderEmblem = (emblemSizeClass: string) => (
    <div className={`relative shrink-0 select-none ${emblemSizeClass}`}>
      <Image
        src="/brand-emblem.png"
        alt="খবরাখবর প্রতীক"
        width={140}
        height={140}
        priority
        className="w-full h-full object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-[1.04]"
      />
    </div>
  );

  // 1. Content for ICON ONLY
  if (variant === "icon") {
    const iconSizeClasses = {
      sm: "w-7 h-7",
      md: "w-9 h-9",
      lg: "w-14 h-14",
      xl: "w-20 h-20",
      responsive: "w-8 h-8 sm:w-10 sm:h-10",
    }[size];

    const content = renderEmblem(iconSizeClasses);
    if (!href) return <div className={`inline-block ${className}`}>{content}</div>;
    return (
      <Link href={href} className={`inline-block group ${className}`} aria-label="খবরাখবর">
        {content}
      </Link>
    );
  }

  // 2. Content for COMPACT (Optimized for Mobile Top Navigation & Sticky App Bars)
  if (variant === "compact") {
    const content = (
      <div className={`inline-flex items-center gap-2 select-none group ${className}`}>
        {renderEmblem("w-8 h-8 sm:w-10 sm:h-10")}
        <div className="flex flex-col text-left justify-center">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-lg sm:text-2xl font-black font-serif tracking-tight leading-none whitespace-nowrap ${textColor}`}
              style={{ fontFamily: "var(--font-heading), 'Noto Serif Bengali', Georgia, serif" }}
            >
              খবরাখবর
            </span>
            {/* The language badge duplicates the header's mode toggle, so it is hidden on phones */}
            <span
              className={`hidden sm:inline text-xs font-bold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono border ${trackBgColor}`}
            >
              {isEnglishMode ? "EN" : "বাংলা"}
            </span>
          </div>
          {showTagline && (
            <span
              className="text-xs tracking-[0.16em] font-extrabold uppercase mt-0.5 text-[#842323]"
            >
              KHOBORAKHOBOR DIGITAL
            </span>
          )}
        </div>
      </div>
    );

    if (!href) return content;
    return (
      <Link href={href} className="inline-block group" aria-label="খবরাখবর — প্রচ্ছদ">
        {content}
      </Link>
    );
  }

  // 3. Content for MASTHEAD / VERTICAL (The Grand Centerpiece of Desktop Broadsheet)
  if (variant === "masthead" || variant === "vertical") {
    const mastheadHeight = {
      sm: "h-12 sm:h-14",
      md: "h-14 sm:h-16",
      lg: "h-18 sm:h-20",
      xl: "h-22 sm:h-24",
      responsive: "h-14 sm:h-16 lg:h-20",
    }[size];

    const content = (
      <div className={`flex flex-col items-center justify-center text-center select-none group py-0.5 ${className}`}>
        <Image
          src="/brand-logo.png"
          alt="খবরাখবর ডিজিটাল — KHOBORAKHOBOR DIGITAL"
          width={920}
          height={330}
          priority
          className={`${mastheadHeight} w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]`}
        />
      </div>
    );

    if (!href) return content;
    return (
      <Link href={href} className="inline-block group" aria-label="খবরাখবর — ডিজিটাল পত্রিকা">
        {content}
      </Link>
    );
  }

  // 4. Content for HORIZONTAL (Default: Used in Footer, Brand Headers & Auth Pages)
  if (isDark) {
    const content = (
      <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
        {renderEmblem("w-10 h-10 sm:w-11 sm:h-11")}
        <div className="flex flex-col text-left justify-center">
          <span
            className="text-2xl sm:text-3xl font-black font-serif tracking-tight leading-none text-white"
            style={{ fontFamily: "var(--font-heading), 'Noto Serif Bengali', Georgia, serif" }}
          >
            খবরাখবর
          </span>
          {showTagline && (
            <span className="text-xs tracking-[0.2em] font-extrabold uppercase mt-1 text-[#fde48b]">
              {isEnglishMode ? "ENGLISH LEARNING TRACK" : "KHOBORAKHOBOR DIGITAL"}
            </span>
          )}
        </div>
      </div>
    );

    if (!href) return content;
    return (
      <Link href={href} className="inline-block group" aria-label="খবরাখবর ডিজিটাল">
        {content}
      </Link>
    );
  }

  // Default Light: Authentic full brand logo banner
  const logoHeight = {
    sm: "h-9 sm:h-10",
    md: "h-11 sm:h-12",
    lg: "h-14 sm:h-16",
    xl: "h-18 sm:h-20",
    responsive: "h-10 sm:h-12 lg:h-14",
  }[size];

  const content = (
    <div className={`inline-flex items-center select-none group ${className}`}>
      <Image
        src="/brand-logo.png"
        alt="খবরাখবর ডিজিটাল — KHOBORAKHOBOR DIGITAL"
        width={920}
        height={330}
        priority
        className={`${logoHeight} w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]`}
      />
    </div>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-block group" aria-label="খবরাখবর ডিজিটাল">
      {content}
    </Link>
  );
}
