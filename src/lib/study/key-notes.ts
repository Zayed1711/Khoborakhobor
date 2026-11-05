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

/**
 * Saved notes carry the version of the rule that picked them. Notes saved by an older
 * rule are rebuilt once with the current one; after that a past day never changes.
 * v2: the note states the story's main theme (headline overlap), not a side detail.
 */
export const NOTES_VERSION = 2;

/** Read a saved notes row: its items, or null when it was built by an older rule. */
export function readSavedNotes(json: string | null | undefined): KeyNote[] | null {
  try {
    const v = JSON.parse(json || "null");
    return v && !Array.isArray(v) && v.v === NOTES_VERSION && Array.isArray(v.items) ? v.items : null;
  } catch {
    return null;
  }
}

/** Notes items from a saved row of any version (for checks such as "is this story quoted?"). */
export function anySavedNotes(json: string | null | undefined): KeyNote[] {
  try {
    const v = JSON.parse(json || "null");
    return Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : [];
  } catch {
    return [];
  }
}

export const saveNotesJson = (items: KeyNote[]) => JSON.stringify({ v: NOTES_VERSION, items });

export interface KeyNoteDay {
  day: string; // YYYY-MM-DD, Bangladesh time
  items: KeyNote[];
}

const MIN_LENGTH = 40;
const MAX_LENGTH = 220;
const HAS_FIGURE = /[০-৯0-9]/;
// At least this share of the headline's subject words must appear in the note
const MIN_THEME = 0.15;
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

// First-person lines and lines that open with a quote are anecdote or opinion,
// not the story's main fact ("আমি…", "আমাদের…", "“…”")
// Opinion and advice ("…বিচার করা প্রয়োজন", "…উচিত") is the writer's view, not a fact to memorise
const OPINION = new RegExp("(?:প্রয়োজন|উচিত|দরকার|মনে হয়|বলা যায়|আশা করা যায়|নিশ্চয়ই|\\b(?:should|must|ought)\\b)".normalize("NFC"), "iu");
const ANECDOTE = new RegExp("^[\"“‘']|(?:^|\\s)(?:আমি|আমার|আমরা|আমাদের|আমাকে|I|We|My|Our)(?:[\\s,]|$)".normalize("NFC"), "u");

// Bengali adds endings to words; "বোর্ডে" and "বোর্ডের" are the same word as "বোর্ড"
const ENDINGS = ["গুলোর", "গুলো", "দের", "তেও", "েরা", "ের", "তে", "কে", "রা", "টি", "টা", "য়", "র", "ে", "ও"].map((e) => e.normalize("NFC"));
const THEME_STOP = new Set(
  ["ও", "এবং", "বা", "থেকে", "জন্য", "সঙ্গে", "করে", "হয়েছে", "একটি", "এই", "নিয়ে", "কী", "কেন", "কত", "কোথায়", "যেভাবে", "কীভাবে", "নতুন", "আরও", "the", "and", "for", "with", "from", "that", "this", "how", "what", "why"].map((w) => w.normalize("NFC"))
);
function stemWord(w: string): string {
  for (const e of ENDINGS) if (w.endsWith(e) && w.length - e.length >= 3) return w.slice(0, -e.length);
  return w;
}
function themeWords(text: string): string[] {
  return [
    ...new Set(
      normalize(text)
        .toLowerCase()
        .split(/[\s,;:।()\[\]"'“”‘’\-–—|.?!]+/)
        .filter((w) => w.length >= 2 && !THEME_STOP.has(w))
        .map(stemWord)
    ),
  ];
}

/** Share of the headline's subject words that a sentence also carries (0 to 1). */
export function headlineOverlap(title: string, sentence: string): number {
  const head = themeWords(title).filter((w) => w.length >= 3 || /[০-৯0-9]/.test(w));
  if (!head.length) return 0;
  const words = themeWords(sentence);
  const has = (w: string) => words.some((x) => x === w || (w.length >= 3 && (x.startsWith(w) || w.startsWith(x)) && Math.min(x.length, w.length) >= 3));
  return head.filter(has).length / head.length;
}

/**
 * The note for a story: the sentence that states what the story is about. A side
 * detail ("প্রতিদিন যাতায়াতে প্রায় ১০০ টাকা খরচ হতো") is not a note, so the main test
 * is how much of the headline's subject a sentence carries; a figure or a syllabus
 * term only breaks ties. Candidates are the story's quoted key points, its fact
 * sentences and its summary (when the summary is a whole sentence). Every note is
 * quoted word for word. Returns null when no sentence states the theme.
 */
export function pickKeyPoint(card: Pick<FeedCard, "title" | "keyTakeaways" | "factTable" | "summary">): string | null {
  const factSentences = (card.factTable || []).map((f) => normalize(f.relevance || "")).filter(Boolean);
  const summary = normalize(card.summary || "");
  const summaryIsSentence = summary.length >= MIN_LENGTH && summary.length <= MAX_LENGTH && !/(\.\.\.|…)$/.test(summary);
  const candidates = [
    ...new Set([...(card.keyTakeaways || []).map(normalize), ...factSentences, ...(summaryIsSentence ? [summary] : [])]),
  ];

  let best: { text: string; score: number; theme: number } | null = null;
  for (const text of candidates) {
    if (text.length < MIN_LENGTH) continue;
    const theme = headlineOverlap(card.title || "", text);
    let score = theme * 6;
    if (text === summary) score += 1; // the opening line usually states the main point
    if (isSyllabusText(text)) score += 1;
    if (HAS_FIGURE.test(text)) score += 0.75;
    if (text.length > MAX_LENGTH) score -= 2;
    if (NEEDS_CONTEXT.test(text)) score -= 3;
    if (ANECDOTE.test(text)) score -= 2;
    if (OPINION.test(text)) score -= 3;
    // Ties go to the shorter sentence: easier to memorise
    if (!best || score > best.score || (score === best.score && text.length < best.text.length)) best = { text, score, theme };
  }
  // A sentence that shares nothing with the headline is a side detail, not the theme
  return best && best.theme >= MIN_THEME ? best.text : null;
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
