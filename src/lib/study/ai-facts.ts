/**
 * AI summary + fact card for one story, made at crawl time from the publisher text.
 *
 * The AI only writes; this file decides what may be kept. Every number in the summary
 * must appear in the article, names and places must be found in it, the summary must be
 * in the story's language, the right length, in its own words (no long copied runs) and
 * free of filler. A failed summary is retried once with a stronger model; if that also
 * fails the story keeps the summary it already has. Students never see an unchecked answer.
 */
import { callGeminiJson, type GeminiResult } from "../ai/gemini";
import { splitSentences, quotesBalanced, standsAlone } from "./extractive";

export const GK_CATEGORIES = [
  "Bangladesh Affairs",
  "Politics & Governance",
  "Economy & Finance",
  "International Affairs",
  "Science & Technology",
  "Environment & Climate",
  "Health",
  "Education",
  "Law & Justice",
  "Appointments & Awards",
  "Sports",
  "Culture & Literature",
  "History & Heritage",
  "Other",
] as const;
export type GkCategory = (typeof GK_CATEGORIES)[number];

export type FactNumber = { label: string; value: string };
export type StoryFacts = {
  summary: string;
  who: string[];
  what: string;
  when: string;
  where: string;
  numbers: FactNumber[];
  gkCategory: GkCategory;
  examScore: number | null;
  /** Key points: up to 3 of the article's own sentences, picked by number, that make sense on their own */
  keyQuotes: string[];
};
export type Lang = "bn" | "en";

// Only the cheapest "lite" models, two of them so each has its own free limit and a busy
// one can hand over to the other. (The bigger Flash model has a much lower free limit.)
export const DEFAULT_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
// A summary may share at most this many words in a row with the article. Bengali news has
// long names and fixed phrases, so a shorter run rejected honest rewrites.
export const COPY_RUN = 12;
const MAX_INPUT_WORDS = 1200;
const MAX_OUTPUT_TOKENS = 700;

export const storyLang = (title: string): Lang => (/[ঀ-৿]/.test(title || "") ? "bn" : "en");

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const toAsciiDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/** Numbers as plain digit strings: Bengali digits and thousands commas removed, leading zeros dropped. */
export function numbersIn(s: string): string[] {
  const m = toAsciiDigits((s || "").normalize("NFC")).match(/\d+(?:[.,]\d+)*/g) || [];
  return m.map((n) => {
    const plain = n.replace(/,(?=\d{2,3}\b)/g, "").replace(/,/g, "");
    const [int, dec] = plain.split(".");
    const i = int.replace(/^0+(?=\d)/, "");
    return dec ? `${i}.${dec}` : i;
  });
}

/** Lower-cased words without punctuation, for name and copy checks. */
export function wordsOf(s: string): string[] {
  return toAsciiDigits((s || "").normalize("NFC").toLowerCase())
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .split(" ")
    .filter(Boolean);
}

const BN_SUFFIXES = ["দের", "য়ের", "য়ের", "ের", "এর", "র", "কে", "তে", "য়", "য়", "রা", "টি", "টা"];
const EN_SUFFIXES = ["'s", "s"];

/** A word is "in the source" if it, or it without a common case ending, appears there. */
function wordFound(word: string, source: string): boolean {
  if (source.includes(word)) return true;
  for (const suf of [...BN_SUFFIXES, ...EN_SUFFIXES]) {
    if (word.length > suf.length + 1 && word.endsWith(suf) && source.includes(word.slice(0, -suf.length))) return true;
  }
  return false;
}

/** Every word of a name (2+ letters) must be found in the article. */
export function nameFound(name: string, sourceWordsJoined: string): boolean {
  const ws = wordsOf(name).filter((w) => w.length >= 2);
  return ws.length > 0 && ws.every((w) => wordFound(w, sourceWordsJoined));
}

const FILLER = [
  /এই (প্রতিবেদন|নিবন্ধ|লেখা|খবর)(ে|টিতে|টি)/,
  /প্রতিবেদনটিতে/,
  /নিবন্ধটি/,
  /\bthis (article|report|story|piece)\b/i,
  /\bthe (article|report) (says|states|discusses|describes|highlights)\b/i,
  /\bin (this|the) article\b/i,
  /as an ai\b/i,
];

const LETTERS_BN = /[ঀ-৿]/g;
const LETTERS_LATIN = /[A-Za-z]/g;

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------
export type CheckResult = { ok: boolean; problems: string[]; facts: StoryFacts | null };

/**
 * Check an AI answer against the article. Problems in the summary reject the whole answer;
 * a fact-card field that fails is dropped (and noted) instead.
 */
export function checkFacts(raw: unknown, article: { title: string; body: string }, lang: Lang, sentences: string[] = []): CheckResult {
  const problems: string[] = [];
  if (!raw || typeof raw !== "object") return { ok: false, problems: ["answer is not an object"], facts: null };
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.normalize("NFC").replace(/\s+/g, " ").trim() : "");

  const sourceText = `${article.title}\n${article.body}`.normalize("NFC");
  const sourceNums = new Set(numbersIn(sourceText));
  const sourceWords = wordsOf(sourceText);
  const sourceJoined = ` ${sourceWords.join(" ")} `;
  const numsOk = (s: string) => numbersIn(s).every((n) => sourceNums.has(n));

  // --- summary (fatal) ---
  const summary = str(r.summary);
  const words = summary.split(" ").filter(Boolean);
  if (words.length < 25) problems.push(`summary too short (${words.length} words)`);
  if (words.length > 95) problems.push(`summary too long (${words.length} words)`);
  const bn = (summary.match(LETTERS_BN) || []).length;
  const la = (summary.match(LETTERS_LATIN) || []).length;
  if (lang === "bn" && bn < 0.75 * (bn + la)) problems.push("summary is not in Bengali");
  if (lang === "en" && la < 0.95 * (bn + la)) problems.push("summary is not in English");
  if (!/[।.!?]["'”’)]*$/.test(summary)) problems.push("summary does not end with a full sentence");
  if (FILLER.some((re) => re.test(summary))) problems.push("summary has filler wording");
  const badNums = numbersIn(summary).filter((n) => !sourceNums.has(n));
  if (badNums.length) problems.push(`summary has numbers not in the article: ${badNums.join(", ")}`);
  const sw = wordsOf(summary);
  const RUN = COPY_RUN;
  for (let i = 0; i + RUN <= sw.length; i++) {
    if (sourceJoined.includes(` ${sw.slice(i, i + RUN).join(" ")} `)) {
      problems.push("summary copies the article word for word");
      break;
    }
  }
  if (problems.length) return { ok: false, problems, facts: null };

  // --- fact card (fields that fail are dropped) ---
  const who = (Array.isArray(r.who) ? r.who : []).map(str).filter(Boolean).slice(0, 6);
  const whoKept = who.filter((n) => nameFound(n, sourceJoined));
  if (whoKept.length < who.length) problems.push(`dropped names not in the article: ${who.filter((n) => !whoKept.includes(n)).join(", ")}`);

  let what = str(r.what);
  if (what && !numsOk(what)) {
    problems.push("dropped 'what': number not in the article");
    what = "";
  }
  // A date must hold a number ("৭ নভেম্বর", "2026"); "today" or "Sunday" means nothing a week later
  let when = str(r.when);
  if (when && !numbersIn(when).length) {
    problems.push("dropped 'when': no actual date");
    when = "";
  } else if (when && !numsOk(when)) {
    problems.push("dropped 'when': date not in the article");
    when = "";
  }
  let where = str(r.where);
  if (where && !where.split(/[,،;]| ও | and /).map((p) => p.trim()).filter(Boolean).every((p) => nameFound(p, sourceJoined))) {
    problems.push("dropped 'where': place not in the article");
    where = "";
  }
  const numbers: FactNumber[] = [];
  for (const n of Array.isArray(r.numbers) ? r.numbers.slice(0, 5) : []) {
    const label = str((n as FactNumber)?.label);
    const value = str((n as FactNumber)?.value);
    if (!label || !value) continue;
    if (!numbersIn(value).length || !numsOk(value)) {
      problems.push(`dropped figure not in the article: ${value}`);
      continue;
    }
    numbers.push({ label, value });
  }

  const cat = str(r.gkCategory);
  const gkCategory = (GK_CATEGORIES as readonly string[]).includes(cat) ? (cat as GkCategory) : "Other";
  const score = typeof r.examScore === "number" ? Math.round(r.examScore) : Number.NaN;
  const examScore = score >= 1 && score <= 10 ? score : null;

  // Key points are the article's own sentences, chosen by their number: verbatim by construction
  const picks = (Array.isArray(r.keyQuotes) ? r.keyQuotes : [])
    .map((n) => (typeof n === "number" ? Math.round(n) : Number.NaN))
    .filter((n, i, all) => Number.isInteger(n) && n >= 1 && n <= sentences.length && all.indexOf(n) === i)
    // A pick that leans on an earlier sentence ("this", "he", "therefore") is skipped; spares fill in
    .filter((n) => quotesBalanced(sentences[n - 1]) && standsAlone(sentences[n - 1]))
    .slice(0, 3)
    .sort((a, b) => a - b);
  const keyQuotes = picks.map((n) => sentences[n - 1]);
  if (Array.isArray(r.keyQuotes) && r.keyQuotes.length && keyQuotes.length < Math.min(3, r.keyQuotes.length)) {
    problems.push("dropped key-point numbers that were out of range or repeated");
  }

  return { ok: true, problems, facts: { summary, who: whoKept, what, when, where, numbers, gkCategory, examScore, keyQuotes } };
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
export function trimBody(body: string, maxWords = MAX_INPUT_WORDS): string {
  const ws = (body || "").replace(/\s+/g, " ").trim().split(" ");
  return ws.length <= maxWords ? ws.join(" ") : ws.slice(0, maxWords).join(" ") + " …";
}

export function systemPrompt(lang: Lang): string {
  const language = lang === "bn" ? "Bengali (বাংলা)" : "English";
  return [
    "You prepare study material for Bangladeshi students preparing for BCS, bank-job and university admission exams (and IELTS for English stories).",
    `Write every text field in ${language}, the language of the article.`,
    "Use ONLY facts stated in the article. Never add outside knowledge, guesses or opinions.",
    "Copy numbers, dates, names and places exactly as the article writes them (same digits and spelling). Do not convert relative dates such as 'yesterday' into a date; leave 'when' empty if the article gives no date.",
    "summary: 2-3 complete sentences, 50-70 words, in your own words (do not copy sentences from the article). Say what happened, who was involved, and why it matters. No phrases like 'this article' or 'the report says'.",
    "who: up to 5 key people, organisations or countries, written as in the article.",
    "what: one short sentence with the main event or decision.",
    "when: the date or period as written in the article, or empty.",
    "where: the main place(s) as written in the article, or empty.",
    "numbers: up to 4 important figures, each with a short label; value must contain the figure as written.",
    "gkCategory: the best category from the allowed list.",
    "keyQuotes: the NUMBERS of up to 4 article sentences (best first) most useful for exam revision that make complete sense on their own: they name the people and things (not just 'he', 'this', 'the same'), and they are about the main event of the headline, not background about a different time or event. Never pick a sentence that starts with a word pointing back (this, that, he, she, so, however; এই, সেই, তিনি, সুতরাং, তবে). Fewer if fewer qualify.",
    "examScore: 1-10, how likely this is to be asked in a BCS, bank or admission exam. 9-10: national budget or policy, laws, international agreements, appointments to top posts, awards, records and firsts. 5-8: notable national or international events with lasting facts. 3-6: history features, human-interest and explainer stories. 1-4: local crime, accidents, entertainment, opinion.",
  ].join("\n");
}

export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    who: { type: "ARRAY", items: { type: "STRING" } },
    what: { type: "STRING" },
    when: { type: "STRING" },
    where: { type: "STRING" },
    numbers: {
      type: "ARRAY",
      items: { type: "OBJECT", properties: { label: { type: "STRING" }, value: { type: "STRING" } }, required: ["label", "value"] },
    },
    gkCategory: { type: "STRING", enum: [...GK_CATEGORIES] },
    examScore: { type: "INTEGER" },
    keyQuotes: { type: "ARRAY", items: { type: "INTEGER" } },
  },
  required: ["summary", "who", "what", "when", "where", "numbers", "gkCategory", "examScore", "keyQuotes"],
};

// ---------------------------------------------------------------------------
// Cascade: cheap model first, a stronger one only if needed
// ---------------------------------------------------------------------------
export type FactsOutcome = {
  status: "ok" | "failed";
  model: string | null;
  facts: StoryFacts | null;
  problems: string[];
  calls: number;
  tokensIn: number;
  tokensOut: number;
  /** Failed only because Google was busy or over its limit: worth one more try later */
  retryLater?: boolean;
};

type Caller = (opts: Parameters<typeof callGeminiJson>[0]) => Promise<GeminiResult>;

export function modelsFromEnv(): string[] {
  const list = (process.env.AI_MODELS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : DEFAULT_MODELS;
}

export async function generateFacts(
  article: { title: string; body: string },
  opts: { models?: string[]; maxCalls?: number; call?: Caller; busyWaitMs?: number } = {}
): Promise<FactsOutcome> {
  const lang = storyLang(article.title);
  const models = opts.models ?? modelsFromEnv();
  const call = opts.call ?? callGeminiJson;
  const maxCalls = opts.maxCalls ?? models.length + 1;
  const busyWaitMs = opts.busyWaitMs ?? 8000;
  const out: FactsOutcome = { status: "failed", model: null, facts: null, problems: [], calls: 0, tokensIn: 0, tokensOut: 0 };
  const body = trimBody(article.body);
  if (body.split(" ").length < 60) {
    out.problems.push("article text too short");
    return out;
  }
  // The article as numbered sentences, so key points can be picked by number (exact text)
  const sentences = splitSentences(body);
  const user = `Title: ${article.title}\n\nArticle (numbered sentences):\n${sentences.map((s, i) => `[${i + 1}] ${s}`).join("\n")}`;

  // After a copied summary, the next model is told to rewrite in its own words
  let hint = "";
  let answered = false;

  let busyRetried = false;
  for (const model of models) {
    if (out.calls >= maxCalls) break;
    out.calls++;
    const ask = () => call({ model, system: systemPrompt(lang), user: user + hint, schema: RESPONSE_SCHEMA, maxOutputTokens: MAX_OUTPUT_TOKENS });
    let res = await ask();
    // Free tier "busy" (503/429): wait and try the same model once more, once per story
    if (!res.ok && res.retryable && !busyRetried && out.calls < maxCalls) {
      busyRetried = true;
      out.problems.push(`${model}: ${res.error} (retried)`);
      if (busyWaitMs) await new Promise((r) => setTimeout(r, busyWaitMs));
      out.calls++;
      res = await ask();
    }
    if (!res.ok) {
      out.problems.push(`${model}: ${res.error}`);
      if (!res.retryable) break;
      continue;
    }
    answered = true;
    out.tokensIn += res.tokensIn;
    out.tokensOut += res.tokensOut;
    let parsed: unknown;
    try {
      parsed = JSON.parse(res.text);
    } catch {
      out.problems.push(`${model}: answer is not valid JSON`);
      continue;
    }
    // The checks run on the full article text, not the trimmed copy sent to the AI
    const checked = checkFacts(parsed, article, lang, sentences);
    if (checked.ok && checked.facts) {
      return { ...out, status: "ok", model, facts: checked.facts, problems: [...out.problems, ...checked.problems] };
    }
    out.problems.push(...checked.problems.map((p) => `${model}: ${p}`));
    if (checked.problems.some((p) => p.includes("copies"))) {
      hint =
        "\n\nIMPORTANT: an earlier answer copied sentences from the article. Write every sentence of the summary completely in your own words; keep names and numbers as written.";
    }
  }
  // No model answered at all (all busy, over the limit or timed out): try this story again later
  out.retryLater = !answered && out.calls > 0 && !out.problems.some((p) => /not set|HTTP 40[0-4]/.test(p));
  return out;
}
