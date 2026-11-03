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

function extractParagraphs(htmlContent: string): string[] {
  if (!htmlContent) return [];

  const normalized = htmlContent
    .replace(/<\/p>|<\/div>|<\/h[1-6]>|<\/li>|<br\s*\/?>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");

  return normalized
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export default function InterlinearArticleBody({
  htmlContent,
  fontSize,
  onWordClick,
}: InterlinearArticleBodyProps) {
  // Parse HTML into clean text blocks (paragraphs)
  const paragraphs = useMemo(() => {
    return extractParagraphs(htmlContent);
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
