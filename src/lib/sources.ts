/**
 * Newspaper Source Identification & Academic Monograms for KhoboraKhobor
 * Uses the authentic brand color themes of individual publications directly in the letters,
 * paired with a clean tinted background and border.
 * 100% legally clean under fair-use and trademark law.
 */

export interface NewspaperSourceInfo {
  name: string;
  cleanName: string;
  monogram: string;
  textColor: string;      // Color theme of the individual newspaper applied to the letters
  bgColor: string;        // Harmonious tinted background
  borderColor: string;    // Subtle matched border
  fontClass?: string;     // Specialized typography (e.g. serif for Daily Star)
  logoUrl?: string;       // Legacy optional fallback
}

export function getNewspaperSourceInfo(
  imageCaption?: string | null,
  articleTitle?: string
): NewspaperSourceInfo {
  const text = `${imageCaption || ""} ${articleTitle || ""}`;
  const lower = text.toLowerCase();

  // 1. Prothom Alo (প্রথম আলো) - Iconic Crimson Red Letters "প"
  if (
    text.includes("প্রথম আলো") ||
    lower.includes("prothom alo") ||
    lower.includes("prothomalo")
  ) {
    return {
      name: "প্রথম আলো",
      cleanName: "প্রথম আলো",
      monogram: "প",
      textColor: "text-[#d1242a]",
      bgColor: "bg-[#fff1f2]",
      borderColor: "border-[#fecdd3]",
      fontClass: "font-bold text-sm",
    };
  }

  // 2. The Daily Star (ডেইলি স্টার) - Classic Navy Blue Serif Letters "DS"
  if (
    text.includes("ডেইলি স্টার") ||
    lower.includes("daily star") ||
    lower.includes("dailystar") ||
    lower.includes("daily-star")
  ) {
    return {
      name: text.includes("বাংলা") ? "ডেইলি স্টার বাংলা" : "The Daily Star",
      cleanName: "The Daily Star",
      monogram: "DS",
      textColor: "text-[#0a3060]",
      bgColor: "bg-[#f0f6ff]",
      borderColor: "border-[#bfdbfe]",
      fontClass: "font-serif font-black tracking-tighter text-xs sm:text-[13px]",
    };
  }

  // 3. BBC Bangla (বিবিসি বাংলা) - Pure BBC Scarlet Red Letters "BBC"
  if (
    text.includes("বিবিসি") ||
    lower.includes("bbc") ||
    lower.includes("bbc bangla")
  ) {
    return {
      name: "বিবিসি বাংলা",
      cleanName: "বিবিসি বাংলা",
      monogram: "BBC",
      textColor: "text-[#bb1919]",
      bgColor: "bg-[#fff1f2]",
      borderColor: "border-[#fecdd3]",
      fontClass: "font-sans font-black tracking-tighter text-[10px] sm:text-[11px]",
    };
  }

  // 4. The Business Standard (টিবিএস / TBS) - Forest Emerald Green Letters "TBS"
  if (
    text.includes("Business Standard") ||
    text.includes("বিজনেস স্ট্যান্ডার্ড") ||
    lower.includes("tbs") ||
    lower.includes("tbsnews")
  ) {
    return {
      name: "The Business Standard",
      cleanName: "The Business Standard",
      monogram: "TBS",
      textColor: "text-[#006a4e]",
      bgColor: "bg-[#f0fdf4]",
      borderColor: "border-[#bbf7d0]",
      fontClass: "font-sans font-black tracking-tighter text-[10px] sm:text-[11px]",
    };
  }

  // 5. BDNews24 (বিডিনিউজ ২৪) - Ruby Red Letters "বিডি"
  if (lower.includes("bdnews24") || text.includes("বিডিনিউজ")) {
    return {
      name: "বিডিনিউজ ২৪",
      cleanName: "বিডিনিউজ ২৪",
      monogram: "বিডি",
      textColor: "text-[#e11d48]",
      bgColor: "bg-[#fff1f2]",
      borderColor: "border-[#fecdd3]",
      fontClass: "font-bold text-xs",
    };
  }

  // 6. Dhaka Tribune (ঢাকা ট্রিবিউন) - Burnt Orange Letters "DT"
  if (lower.includes("dhaka tribune") || text.includes("ঢাকা ট্রিবিউন")) {
    return {
      name: "ঢাকা ট্রিবিউন",
      cleanName: "Dhaka Tribune",
      monogram: "DT",
      textColor: "text-[#ea580c]",
      bgColor: "bg-[#fff7ed]",
      borderColor: "border-[#fed7aa]",
      fontClass: "font-black tracking-tight text-xs",
    };
  }

  // 7. Samakal (সমকাল) - Deep Emerald Green Letter "স"
  if (text.includes("সমকাল") || lower.includes("samakal")) {
    return {
      name: "সমকাল",
      cleanName: "সমকাল",
      monogram: "স",
      textColor: "text-[#059669]",
      bgColor: "bg-[#ecfdf5]",
      borderColor: "border-[#a7f3d0]",
      fontClass: "font-bold text-sm",
    };
  }

  // 8. Jugantor (যুগান্তর) - Warm Amber Ochre Letter "য"
  if (text.includes("যুগান্তর") || lower.includes("jugantor")) {
    return {
      name: "যুগান্তর",
      cleanName: "যুগান্তর",
      monogram: "য",
      textColor: "text-[#d97706]",
      bgColor: "bg-[#fffbeb]",
      borderColor: "border-[#fde68a]",
      fontClass: "font-bold text-sm",
    };
  }

  // 9. Ittefaq (ইত্তেফাক) - Royal Blue Letter "ই"
  if (text.includes("ইত্তেফাক") || lower.includes("ittefaq")) {
    return {
      name: "ইত্তেফাক",
      cleanName: "ইত্তেফাক",
      monogram: "ই",
      textColor: "text-[#0284c7]",
      bgColor: "bg-[#f0f9ff]",
      borderColor: "border-[#bae6fd]",
      fontClass: "font-bold text-sm",
    };
  }

  // 10. Default Platform Fallback - KhoboraKhobor Burgundy Letter "খ"
  return {
    name: "খবরাখবর বিশেষ সংকলন",
    cleanName: "খবরাখবর ডেস্ক",
    monogram: "খ",
    textColor: "text-[#842323]",
    bgColor: "bg-[#fdf2f2]",
    borderColor: "border-[#f8d7d7]",
    fontClass: "font-serif font-black text-sm",
  };
}
