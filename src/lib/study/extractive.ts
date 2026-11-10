/**
 * Extractive study material.
 *
 * Every fact, takeaway and quiz answer produced here is a verbatim span of the
 * article's own text. Nothing is invented: when the article does not contain enough
 * material, the functions return fewer items (or null) instead of filling with
 * templates. This replaces the keyword-template generators that attached the same
 * "facts" and questions to unrelated stories.
 */

export interface FactRow {
  parameter: string;
  value: string;
  /** The article sentence the value was taken from */
  relevance: string;
}

export interface ExtractiveQuiz {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  sourceSentence: string;
}

// ---------------------------------------------------------------------------
// Cleaning
// ---------------------------------------------------------------------------

/**
 * Bengali letters with a nukta (য়, ড়, ঢ়) can be stored as one code point (U+09DF) or as
 * two (য + ়). They look identical but do not compare equal, so every comparison here
 * runs on NFC-normalized text.
 */
const nfc = (s: string) => s.normalize("NFC");

/** Publisher chrome that scrapers picked up as if it were article text. */
const BOILERPLATE_PATTERNS: RegExp[] = [
  /বিবিসি বাংলার সাথে থাকার জন্য ধন্যবাদ/,
  /হোয়াটসঅ্যাপ চ্যানেল/,
  /^Copyright:/i,
  /unauthorized use or reproduction of The Daily Star/i,
  /strictly prohibited and constitutes copyright infringement/i,
  /^আরও পড়ুন/,
  /^আরো পড়ুন/,
  /^বিজ্ঞাপন$/,
  /^Advertisement$/i,
  /^Follow us/i,
  /^Share (this|on)/i,
  /^Read more/i,
  /^©/,
  /নিয়মিত চোখ রাখুন/,
  /লাইভ পাতায় আপনাদের স্বাগত/,
  /^Sign up for our .* newsletter/i,
  /^Go to BBC[A-Za-z]*\.com/i,
].map((re) => new RegExp(nfc(re.source), re.flags));

/**
 * Paragraphs written by scripts/enrich_short_articles.ts (now retired). They were
 * presented as reporting but no publisher wrote them.
 */
export const INVENTED_FILLER_MARKERS = [
  "উক্ত বিষয়ে সংশ্লিষ্ট খাত ও অংশীজনদের",
  "ঘটনার প্রেক্ষাপট ও সংশ্লিষ্ট তথ্য পর্যালোচনায়",
  "বিশেষজ্ঞরা অভিমত প্রকাশ করেছেন যে, প্রাতিষ্ঠানিক",
  "শিক্ষার্থী ও বিসিএস পরীক্ষার্থীদের জন্য এই ধরনের সমকালীন",
  "প্রাতিষ্ঠানিক নীতিমালার প্রভাব নিয়ে বিস্তারিত তথ্যাবলির জন্য",
].map(nfc);

/** True when the text contains any of the invented filler paragraphs. */
export function hasInventedFiller(text: string): boolean {
  const t = nfc(text);
  return INVENTED_FILLER_MARKERS.some((m) => t.includes(m));
}

export function isBoilerplate(text: string): boolean {
  const t = nfc(text.trim());
  return BOILERPLATE_PATTERNS.some((re) => re.test(t)) || INVENTED_FILLER_MARKERS.some((m) => t.includes(m));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function htmlToParagraphs(html: string): string[] {
  if (!html) return [];
  const blocks = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(blocks)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function plainText(html: string): string {
  return htmlToParagraphs(html).join(" ");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Remove publisher chrome, invented filler and repeated paragraphs from a stored
 * body. Returns plain `<p>` HTML.
 */
/**
 * BBC Bangla puts photo credits ("ছবির উৎস, Anadolu via Getty Images") in the text,
 * sometimes glued to the next sentence. Remove the credit and keep any Bengali text.
 */
const PHOTO_CREDIT_RE = new RegExp(nfc("^\\s*ছবির (?:উৎস|ক্যাপশন),\\s*[^\\u0980-\\u09FF]*"), "u");

export function stripPhotoCredit(text: string): string {
  return nfc(text).replace(PHOTO_CREDIT_RE, "").trim();
}

export function cleanArticleBody(html: string): { html: string; removed: number; paragraphs: string[] } {
  const seen = new Set<string>();
  const kept: string[] = [];
  let removed = 0;
  for (const raw of htmlToParagraphs(html)) {
    const p = stripPhotoCredit(raw);
    if (!p) {
      removed++;
      continue;
    }
    const key = p.replace(/\s+/g, "");
    if (isBoilerplate(p) || seen.has(key)) {
      removed++;
      continue;
    }
    seen.add(key);
    kept.push(p);
  }
  return { html: kept.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n"), removed, paragraphs: kept };
}

// ---------------------------------------------------------------------------
// Sentences and numbers
// ---------------------------------------------------------------------------

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/**
 * True when every opened quotation is closed. Curly ‘ ’ and “ ” are counted as pairs
 * (an extra ’ is an English apostrophe, so only unclosed openings count), straight "
 * must come in pairs.
 */
export function quotesBalanced(s: string): boolean {
  const n = (re: RegExp) => (s.match(re) || []).length;
  return n(/‘/g) <= n(/’/g) && n(/“/g) <= n(/”/g) && n(/"/g) % 2 === 0;
}

export function splitSentences(text: string): string[] {
  const pieces = text
    .replace(/\s+/g, " ")
    .split(/(?<=[।!?])\s+|(?<=[a-z0-9)"”’]\.)\s+(?=[A-Z"“‘ঀ-৿])/)
    .map((s) => s.trim())
    .filter(Boolean);
  // A full stop inside a quotation (‘সেটা ২০১০ সাল।’ তিনি লেখেন…) does not end the
  // sentence: join pieces until the quotation is closed
  const out: string[] = [];
  let buf = "";
  for (const p of pieces) {
    buf = buf ? `${buf} ${p}` : p;
    if (quotesBalanced(buf) || buf.length > 600) {
      out.push(buf);
      buf = "";
    }
  }
  if (buf) out.push(buf);
  // A sentence whose quotation never closes reads as broken: never quote it
  return out.filter((s) => s.length >= 25 && s.length <= 320 && quotesBalanced(s));
}

// Words that point back to an earlier sentence ("this ship", "he", "therefore"): a key
// point that starts with one cannot be understood on its own
const BN_LEADS = ["এই", "এ", "সেই", "সে", "ওই", "তেমন", "সুতরাং", "তবে", "এদিকে", "এর", "তাই", "ফলে", "অন্যদিকে", "তিনি", "তাঁরা", "তারা", "তাঁর", "তার", "তাঁদের", "তাদের", "এবার", "এছাড়া", "এ ছাড়া", "পাশাপাশি", "একই সঙ্গে", "এরপর", "এরপরও", "এসব", "এগুলো", "এটি", "এটা", "সেটি", "সেটা", "কিন্তু", "আর", "অথচ"];
const EN_LEADS = ["he", "she", "it", "they", "this", "that", "these", "those", "so", "however", "also", "but", "and", "meanwhile", "then", "thus", "therefore", "his", "her", "their", "its"];

/** True when a sentence makes sense without the one before it. */
export function standsAlone(sentence: string): boolean {
  const s = (sentence || "").normalize("NFC").replace(/^[\s"'“”‘’(]+/, "").trim();
  if (!s) return false;
  const first = s.split(/[\s,;:।]+/)[0].toLowerCase();
  const firstTwo = s.split(/\s+/).slice(0, 2).join(" ");
  if (/[ঀ-৿]/.test(s)) {
    if (BN_LEADS.includes(first) || BN_LEADS.includes(firstTwo)) return false;
    // "... পেয়েছেন তিনি।" / "এ কথা বলেন" : the subject or topic is in another sentence
    if (/\s(তিনি|তাঁরা|তারা)[।!?]?$/.test(s) || /(এ|এই|এসব|এমন|সে) (কথা|তথ্য) (বল|জানা)/.test(s)) return false;
    return true;
  }
  if (EN_LEADS.includes(first.replace(/[^a-z]/g, ""))) return false;
  if (/\bsaid (this|so)\.?$/i.test(s) || /\b(this|that)\.$/i.test(s)) return false;
  return true;
}

/**
 * Quoted study material shown with a story: drop fact rows that repeat a key point
 * (fewer copied lines from one report) and any line with an unclosed quotation.
 */
export function tidyQuotes<F extends { relevance?: string }>(keyTakeaways: string[], factTable: F[]): { keyTakeaways: string[]; factTable: F[] } {
  const norm = (s: string) => (s || "").replace(/\s+/g, " ").trim();
  const points = keyTakeaways.filter((t) => quotesBalanced(t));
  const seen = new Set(points.map(norm));
  const whole = factTable.filter((r) => quotesBalanced(norm(r.relevance || "")));
  const fresh = whole.filter((r) => !seen.has(norm(r.relevance || "")));
  // Older stories picked facts from the key-point sentences: keep the sheet rather than empty it
  return { keyTakeaways: points, factTable: fresh.length ? fresh : whole };
}

/**
 * The card summary: the feed's teaser when it is real text, otherwise the story's
 * own first paragraph. Publisher chrome ("আরও পড়ুন...", sign-up prompts) is never
 * used, and the text is cut at a sentence end, not in the middle of a word.
 */
export function pickSummary(teaser: string, paragraphs: string[], max = 220): string {
  const candidates = [teaser, ...paragraphs]
    .map((t) => (t || "").replace(/\s+/g, " ").trim())
    .filter((t) => t.length >= 40 && !isBoilerplate(t));
  const text = candidates[0];
  if (!text) return "";
  if (text.length <= max) return text;
  const sentences = splitSentences(text);
  let out = "";
  for (const s of sentences) {
    if ((out + " " + s).trim().length > max) break;
    out = (out + " " + s).trim();
  }
  if (out) return out;
  const cut = text.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 40)).trim() + "…";
}

function toAsciiDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

function toScriptDigits(n: string, bengali: boolean): string {
  return bengali ? n.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : n;
}

const UNIT =
  "(?:হাজার|লাখ|লক্ষ|কোটি|শতাংশ|টাকা|ডলার|ইউরো|ইয়েন|রুপি|জন|টি|টা|বছর|মাস|দিন|ঘণ্টা|মিনিট|কিলোমিটার|কিমি|মেগাওয়াট|টন|সালে|সাল|তম|%|percent|per cent|million|billion|crore|lakh|people|years|km|MW|tonnes|Tk|taka|dollars?)";
const NUMBER = "[০-৯0-9][০-৯0-9,.]*";
const PREFIX = "(?:US\\$|\\$|৳|Tk\\.?|BDT|Rs\\.?)";
// One unit, not running into a following letter ("টার", "জনের")
const U = `(?:${UNIT})(?![\\p{L}\\p{M}])`;
// Compound amounts stay whole: "২৯ কোটি ৫৫ লাখ মার্কিন ডলার" must not be cut to "২৯ কোটি"
const QUANTITY_RE = new RegExp(
  `${PREFIX}?\\s?${NUMBER}\\s?${U}(?:\\s?(?:${NUMBER}\\s?)?${U})*|${PREFIX}\\s?${NUMBER}(?:\\s?${U})*`,
  "giu"
);

const MONTHS =
  "জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর|January|February|March|April|May|June|July|August|September|October|November|December";
// A date must not run into a suffix ("২৯ অক্টোবরের"), or blanking it leaves "_____ের"
const DATE_RE = new RegExp(
  `(?:${NUMBER}\\s?(?:${MONTHS})(?:\\s?${NUMBER})?|(?:${MONTHS})\\s?${NUMBER}(?:,?\\s?${NUMBER})?)(?![\\p{L}\\p{M}])`,
  "giu"
);
const MONTH_RE = new RegExp(`(?:${MONTHS})`, "iu");

const trimSpan = (t: string) => t.trim().replace(/[.,]+$/, "");

// "সকাল সাড়ে ১০টা", "বেলা ১টা": a clock time, not a figure worth learning
const TIME_OF_DAY_BEFORE = /(?:সকাল|বেলা|দুপুর|বিকেল|বিকাল|সন্ধ্যা|রাত|ভোর|সাড়ে|সোয়া|পৌনে)\s*$/u;

function quantitiesIn(sentence: string): string[] {
  return [...sentence.matchAll(QUANTITY_RE)]
    .filter((m) => !(/টা$/u.test(m[0].trim()) && TIME_OF_DAY_BEFORE.test(sentence.slice(0, m.index).normalize("NFC"))))
    .map((m) => trimSpan(m[0]))
    .filter((q) => /[০-৯0-9]/.test(q));
}

function datesIn(sentence: string): string[] {
  return [...sentence.matchAll(DATE_RE)].map((m) => trimSpan(m[0]));
}

function words(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[\s,;:।()\[\]"'“”‘’\-–—|.?!]+/)
    .filter((w) => w.length >= 3);
}

// ---------------------------------------------------------------------------
// Facts
// ---------------------------------------------------------------------------

/** Up to 4 rows, each a quantity or date quoted from an article sentence. */
export function extractFacts(title: string, bodyText: string, avoid: string[] = []): FactRow[] {
  const isBn = /[ঀ-৿]/.test(title);
  const rows: FactRow[] = [];
  const usedValues = new Set<string>();
  const sentences = splitSentences(bodyText);
  // Sentences already shown as key points are not quoted a second time
  const skip = new Set(avoid.map((s) => s.replace(/\s+/g, " ").trim()));

  for (const s of sentences) {
    if (rows.length >= 4) break;
    if (skip.has(s)) continue;
    const date = datesIn(s)[0];
    const qty = quantitiesIn(s)[0];
    const value = qty || date;
    if (!value || usedValues.has(value)) continue;
    usedValues.add(value);
    rows.push({
      parameter: qty
        ? isBn ? "সংখ্যা ও পরিমাণ" : "Figure"
        : isBn ? "তারিখ" : "Date",
      value,
      relevance: s,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Takeaways
// ---------------------------------------------------------------------------

/** The article's own most informative sentences (max 3), in reading order. */
export function extractTakeaways(title: string, summary: string, bodyText: string): string[] {
  const titleWords = new Set(words(title));
  const sentences = splitSentences(bodyText);
  const summaryKey = summary.replace(/\s+/g, "").slice(0, 40);

  const scored = sentences.map((s, i) => {
    let score = 0;
    if (i < 3) score += 2 - i * 0.5; // lead sentences carry the news
    if (quantitiesIn(s).length || datesIn(s).length) score += 1.5;
    const overlap = words(s).filter((w) => titleWords.has(w)).length;
    score += Math.min(overlap, 4) * 0.5;
    if (s.length < 50) score -= 1;
    if (summaryKey && s.replace(/\s+/g, "").startsWith(summaryKey)) score -= 3; // already shown as summary
    if (/[?？]$/.test(s)) score -= 1;
    if (!standsAlone(s)) score -= 5; // needs the sentence before it to make sense
    return { s, i, score };
  });

  return scored
    .filter((x) => x.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
}

// ---------------------------------------------------------------------------
// Quiz (fill in the blank from a real sentence)
// ---------------------------------------------------------------------------

function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function numberDistractors(answer: string, others: string[], rand: () => number): string[] {
  const bengali = /[০-৯]/.test(answer);
  const m = toAsciiDigits(answer).match(/[0-9][0-9,]*(?:\.[0-9]+)?/);
  const pool = new Set<string>();
  // Other quantities with the same unit from the same article are the best distractors
  const unit = answer.replace(/[০-৯0-9,.\s$৳]/g, "");
  for (const o of others) if (o !== answer && o.replace(/[০-৯0-9,.\s$৳]/g, "") === unit) pool.add(o);
  if (m) {
    const raw = m[0];
    const n = Number(raw.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) {
      const isYear = n >= 1000 && n <= 2100 && !raw.includes(",");
      // The first number of a date is a day of the month: keep distractors to real days
      const ascii = toAsciiDigits(answer);
      const isDay = MONTH_RE.test(answer) && n >= 1 && n <= 31 && ascii.search(/[0-9]/) === ascii.indexOf(raw);
      // A percentage stays a possible percentage (never "123.6 per cent" for a pass rate)
      const isPercent = /%|শতাংশ|percent|per cent|pc\b/i.test(answer);
      const decimals = (raw.split(".")[1] || "").length;
      const candidates = isDay
        ? [n + 2, n - 3, n + 5, n - 1].map((d) => ((d - 1 + 28) % 28) + 1)
        : isYear
        ? [n - 1, n + 1, n - 2, n + 3]
        : isPercent
        ? [n - 10, n + 10, n - 5, n + 5, n - 15].map((c) => Number(c.toFixed(decimals))).filter((c) => c > 0 && c <= 100)
        : [n * 2, Math.round(n / 2), Math.round(n * 1.5), n + (n < 10 ? 2 : Math.round(n * 0.25))];
      for (const c of candidates) {
        if (!Number.isFinite(c) || c <= 0 || c === n) continue;
        const txt = raw.includes(",") ? c.toLocaleString("en-US") : isPercent && decimals ? c.toFixed(decimals) : String(c);
        pool.add(answer.replace(raw.replace(/[0-9]/g, (d) => (bengali ? BN_DIGITS[Number(d)] : d)), toScriptDigits(txt, bengali)));
      }
    }
  }
  const list = [...pool].filter((p) => p !== answer);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, 3);
}

/**
 * Build one fill-in-the-blank question from a sentence that contains a figure or
 * date. Returns null when the article has no such sentence; a missing quiz is
 * better than an unrelated one.
 */
export function buildExtractiveQuiz(title: string, bodyText: string): ExtractiveQuiz | null {
  const isBn = /[ঀ-৿]/.test(title);
  const sentences = splitSentences(bodyText);
  const allQuantities = sentences.flatMap((s) => [...quantitiesIn(s), ...datesIn(s)]);
  const rand = seededRandom(title);

  for (const s of sentences) {
    const answer = quantitiesIn(s)[0] || datesIn(s)[0];
    if (!answer) continue;
    if (s.split(answer).length !== 2) continue; // must blank exactly one place
    const distractors = numberDistractors(answer, allQuantities, rand);
    if (distractors.length < 3) continue;

    const options = [answer, ...distractors];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const blanked = s.replace(answer, "_____");
    return {
      question: isBn
        ? `প্রতিবেদন অনুযায়ী শূন্যস্থানে কোনটি বসবে?\n“${blanked}”`
        : `According to the report, what fills the blank?\n“${blanked}”`,
      options,
      correctOption: options.indexOf(answer),
      explanation: isBn ? `প্রতিবেদনের বাক্য: “${s}”` : `From the report: “${s}”`,
      sourceSentence: s,
    };
  }
  return null;
}
