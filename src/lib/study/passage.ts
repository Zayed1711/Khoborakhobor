/**
 * The reading passage for an English story: one continuous part of the original
 * article (its opening), 80–150 words, cut at whole sentences. The practice questions
 * are built only from these sentences, so a student never needs the full article.
 *
 * Cleaning: repeated sentences are dropped (some sites repeat their lead as one
 * run-together paragraph), missing spaces after full stops are restored, and
 * publisher chrome, bylines and quotes with no speaker are left out.
 */
// Relative import, so the server scripts (scripts/backfill_passages.js) can load this file too
import { htmlToParagraphs, isBoilerplate } from "./extractive";

export const PASSAGE_MIN_WORDS = 80;
export const PASSAGE_MAX_WORDS = 150;

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

// "Md. Nurul", "Dr. Yunus": a full stop that does not end the sentence
const ABBREV = /\b(Md|Mr|Mrs|Ms|Dr|Prof|St|Lt|Col|Gen|Maj|Capt|Sgt|No|Nos|vs|Jr|Sr|Mt|Govt|Dept|Inc|Ltd|Co|approx|e\.g|i\.e)\.\s/g;

/** Split a paragraph into sentences, keeping abbreviations and decimals together. */
export function sentencesOf(paragraph: string): string[] {
  const text = paragraph
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "") // invisible characters some sites add
    .replace(/\s+/g, " ")
    // "night.Shafiqul" -> "night. Shafiqul" (but not "U.S." or "3.5")
    .replace(/([a-z0-9)”’"])\.([A-Z][a-z])/g, "$1. $2")
    .replace(ABBREV, (m) => m.replace(". ", "§ "))
    .trim();
  return text
    .split(/(?<=[.!?][”’"]?)\s+(?=[A-Z“‘"(\d])/)
    .map((s) => s.replace(/§/g, ".").trim())
    .filter(Boolean);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** A sentence a student cannot use on its own. */
function unusable(s: string): boolean {
  if (words(s) < 5 || s.length > 400) return true;
  if (/[ঀ-৿]/.test(s)) return true;
  if (isBoilerplate(s)) return true;
  if (/(https?:\/\/|www\.|@\w)/i.test(s)) return true;
  if (/^(by|reporter|staff correspondent|correspondent|photo|file photo|read more|also read|related|click|follow us|subscribe|source)\b/i.test(s)) return true;
  if (/(\.\.\.|…)$/.test(s)) return true; // cut off
  if (s === s.toUpperCase() && /[A-Z]{4}/.test(s)) return true; // headline in capitals
  // A quote must be complete and say who is speaking
  const quotes = (s.match(/[“”"]/g) || []).length;
  if (quotes % 2 === 1) return true;
  if (/^[“"‘]/.test(s) && !/\b(said|says|told|added|asked|stated|according to|wrote|tweeted|posted)\b/i.test(s)) return true;
  return false;
}

/**
 * The passage: whole sentences from the start of the article until it has at least
 * PASSAGE_MIN_WORDS, never going over PASSAGE_MAX_WORDS. Returned as paragraphs (each a
 * list of sentences), so it reads like the original. Empty when the article text is
 * missing or too short.
 */
export function extractPassage(contentHtml: string): string[][] {
  return passageFromParagraphs(htmlToParagraphs(contentHtml || ""), 40);
}

/**
 * The same cleaning and cutting for any list of paragraphs: the article's own
 * paragraphs, or (when the article text is missing) the summary and key points.
 * Empty when fewer than `minWords` usable words remain.
 */
export function passageFromParagraphs(source: string[], minWords = 40): string[][] {
  const seen = new Set<string>();
  const paragraphs: string[][] = [];
  let total = 0;

  for (const para of source) {
    if (total >= PASSAGE_MIN_WORDS) break;
    const kept: string[] = [];
    for (const s of sentencesOf(para || "")) {
      const key = norm(s);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      if (unusable(s)) continue;
      const w = words(s);
      if (total + w > PASSAGE_MAX_WORDS) break;
      kept.push(s);
      total += w;
    }
    if (kept.length) paragraphs.push(kept);
  }
  return total >= minWords ? paragraphs : [];
}

/** Stored form of a passage (Article.passage) and back. */
export const passageToJson = (p: string[][]) => (p.length ? JSON.stringify(p) : null);
export function passageFromJson(json: string | null | undefined): string[][] {
  try {
    const v = JSON.parse(json || "null");
    return Array.isArray(v) && v.every((x) => Array.isArray(x) && x.every((y) => typeof y === "string")) ? v : [];
  } catch {
    return [];
  }
}

/** Flat list of the passage's sentences (what the questions are built from). */
export const passageList = (paragraphs: string[][]) => paragraphs.flat();
