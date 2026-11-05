import type { FeedCard } from "@/lib/feed-card";
import { isSyllabusText } from "@/lib/study/daily-selection";

/**
 * Daily key notes: one point from each of the day's জরুরি ১০ stories, for active
 * recall and weekend revision. Every point is a sentence quoted word for word from
 * the story (its key points or fact sentences); nothing is reworded or invented.
 */

export interface KeyNote {
  rank: number;
  slug: string;
  title: string;
  point: string;
  sourceName: string;
  category: string;
}

export interface KeyNoteDay {
  day: string; // YYYY-MM-DD, Bangladesh time
  items: KeyNote[];
}

const MIN_LENGTH = 40;
const MAX_LENGTH = 220;
const HAS_FIGURE = /[০-৯0-9]/;
// A sentence that opens like this leans on the one before it ("এটি", "তবে", "প্রতিষ্ঠানটি"),
// so on its own a student cannot tell what it is about
const NEEDS_CONTEXT = new RegExp(
  "^(?:তবে|অর্থাৎ|আরও|ফলে|তাই|এতে|এর|এর আগে|এর ফলে|এ ছাড়া|এছাড়া|এদিকে|এ সময়|এসময়|পরে|সেখানে|তিনি|তাঁরা|তারা|তাঁর|তার|এটি|এটা|এই|এসব|ওই|সেই|এখানে|প্রতিষ্ঠানটি|সংস্থাটি|দলটি|দেশটি|However|But|It|This|These|They|He|She|His|Her|There)(?:[\\s,]|$)".normalize("NFC"),
  "u"
);
const normalize = (s: string) => s.normalize("NFC").replace(/\s+/g, " ").trim();

/** The date in Bangladesh (UTC+6), as YYYY-MM-DD. */
export function dhakaDay(date: Date | string | number): string {
  return new Date(new Date(date).getTime() + 6 * 3600 * 1000).toISOString().slice(0, 10);
}

/**
 * The most useful sentence of a story to memorise: one that touches the syllabus and
 * carries a figure or a date, at a readable length. Returns null when the story has
 * no suitable sentence (it is then left out rather than padded).
 */
export function pickKeyPoint(card: Pick<FeedCard, "keyTakeaways" | "factTable" | "summary">): string | null {
  const factSentences = (card.factTable || []).map((f) => f.relevance).filter(Boolean);
  const candidates = [...new Set([...(card.keyTakeaways || []), ...factSentences].map(normalize))];

  let best: { text: string; score: number } | null = null;
  for (const text of candidates) {
    if (text.length < MIN_LENGTH) continue;
    let score = 0;
    if (isSyllabusText(text)) score += 2;
    if (HAS_FIGURE.test(text)) score += 1.5;
    if (factSentences.includes(text)) score += 0.5;
    if (text.length > MAX_LENGTH) score -= 2;
    if (NEEDS_CONTEXT.test(text)) score -= 3;
    // Ties go to the shorter sentence: easier to memorise
    if (!best || score > best.score || (score === best.score && text.length < best.text.length)) best = { text, score };
  }
  if (best) return best.text;

  // Fall back to the summary only when it is itself a real sentence
  const summary = (card.summary || "").replace(/\s+/g, " ").trim();
  return summary.length >= MIN_LENGTH && summary.length <= MAX_LENGTH && !summary.endsWith("...") ? summary : null;
}

const words = (s: string) => new Set(normalize(s).toLowerCase().split(/[\s,;:।()"'“”‘’\-–—|.?!]+/).filter((w) => w.length >= 2));
/** Two points say the same thing when most of their words are shared. */
function nearlySame(a: string, b: string): boolean {
  const wa = words(a), wb = words(b);
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / Math.max(1, Math.min(wa.size, wb.size)) >= 0.6;
}

/** Notes for one day from that day's ranked ten (a point that repeats an earlier one is skipped). */
export function buildDayNotes(ten: (FeedCard & { dailyRank: number })[]): KeyNote[] {
  const kept: { c: FeedCard & { dailyRank: number }; point: string }[] = [];
  for (const c of ten) {
    const point = pickKeyPoint(c);
    if (point && !kept.some((k) => nearlySame(k.point, point))) kept.push({ c, point });
  }
  return kept
    .map(({ c, point }, i) => ({
      rank: i + 1,
      slug: c.slug,
      title: c.title,
      point,
      // "প্রথম আলো (শীর্ষ সংবাদ ও জাতীয়)" -> "প্রথম আলো": the paper's name is enough here
      sourceName: (c.sourceName || "").replace(/\s*\(.*\)\s*$/, ""),
      category: c.category?.name || "",
    }));
}

/** Plain text for copying or downloading, in the order shown. */
export function notesToText(days: KeyNoteDay[], heading: string): string {
  const lines = [heading, ""];
  for (const d of days) {
    if (!d.items.length) continue;
    lines.push(`${formatDay(d.day)}`);
    for (const n of d.items) lines.push(`${toBnDigits(n.rank)}. ${n.title}\n   ${n.point} (${n.sourceName})`);
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
}

const toBnDigits = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

/** "৫ নভেম্বর ২০২৬" from "2026-11-05" (no time zone involved). */
export function formatDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return `${toBnDigits(d)} ${BN_MONTHS[m - 1]} ${toBnDigits(y)}`;
}
