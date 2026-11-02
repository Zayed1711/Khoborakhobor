"use client";

import Link from "next/link";
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
 * Features the signature Bengali 'খ' broadsheet monogram with the golden fountain pen nib of truth.
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
  const trackColor = isEnglishMode
    ? isDark ? "#60a5fa" : "#1e40af"
    : isDark ? "#fde48b" : "#842323";

  const trackBgColor = isEnglishMode
    ? isDark ? "bg-blue-900/60 text-blue-200 border-blue-700" : "bg-blue-50 text-[#1e40af] border-blue-200"
    : isDark ? "bg-[#540f0f]/60 text-amber-200 border-amber-800/40" : "bg-[#f5ebeb] text-[#842323] border-[#ecd9d9]";

  const textColor = isDark ? "text-white" : "text-[#17191d]";
  const goldAccentColor = isDark ? "#d4af37" : "#c29547";

  // Render the core SVG emblem seal
  const renderEmblem = (emblemSizeClass: string, pixelSize = 80) => (
    <div className={`relative shrink-0 select-none ${emblemSizeClass}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-[1.03]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`kk-crimson-${pixelSize}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9e1c1c"/>
            <stop offset="45%" stopColor="#842323"/>
            <stop offset="100%" stopColor="#540f0f"/>
          </linearGradient>
          <linearGradient id={`kk-gold-${pixelSize}`} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fde48b"/>
            <stop offset="45%" stopColor="#d4af37"/>
            <stop offset="100%" stopColor="#9a6e1a"/>
          </linearGradient>
          <linearGradient id={`kk-ivory-${pixelSize}`} x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#f5eee4"/>
          </linearGradient>
        </defs>

        {/* Base Squircle */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          rx="22"
          fill={`url(#kk-crimson-${pixelSize})`}
          stroke={`url(#kk-gold-${pixelSize})`}
          strokeWidth="2.5"
        />

        {/* Inner Framing Line */}
        <rect
          x="9.5"
          y="9.5"
          width="81"
          height="81"
          rx="17"
          fill="none"
          stroke={`url(#kk-gold-${pixelSize})`}
          strokeOpacity="0.32"
          strokeWidth="0.9"
        />

        {/* Bengali 'খ' Monogram & Broadsheet Folds */}
        <path
          d="M 33 46 C 33 42 30 39 26 39 C 20 39 17 46 17 54 C 17 63 24 69 35 69 C 43 69 48 62 50 49"
          stroke={`url(#kk-ivory-${pixelSize})`}
          strokeWidth="4.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 50 49 C 52 61 58 69 68 69"
          stroke={`url(#kk-ivory-${pixelSize})`}
          strokeWidth="4.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 68 30 L 68 69"
          stroke={`url(#kk-ivory-${pixelSize})`}
          strokeWidth="4.8"
          strokeLinecap="round"
        />
        <path
          d="M 60 30 L 76 30"
          stroke={`url(#kk-ivory-${pixelSize})`}
          strokeWidth="3.8"
          strokeLinecap="round"
        />

        {/* Golden Fountain Pen Nib (Central Apex) */}
        <path
          d="M 50 20 L 56 31 L 53 43 L 47 43 L 44 31 Z"
          fill={`url(#kk-gold-${pixelSize})`}
          stroke="#540f0f"
          strokeWidth="0.8"
        />
        <line x1="50" y1="21" x2="50" y2="35" stroke="#540f0f" strokeWidth="0.9" />
        <circle cx="50" cy="35" r="1.1" fill="#540f0f" />

        {/* Golden Beacon Star of Truth */}
        <path
          d="M 80 18 Q 80 22 84 22 Q 80 22 80 26 Q 80 22 76 22 Q 80 22 80 18 Z"
          fill={`url(#kk-gold-${pixelSize})`}
        />
      </svg>
    </div>
  );

  // Content for ICON ONLY
  if (variant === "icon") {
    const iconSizeClasses = {
      sm: "w-7 h-7",
      md: "w-9 h-9",
      lg: "w-14 h-14",
      xl: "w-20 h-20",
      responsive: "w-8 h-8 sm:w-10 sm:h-10",
    }[size];

    const content = renderEmblem(iconSizeClasses, 64);
    if (!href) return <div className={`inline-block ${className}`}>{content}</div>;
    return (
      <Link href={href} className={`inline-block group ${className}`} aria-label="খবরাখবর">
        {content}
      </Link>
    );
  }

  // Content for COMPACT (Ideal for Mobile Navbar & Tiny Bars)
  if (variant === "compact") {
    const content = (
      <div className={`inline-flex items-center gap-2 select-none group ${className}`}>
        {renderEmblem("w-8 h-8 sm:w-9 sm:h-9", 36)}
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xl sm:text-2xl font-black font-serif tracking-tight leading-none ${textColor}`}
              style={{ fontFamily: "'Noto Serif Bengali', 'SolaimanLipi', Georgia, serif" }}
            >
              খবরাখবর
            </span>
            <span
              className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase font-mono border ${trackBgColor}`}
            >
              {isEnglishMode ? "EN" : "বাংলা"}
            </span>
          </div>
          {showTagline && (
            <span
              className="text-[8.5px] tracking-[0.2em] font-bold uppercase mt-0.5"
              style={{ color: trackColor }}
            >
              {isEnglishMode ? "English Learning Track" : "Digital Broadsheet"}
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

  // Content for VERTICAL / MASTHEAD (Ideal for Grand Center Desktop Masthead & Covers)
  if (variant === "vertical" || variant === "masthead") {
    const titleSize = {
      sm: "text-3xl",
      md: "text-4xl sm:text-5xl",
      lg: "text-5xl sm:text-6xl",
      xl: "text-6xl sm:text-7xl",
      responsive: "text-3xl sm:text-5xl lg:text-6xl",
    }[size];

    const content = (
      <div className={`flex flex-col items-center text-center select-none group ${className}`}>
        {/* Emblem on top */}
        {renderEmblem("w-12 h-12 sm:w-14 sm:h-14 mb-2.5", 56)}

        {/* Grand Masthead Bengali Typography */}
        <span
          className={`${titleSize} font-black tracking-tight leading-none font-serif ${textColor} group-hover:opacity-95 transition-opacity block`}
          style={{ fontFamily: "'Noto Serif Bengali', 'SolaimanLipi', Georgia, serif" }}
        >
          খবরাখবর
        </span>

        {/* Refined Subtitle Track */}
        {showTagline && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-[1px] w-8 sm:w-12 transition-colors" style={{ backgroundColor: `${goldAccentColor}55` }} />
            <span className="w-1.5 h-1.5 rotate-45 transition-colors" style={{ backgroundColor: trackColor }} />
            <span
              className="text-[10px] sm:text-[11px] tracking-[0.26em] font-extrabold uppercase"
              style={{ color: trackColor }}
            >
              {isEnglishMode ? "ENGLISH LEARNING TRACK" : "KHOBORAKHOBOR DIGITAL"}
            </span>
            <span className="w-1.5 h-1.5 rotate-45 transition-colors" style={{ backgroundColor: trackColor }} />
            <span className="h-[1px] w-8 sm:w-12 transition-colors" style={{ backgroundColor: `${goldAccentColor}55` }} />
          </div>
        )}
      </div>
    );

    if (!href) return content;
    return (
      <Link href={href} className="inline-block group" aria-label="খবরাখবর — ডিজিটাল পত্রিকা">
        {content}
      </Link>
    );
  }

  // Content for HORIZONTAL (Default: Emblem on left, Typography on right)
  const logoHeights = {
    sm: "h-9",
    md: "h-11 sm:h-12",
    lg: "h-14 sm:h-16",
    xl: "h-20",
    responsive: "h-10 sm:h-12 lg:h-14",
  }[size];

  const titleSizes = {
    sm: "text-xl",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl",
    xl: "text-4xl sm:text-5xl",
    responsive: "text-2xl sm:text-3xl lg:text-4xl",
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${logoHeights} ${className}`}>
      {renderEmblem("w-10 h-10 sm:w-12 sm:h-12", 48)}
      <div className="flex flex-col text-left justify-center">
        <span
          className={`${titleSizes} font-black font-serif tracking-tight leading-tight ${textColor}`}
          style={{ fontFamily: "'Noto Serif Bengali', 'SolaimanLipi', Georgia, serif" }}
        >
          খবরাখবর
        </span>
        {showTagline && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-[1px] w-4" style={{ backgroundColor: `${goldAccentColor}60` }} />
            <span
              className="text-[9px] sm:text-[10px] tracking-[0.2em] font-bold uppercase"
              style={{ color: trackColor }}
            >
              {isEnglishMode ? "ENGLISH LEARNING TRACK" : "KHOBORAKHOBOR DIGITAL"}
            </span>
            <span className="h-[1px] w-4" style={{ backgroundColor: `${goldAccentColor}60` }} />
          </div>
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
