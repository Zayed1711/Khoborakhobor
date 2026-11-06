/**
 * IELTS-style reading practice for an English Learning story, built only from the
 * story's own text (the author's summary, its quoted key points and fact sentences).
 * Every correct answer is a word or figure that appears in that text; nothing is
 * invented. No AI: deterministic rules, so the same story always gets the same set.
 *
 *   MCQ (2):        (a) a passage sentence with a figure blanked; wrong options are
 *                   sensible variants (a percentage stays within 0-100, a year stays near);
 *                   (b) "Which of these statements appears in the passage?": one sentence
 *                   from this story and three real sentences from other stories on other
 *                   subjects (true statements, just not in this passage).
 *   Completion (2): "Write ONE WORD from the passage" for a word that carries the
 *                   story's subject (shared with the headline).
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
export type PracticeItem = PracticeMcq | PracticeBlank;

export interface PracticeSource {
  title: string;
  summary: string;
  keyTakeaways: string[];
  factTable: { relevance?: string }[];
}

const MCQ_COUNT = 2;
const BLANK_COUNT = 2;
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

/** The passage a student reads: summary sentences, then key points and fact sentences. */
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

/** One end of a range ("70–80 per cent", "Tk 400,000–500,000"): blanking it would confuse. */
function isInRange(sentence: string, figure: string): boolean {
  const i = sentence.indexOf(figure);
  return /[–-]\s?$/.test(sentence.slice(Math.max(0, i - 2), i)) || /^\s?[–-]\s?\d/.test(sentence.slice(i + figure.length, i + figure.length + 3));
}

/** A bare number right after a capitalised word is part of a place name ("Mirpur 10"). */
function isPlaceNumber(sentence: string, figure: string): boolean {
  if (/\D/.test(figure.replace(/[\d,.\s]/g, ""))) return false; // has a unit: a real figure
  const i = sentence.indexOf(figure);
  return /[A-Z][a-zA-Z]+\s$/.test(sentence.slice(Math.max(0, i - 25), i));
}

const MONTH_AFTER = /^\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/;

function figureOptions(figure: string, after = ""): string[] | null {
  const numMatch = figure.match(/\d[\d,]*(?:\.\d+)?/);
  if (!numMatch) return null;
  const raw = numMatch[0];
  const value = Number(raw.replace(/,/g, ""));
  if (!isFinite(value) || value === 0) return null;
  const decimals = (raw.split(".")[1] || "").length;
  const isPercent = /%|percent|per cent|pc/i.test(figure);
  const isYear = !isPercent && decimals === 0 && !raw.includes(",") && value >= 1900 && value <= 2100 && figure.trim() === raw;

  const isDay = figure.trim() === raw && decimals === 0 && value >= 1 && value <= 31 && MONTH_AFTER.test(after);
  let variants: number[];
  if (isDay) variants = [value - 3, value + 3, value - 7, value + 7, value - 1, value + 1, value - 10, value + 10].filter((v) => v >= 1 && v <= 31);
  else if (isYear) variants = [value - 1, value + 1, value - 2];
  else if (isPercent) variants = [value - 10, value + 10, value + 5, value - 5].filter((v) => v > 0 && v <= 100);
  else variants = [value * 0.5, value * 1.5, value * 2];

  const fmt = (v: number) => {
    const fixed = decimals ? v.toFixed(decimals) : String(Math.round(v));
    return raw.includes(",") ? Number(fixed).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : fixed;
  };
  const options = [...new Set(variants.map((v) => figure.replace(raw, fmt(v))))].filter((o) => o !== figure);
  return options.length >= 3 ? options.slice(0, 3) : null;
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

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build the practice set. `otherSentences` are sentences from other English stories
 * (wrong options for "which statement appears in the passage"). Returns fewer items
 * when the text cannot support more.
 */
export function buildIeltsPractice(src: PracticeSource, otherSentences: string[] = []): PracticeItem[] {
  const sentences = passageSentences(src);
  const used = new Set<string>();
  const items: PracticeItem[] = [];
  const subject = headlineWords(src.title);

  // 1a. Multiple choice on a figure
  for (const s of sentences) {
    if (items.length >= MCQ_COUNT) break;
    const figures = (s.match(FIGURE) || [])
      .map((f) => f.trim())
      .filter((f) => /\d/.test(f) && s.split(f).length === 2 && !isPlaceNumber(s, f) && !isInRange(s, f));
    // Prefer a figure with a unit ("Tk 30,000", "52 percent"), then the longest
    const hasUnit = (f: string) => /\D/.test(f.replace(/[\d,.\s]/g, ""));
    const figure = figures.sort((a, b) => Number(hasUnit(b)) - Number(hasUnit(a)) || b.length - a.length)[0];
    const wrong = figure ? figureOptions(figure, s.slice(s.indexOf(figure) + figure.length)) : null;
    if (!figure || !wrong) continue;
    // Two questions with the same answer teach nothing new
    if (items.some((i) => i.kind === "mcq" && i.options[i.correctIndex] === figure)) continue;
    const options = shuffle([figure, ...wrong], s + figure);
    items.push({ kind: "mcq", question: s.replace(figure, BLANK), options, correctIndex: options.indexOf(figure), sourceSentence: s });
    used.add(s);
  }

  // 1b. "Which of these statements appears in the passage?"
  // The passage's vocabulary: content words and acronyms ("HSC", "DMP")
  const passageText = sentences.join(" ");
  const passageWords = new Set(passageText.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 5 && !STOP.has(w)));
  const passageAcronyms = new Set(passageText.match(/\b[A-Z]{2,}\b/g) || []);
  const foreign = [...new Set(otherSentences.map((t) => t.replace(/\s+/g, " ").trim()))].filter((t) => {
    if (t.length < 40 || t.length > 200 || /[ঀ-৿]/.test(t) || /(\.\.\.|…)/.test(t) || sentences.includes(t)) return false;
    // A different subject, so it cannot be mistaken for part of this story
    if ([...subject].some((w) => t.toLowerCase().includes(w))) return false;
    if ((t.match(/\b[A-Z]{2,}\b/g) || []).some((a) => passageAcronyms.has(a))) return false;
    const shared = t.toLowerCase().split(/[^a-z]+/).filter((w) => passageWords.has(w));
    return new Set(shared).size <= 1;
  });
  for (const s of sentences) {
    if (items.length >= MCQ_COUNT) break;
    if (used.has(s) || s.length > 200 || foreign.length < 3) continue;
    const wrong = shuffle(foreign, s).slice(0, 3);
    const options = shuffle([s, ...wrong], "stmt" + s);
    items.push({
      kind: "mcq",
      question: "Which of these statements appears in the passage?",
      options,
      correctIndex: options.indexOf(s),
      sourceSentence: s,
    });
    used.add(s);
  }

  // 2. Sentence completion: one word that carries the story's subject
  for (const s of sentences) {
    if (items.filter((i) => i.kind === "blank").length >= BLANK_COUNT) break;
    if (used.has(s)) continue;
    const words = s.split(/\s+/);
    const candidates = words
      .slice(1) // not the first word
      .map((w) => w.replace(/^[("“‘']+|[)"”’',.;:!?]+$/g, ""))
      .filter((w) => /^[a-z]{4,}$/.test(w) && !STOP.has(w) && [...subject].some((h) => w.startsWith(h.slice(0, Math.max(4, h.length - 2)))));
    const word = candidates.sort((a, b) => b.length - a.length)[0];
    if (!word || s.split(new RegExp(`\\b${word}\\b`)).length !== 2) continue;
    items.push({ kind: "blank", question: s.replace(new RegExp(`\\b${word}\\b`), BLANK), accepted: accepted(word), sourceSentence: s });
    used.add(s);
  }
  return items;
}

/** Normalise a typed answer for comparison: lower case, letters only. */
export function normaliseAnswer(text: string): string {
  return (text || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function isAcceptedAnswer(text: string, acceptedAnswers: string[]): boolean {
  const n = normaliseAnswer(text);
  return n.length > 0 && acceptedAnswers.some((a) => normaliseAnswer(a) === n);
}

/** Sentences from other stories, usable as wrong options. */
export function sentencesFrom(texts: string[]): string[] {
  return [...new Set(texts.flatMap((t) => splitSentences((t || "").replace(/([a-z0-9])\.([A-Z])/g, "$1. $2"))))];
}
