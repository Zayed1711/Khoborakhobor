/**
 * IELTS-style reading practice for an English Learning story, built only from the
 * reading passage shown on the page (a part of the original article). Every answer is
 * in that passage, so a student never needs another window. Nothing is invented. No AI:
 * deterministic rules, so the same passage always gets the same set.
 *
 *   Multiple choice (1–2): a passage sentence with a figure blanked; the wrong options
 *                          are sensible variants (a percentage stays within 0–100, a day
 *                          of the month within 1–31, a year stays near).
 *   Fill in the blank (1–2): "Write ONE WORD from the passage" for a word that carries
 *                          the story's subject (shared with the headline).
 *   True / False (1–2):    TRUE = a passage sentence as written; FALSE = the same kind of
 *                          sentence with one fact changed (a figure or a weekday).
 *
 * Aim: 3–4 questions in all.
 */
import { splitSentences } from "@/lib/study/extractive";

export interface PracticeMcq {
  kind: "mcq";
  question: string; // the sentence with _____
  options: string[];
  correctIndex: number;
  sourceSentence: string;
}
export interface PracticeBlank {
  kind: "blank";
  question: string;
  /** Accepted answers, lower case; the first is the word in the passage */
  accepted: string[];
  sourceSentence: string;
}
export interface PracticeTrueFalse {
  kind: "tf";
  /** The statement the student judges */
  question: string;
  answer: "TRUE" | "FALSE";
  /** The passage sentence it is checked against */
  sourceSentence: string;
}
export type PracticeItem = PracticeMcq | PracticeBlank | PracticeTrueFalse;

/** The older source (summary + key points), used only when the article text is missing. */
export interface PracticeSource {
  title: string;
  summary: string;
  keyTakeaways: string[];
  factTable: { relevance?: string }[];
}

const MAX_ITEMS = 4;
const BLANK = "_____";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic hash, so a story's options are shuffled the same way every time. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function shuffle<T>(items: T[], seed: string): T[] {
  const a = [...items];
  let h = hash(seed);
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1103515245) >>> 0;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Fallback passage when the article text is missing: the author's summary, then key
 * points and fact sentences.
 */
export function passageSentences(src: PracticeSource): string[] {
  // Some sites drop the space after a full stop ("morning.Shafiqul"); restore it before splitting
  const fixSpacing = (t: string) => (t || "").replace(/([a-z0-9])\.([A-Z])/g, "$1. $2");
  const all = [src.summary || "", ...(src.keyTakeaways || []), ...(src.factTable || []).map((f) => f.relevance || "")]
    .flatMap((t) => splitSentences(fixSpacing(t)))
    .map((s) => s.replace(/\s+/g, " ").trim())
    // cut-off text ("…has ...") is not a sentence a student can work with
    .filter((s) => s.length >= 30 && s.length <= 320 && !/[ঀ-৿]/.test(s) && !/(\.\.\.|…)/.test(s));
  return [...new Set(all)];
}

// A figure with an optional unit: "Tk 30,000", "52.12 percent", "2026", "600,000 students"
const FIGURE = /(?:Tk\s?|US\$\s?|\$\s?)?\d[\d,]*(?:\.\d+)?(?:\s?(?:%|percent|per cent|pc|million|billion|crore|lakh|thousand))?/gi;

/**
 * A figure that is not a fact worth asking about: one end of a range ("70–80 per cent"),
 * part of a score or time ("3-1", "8:00"), a compound word ("10-man", "six-member"
 * written as "6-member"), or part of a name ("Mirpur 10", "COP31", "GPA-5").
 */
function badFigure(sentence: string, figure: string): boolean {
  const i = sentence.indexOf(figure);
  const before = sentence.slice(Math.max(0, i - 25), i);
  const after = sentence.slice(i + figure.length, i + figure.length + 4);
  if (/[–-]\s?$/.test(before) || /^\s?[–-]\s?\d/.test(after)) return true; // range or score
  if (/^[:.]\d/.test(after) || /\d[:.]$/.test(before)) return true; // time, decimal remains
  if (/^\.[A-Z]/.test(after)) return true; // stock code ("2222.SE")
  if (/^-[a-z]/i.test(after)) return true; // "10-man", "2-match"
  if (/[A-Za-z]$/.test(before)) return true; // "COP31", "GPA5"
  const hasUnit = /\D/.test(figure.replace(/[\d,.\s]/g, ""));
  if (!hasUnit && /[A-Z][a-zA-Z]+\s$/.test(before) && !/\b(?:in|on|by|of|from|to|since|until|at)\s$/.test(before)) return true; // "Mirpur 10"
  return false;
}

const MONTH_AFTER = /^\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/;

/** Wrong values for a figure that stay realistic. */
function figureVariants(figure: string, after = ""): string[] | null {
  const numMatch = figure.match(/\d[\d,]*(?:\.\d+)?/);
  if (!numMatch) return null;
  const raw = numMatch[0];
  const value = Number(raw.replace(/,/g, ""));
  if (!isFinite(value) || value === 0) return null;
  const decimals = (raw.split(".")[1] || "").length;
  const isPercent = /%|percent|per cent|pc/i.test(figure);
  const isYear = !isPercent && decimals === 0 && !raw.includes(",") && value >= 1900 && value <= 2100 && figure.trim() === raw;
  const isDay = figure.trim() === raw && decimals === 0 && value >= 1 && value <= 31 && MONTH_AFTER.test(after);
  const small = figure.trim() === raw && decimals === 0 && value < 20 && !isDay; // "five platoons", "3 people"

  let variants: number[];
  if (isDay) variants = [value - 3, value + 3, value - 7, value + 7, value - 1, value + 1, value - 10, value + 10].filter((v) => v >= 1 && v <= 31);
  else if (isYear) variants = [value - 1, value + 1, value - 2];
  else if (isPercent) variants = [value - 10, value + 10, value + 5, value - 5].filter((v) => v > 0 && v <= 100);
  else if (small) variants = [value + 1, value + 2, value - 1, value + 3].filter((v) => v > 0);
  else variants = [value * 0.5, value * 1.5, value * 2];

  const fmt = (v: number) => {
    const fixed = decimals ? v.toFixed(decimals) : String(Math.round(v));
    return raw.includes(",") ? Number(fixed).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : fixed;
  };
  const options = [...new Set(variants.map((v) => figure.replace(raw, fmt(v))))].filter((o) => o !== figure);
  return options.length >= 3 ? options.slice(0, 3) : null;
}

/** The best figure in a sentence to ask about, with three realistic wrong values. */
function pickFigure(s: string): { figure: string; wrong: string[] } | null {
  const figures = (s.match(FIGURE) || [])
    .map((f) => f.trim())
    .filter((f) => /\d/.test(f) && s.split(f).length === 2 && !badFigure(s, f));
  // Prefer a figure with a unit ("Tk 30,000", "52 percent"), then the longest
  const hasUnit = (f: string) => /\D/.test(f.replace(/[\d,.\s]/g, ""));
  for (const figure of figures.sort((a, b) => Number(hasUnit(b)) - Number(hasUnit(a)) || b.length - a.length)) {
    const wrong = figureVariants(figure, s.slice(s.indexOf(figure) + figure.length));
    if (wrong) return { figure, wrong };
  }
  return null;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** The sentence with one fact changed, for a FALSE statement; null when nothing can be changed safely. */
function falsify(s: string): string | null {
  const f = pickFigure(s);
  if (f) return s.replace(f.figure, f.wrong[hash(s) % f.wrong.length]);
  const day = WEEKDAYS.find((d) => new RegExp(`\\b${d}\\b`).test(s) && s.split(d).length === 2);
  if (day) return s.replace(day, WEEKDAYS[(WEEKDAYS.indexOf(day) + 2 + (hash(s) % 3)) % 7]);
  return null;
}

const STOP = new Set(
  "the a an and or but of to in on at by for with from as is are was were be been being has have had this that these those it its their there which who whom whose what when where why how not no will would can could should may might also than then into about after before over under more most very such said says say amid while during they them he him she her we us you your his our its itself themselves".split(
    " "
  )
);

function headlineWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w))
  );
}

function accepted(word: string): string[] {
  const w = word.toLowerCase();
  const forms = new Set([w]);
  // Singular/plural only for noun-like words (not "arrested", "running", "quickly")
  if (!/(?:ed|ing|ly)$/.test(w)) {
    if (w.endsWith("s")) forms.add(w.slice(0, -1));
    else forms.add(w + "s");
  }
  return [...forms];
}

/** A word from the passage that carries the story's subject, to blank out. */
function pickBlankWord(s: string, subject: Set<string>): string | null {
  const candidates = s
    .split(/\s+/)
    .slice(1) // not the first word
    .map((w) => w.replace(/^[("“‘']+|[)"”’',.;:!?]+$/g, ""))
    .filter((w) => /^[a-z]{4,}$/.test(w) && !STOP.has(w) && [...subject].some((h) => w.startsWith(h.slice(0, Math.max(4, h.length - 2)))));
  const word = candidates.sort((a, b) => b.length - a.length)[0];
  if (!word || s.split(new RegExp(`\\b${word}\\b`)).length !== 2) return null;
  return word;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build 3–4 questions from the passage's sentences only (fewer when the passage cannot
 * support more). `title` is the headline, used to find the story's subject words.
 */
export function buildIeltsPractice(sentences: string[], title: string): PracticeItem[] {
  const usable = [...new Set(sentences.map((s) => s.replace(/\s+/g, " ").trim()))].filter((s) => s.length >= 30 && s.length <= 320);
  const subject = headlineWords(title);
  const used = new Set<string>();
  const mcqs: PracticeMcq[] = [];
  const blanks: PracticeBlank[] = [];
  const tfs: PracticeTrueFalse[] = [];

  const makeMcq = () => {
    for (const s of usable) {
      if (used.has(s)) continue;
      const f = pickFigure(s);
      if (!f || mcqs.some((m) => m.options[m.correctIndex] === f.figure)) continue;
      const options = shuffle([f.figure, ...f.wrong], s + f.figure);
      used.add(s);
      mcqs.push({ kind: "mcq", question: s.replace(f.figure, BLANK), options, correctIndex: options.indexOf(f.figure), sourceSentence: s });
      return true;
    }
    return false;
  };
  const makeBlank = () => {
    for (const s of usable) {
      if (used.has(s)) continue;
      const word = pickBlankWord(s, subject);
      // Two blanks with the same answer ("return", "returned") teach nothing new
      if (!word || blanks.some((b) => b.accepted[0].slice(0, 5) === word.toLowerCase().slice(0, 5))) continue;
      used.add(s);
      blanks.push({ kind: "blank", question: s.replace(new RegExp(`\\b${word}\\b`), BLANK), accepted: accepted(word), sourceSentence: s });
      return true;
    }
    return false;
  };
  const makeFalse = () => {
    for (const s of usable) {
      if (used.has(s) || s.length > 220) continue;
      const changed = falsify(s);
      if (!changed || changed === s) continue;
      used.add(s);
      tfs.push({ kind: "tf", question: changed, answer: "FALSE", sourceSentence: s });
      return true;
    }
    return false;
  };
  const makeTrue = () => {
    // A plain statement of fact from the passage (not a question or a quote)
    for (const s of [...usable].sort((a, b) => hash(a) - hash(b))) {
      if (used.has(s) || s.length > 220 || /[“”"?]/.test(s)) continue;
      used.add(s);
      tfs.push({ kind: "tf", question: s, answer: "TRUE", sourceSentence: s });
      return true;
    }
    return false;
  };

  // One of each kind first, then more of whatever the passage supports, up to four
  makeMcq();
  makeBlank();
  makeFalse();
  makeTrue();
  let total = mcqs.length + blanks.length + tfs.length;
  // Keep trying every kind until there are at least three (when the passage allows)
  for (let progress = true; total < 3 && progress; ) {
    progress = false;
    for (const step of [makeFalse, makeMcq, makeBlank, makeTrue]) {
      if (total >= 3) break;
      if (step()) {
        total += 1;
        progress = true;
      }
    }
  }
  // A fourth question when one more kind still fits
  for (const step of [makeMcq, makeBlank, makeFalse]) {
    if (total >= MAX_ITEMS) break;
    if (step()) total += 1;
  }
  // Order: multiple choice, then fill in the blank, then True/False
  return [...mcqs, ...blanks, ...tfs].slice(0, MAX_ITEMS);
}

/** Normalise a typed answer for comparison: lower case, letters only. */
export function normaliseAnswer(text: string): string {
  return (text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isAcceptedAnswer(text: string, acceptedAnswers: string[]): boolean {
  const n = normaliseAnswer(text);
  return n.length > 0 && acceptedAnswers.some((a) => normaliseAnswer(a) === n);
}
