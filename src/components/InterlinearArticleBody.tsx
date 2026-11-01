"use client";

import { useMemo } from "react";

interface InterlinearArticleBodyProps {
  htmlContent: string;
  showPhonics?: boolean;
  fontSize: "normal" | "large" | "xlarge";
  onWordClick?: (word: string) => void;
}

interface WordToken {
  original: string;
  cleanWord: string;
  isPunctuationOnly: boolean;
}

export default function InterlinearArticleBody({
  htmlContent,
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

  // Tokenize paragraph into words
  const tokenizedParagraphs = useMemo(() => {
    return paragraphs.map((para) => {
      // Split by whitespace
      const rawTokens = para.split(/\s+/);
      return rawTokens.map((tok) => {
        const clean = tok.replace(/^[^\w]+|[^\w]+$/g, "");

        return {
          original: tok,
          cleanWord: clean,
          isPunctuationOnly: !clean,
        } as WordToken;
      });
    });
  }, [paragraphs]);

  const fontClass =
    fontSize === "xlarge"
      ? "text-xl sm:text-2xl leading-[2.1]"
      : fontSize === "large"
      ? "text-lg sm:text-xl leading-[1.95]"
      : "text-base sm:text-lg leading-[1.85]";

  const handleWordClick = (word: string) => {
    if (!word || !onWordClick) return;
    if (typeof window !== "undefined") {
      const selection = window.getSelection()?.toString().trim();
      // If user was drag-selecting a phrase for highlights, avoid triggering word speech
      if (selection && selection.length > word.length) {
        return;
      }
    }
    onWordClick(word);
  };

  return (
    <div className={`space-y-6 ${fontClass} select-text font-serif`}>
      {tokenizedParagraphs.map((paraTokens, pIdx) => (
        <p key={pIdx} className="leading-relaxed text-[#0f172a] select-text">
          {paraTokens.map((token, tIdx) => {
            if (token.isPunctuationOnly) {
              return (
                <span key={tIdx} className="text-[#334155]">
                  {token.original}{" "}
                </span>
              );
            }

            return (
              <span key={tIdx}>
                <span
                  onClick={() => handleWordClick(token.cleanWord)}
                  className="cursor-pointer hover:text-blue-800 hover:bg-blue-50/80 rounded px-1 -mx-0.5 transition-colors"
                  title={`ক্লিক করে উচ্চারণ শুনুন: ${token.cleanWord}`}
                >
                  {token.original}
                </span>
                {" "}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
