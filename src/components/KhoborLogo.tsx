"use client";

import Link from "next/link";
import Image from "next/image";

export interface KhoborLogoProps {
  variant?: "horizontal" | "vertical" | "compact" | "icon" | "masthead";
  size?: "sm" | "md" | "lg" | "xl" | "responsive";
  theme?: "light" | "dark" | "auto";
  showTagline?: boolean;
  className?: string;
  href?: string | null;
  /** Kept for existing callers; the logo is the same in both modes */
  englishModeOverride?: boolean;
}

/**
 * The KhoboraKhobor logo: the broadcast mark (maroon arcs, gold dot) with the
 * "খবরাখবর" wordmark and the "KHOBORAKHOBOR DIGITAL" tagline.
 *
 * Files (built from design/logo-source.png by scripts/make_logo.py):
 *   brand-logo.png          full logo, light backgrounds
 *   brand-logo-white.png    full logo, dark backgrounds
 *   brand-logo-compact.png  without the tagline, for small headers
 *   logo-mark.svg           the mark alone, as a vector
 */

// Source images are 650x148 (full) and 650x129 (compact)
const FULL = { w: 650, h: 148 };
const COMPACT = { w: 650, h: 129 };

const HEIGHT = {
  sm: "h-9 sm:h-10",
  md: "h-11 sm:h-12",
  lg: "h-14 sm:h-16",
  xl: "h-18 sm:h-20",
  responsive: "h-10 sm:h-12 lg:h-14",
} as const;

const MARK_SIZE = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
  responsive: "w-8 h-8 sm:w-10 sm:h-10",
} as const;

export default function KhoborLogo({
  variant = "horizontal",
  size = "md",
  theme = "light",
  showTagline = true,
  className = "",
  href = "/",
}: KhoborLogoProps) {
  const isDark = theme === "dark";

  let content: React.ReactNode;
  let label = "খবরাখবর ডিজিটাল — প্রচ্ছদ";

  if (variant === "icon") {
    // The mark alone (vector, sharp at any size)
    content = (
      // eslint-disable-next-line @next/next/no-img-element -- an SVG needs no image optimisation
      <img src="/logo-mark.svg" alt="খবরাখবর" className={`${MARK_SIZE[size]} object-contain select-none`} />
    );
    label = "খবরাখবর";
  } else if (variant === "compact" && !showTagline && !isDark) {
    // Small headers (phones): mark + wordmark; the tagline would be too small to read
    content = (
      <Image
        src="/brand-logo-compact.png"
        alt="খবরাখবর"
        width={COMPACT.w}
        height={COMPACT.h}
        priority
        className="h-8 sm:h-9 w-auto object-contain select-none"
      />
    );
  } else {
    content = (
      <Image
        src={isDark ? "/brand-logo-white.png" : "/brand-logo.png"}
        alt="খবরাখবর ডিজিটাল — KHOBORAKHOBOR DIGITAL"
        width={FULL.w}
        height={FULL.h}
        priority
        className={`${variant === "compact" ? "h-9 sm:h-10" : HEIGHT[size]} w-auto object-contain select-none transition-transform duration-300 group-hover:scale-[1.02]`}
      />
    );
  }

  if (!href) return <div className={`inline-flex items-center ${className}`}>{content}</div>;
  return (
    <Link href={href} className={`inline-flex items-center group ${className}`} aria-label={label}>
      {content}
    </Link>
  );
}
