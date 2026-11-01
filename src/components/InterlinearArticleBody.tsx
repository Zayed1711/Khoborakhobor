"use client";

import { useMemo } from "react";
import { getBanglaPronunciation } from "@/lib/phonetics/en-to-bn";

interface InterlinearArticleBodyProps {
  htmlContent: string;
  showPhonics: boolean;
  fontSize: "normal" | "large" | "xlarge";
  onWordClick?: (word: string) => void;
}

interface WordToken {
  original: string;
  cleanWord: string;
  phonetic: string;
  isPunctuationOnly: boolean;
}

export default function InterlinearArticleBody({
  htmlContent,
  showPhonics,
  fontSize,
  onWordClick,
}: InterlinearArticleBodyProps) {
  // Parse HTML into clean text blocks (paragraphs)
  const paragraphs = useMemo(() => {
    if (!htmlContent) return [];

    // Strip wrapping tags while extracting paragraphs
    const tempDiv = typeof document !== "undefined" ? document.createElement("div") : null;
    if (tempDiv) {
      tempDiv.innerHTML = htmlContent;
      const pElements = Array.from(tempDiv.querySelectorAll("p, h2, h3, blockquote, li"));
      if (pElements.length > 0) {
        return pElements
          .map((el) => el.textContent?.trim() || "")
          .filter((t) => t.length > 0);
      }
    }

    // Fallback: split by newlines or <p> tags
    return htmlContent
      .replace(/<[^>]+>/g, "\n")
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [htmlContent]);

  // Tokenize paragraph into words with Bangla phonetics
  const tokenizedParagraphs = useMemo(() => {
    return paragraphs.map((para) => {
      // Split by whitespace
      const rawTokens = para.split(/\s+/);
      return rawTokens.map((tok) => {
        const clean = tok.replace(/^[^\w]+|[^\w]+$/g, "");
        const phonetic = clean ? getBanglaPronunciation(clean) : "";

        return {
          original: tok,
          cleanWord: clean,
          phonetic,
          isPunctuationOnly: !clean,
        } as WordToken;
      });
    });
  }, [paragraphs]);

  const fontClass =
    fontSize === "xlarge"
      ? "text-2xl sm:text-3xl leading-[2.6]"
      : fontSize === "large"
      ? "text-xl sm:text-2xl leading-[2.4]"
      : "text-lg sm:text-xl leading-[2.2]";

  return (
    <div className={`space-y-7 ${fontClass} select-text font-serif`}>
      {tokenizedParagraphs.map((paraTokens, pIdx) => (
        <p key={pIdx} className="flex flex-wrap items-baseline gap-x-2 gap-y-3.5">
          {paraTokens.map((token, tIdx) => {
            if (token.isPunctuationOnly) {
              return (
                <span key={tIdx} className="text-[#334155] self-baseline">
                  {token.original}
                </span>
              );
            }

            return (
              <span
                key={tIdx}
                onClick={() => onWordClick && onWordClick(token.cleanWord)}
                className="inline-flex flex-col items-center group cursor-pointer hover:bg-blue-50/60 rounded px-1 -mx-0.5 transition-colors"
                title={`শুনুন ও অর্থ দেখুন: ${token.cleanWord}`}
              >
                {/* 1. Large Legible English Typography */}
                <span className="font-medium text-[#0f172a] group-hover:text-blue-800 transition-colors leading-snug">
                  {token.original}
                </span>

                {/* 2. Sublinear Bangla Phonics Guidance */}
                {showPhonics && token.phonetic && (
                  <span className="text-[10px] sm:text-[11px] font-sans font-medium text-amber-950 bg-amber-100/70 border border-amber-200/80 px-1 py-0.2 rounded leading-tight tracking-tight mt-0.5 select-none shadow-2xs">
                    {token.phonetic}
                  </span>
                )}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
