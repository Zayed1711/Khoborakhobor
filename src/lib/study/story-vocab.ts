/**
 * Story vocabulary for English Learning: five less common words picked from the story's
 * own reading passage, each shown with the sentence it is used in (contextual learning,
 * not a fixed list). Meanings come from the Free Dictionary API (open Wiktionary data);
 * a word without a real dictionary entry is skipped, never padded with filler. The
 * meaning shown is the sense that fits the story's sentence.
 */
import { isCommonWord, baseForms } from "./common-words";

export const VOCAB_COUNT = 5;
const CANDIDATES = 10;

export interface VocabCandidate {
  word: string; // as it appears in the passage (lower case)
  sentence: string; // the passage sentence it is used in
}

const ACADEMIC = /(?:tion|sion|ment|ity|ous|ive|ance|ence|ism|ist|ate|ify|ise|ize|ical|ible|able|ary|ory|ure|ial|ent|ant)$/;
// Words that are long but carry no learning value in news text
const SKIP = new Set(["percent", "thousand", "million", "billion", "yesterday", "tomorrow", "november", "december", "september", "october", "february", "january", "however", "although", "including", "according", "therefore", "following", "whatever", "whenever", "somewhere", "something", "everyone", "everything"]);

/**
 * Candidates in order of learning value: academic-looking and longer words first. Names
 * (only ever written with a capital) and everyday words are left out; only one word
 * per root ("detained" / "detention").
 */
export function pickVocabCandidates(sentences: string[], title = ""): VocabCandidate[] {
  const lowerSeen = new Map<string, string>(); // word -> first sentence where it is written in lower case
  for (const s of sentences) {
    for (const m of s.matchAll(/\b[a-z][a-z]+\b/g)) {
      const w = m[0];
      if (!lowerSeen.has(w)) lowerSeen.set(w, s);
    }
  }
  const titleWords = new Set(title.toLowerCase().split(/[^a-z]+/));
  const scored = [...lowerSeen.entries()]
    .filter(([w]) => (w.length >= 7 || (w.length >= 6 && ACADEMIC.test(w))) && !SKIP.has(w) && !isCommonWord(w))
    .map(([w, s]) => ({ word: w, sentence: s, score: Math.min(w.length, 12) + (ACADEMIC.test(w) ? 4 : 0) + (titleWords.has(w) ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));

  const roots = new Set<string>();
  const out: VocabCandidate[] = [];
  for (const c of scored) {
    const root = c.word.slice(0, 5); // "blockade" / "blocked" / "blocking" are one family
    if (roots.has(root)) continue;
    roots.add(root);
    out.push({ word: c.word, sentence: c.sentence });
    if (out.length >= CANDIDATES) break;
  }
  return out;
}

export interface WordMeaning {
  word: string; // dictionary form that was found
  pos: string; // part of speech, in English ("noun")
  definition: string; // English definition (the sense that fits the story)
  synonyms: string[];
  phonetic: string; // IPA, e.g. "/blɒˈkeɪd/"
}

const POS_BN: Record<string, string> = {
  noun: "বিশেষ্য (Noun)",
  verb: "ক্রিয়া (Verb)",
  adjective: "বিশেষণ (Adjective)",
  adverb: "ক্রিয়া-বিশেষণ (Adverb)",
};
export const posLabel = (pos: string) => POS_BN[pos] || "শব্দ (Word)";

// Entries that only point to another form ("Plural of …") are not a meaning to learn
const POINTER = /^(?:plural of|past tense of|simple past|present participle of|third-person singular|alternative (?:form|spelling) of|obsolete|misspelling of)/i;
const FILLER = new Set("the a an of to in on at by for with from as is are was were be been or and that this which who its their his her it".split(" "));
const contentWords = (t: string) => new Set(t.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !FILLER.has(w)));

// Words that can follow a noun (so the word before them is not an adjective)
const LINKERS = new Set(
  "of in on at by for with from to and or but that which who as than into over under after before during is are was were has have had will would can could may might should must did do does been".split(" ")
);

/** The part of speech the word has in its sentence, guessed from its neighbours and ending. */
export function guessPos(written: string, sentence: string): string | null {
  const m = sentence.toLowerCase().match(new RegExp(`(?:^|\\W)(\\w+)?(\\W*)\\b${written}\\b\\s*([a-z]+)?`));
  const before = m?.[1] || "";
  const comma = (m?.[2] || "").includes(",");
  const after = m?.[3] || "";
  const determiner = /^(?:the|a|an|their|his|her|its|our|this|that|these|those|some|any|every|each|such)$/.test(before);
  if (determiner && after && !LINKERS.has(after)) return "adjective"; // "a valuable contribution"
  if (determiner) return "noun";
  if (/ly$/.test(written)) return "adverb";
  if (/^(?:will|would|can|could|may|might|must|should|has|have|had|was|were|been|be|is|are|being|to)$/.test(before)) return "verb";
  if (/ed$/.test(written)) return "verb"; // "it intercepted", "were deployed"
  if (/ing$/.test(written)) return "verb"; // "…, chasing down a target", "Hodge guiding them"
  return null;
}

// A few topic hints, so a sense written in general words can still match the story
const HINTS: Record<string, string[]> = {
  crime: ["murder", "killing", "killed", "charged", "accused", "arrest", "arrested", "police", "court", "theft", "robbery", "case", "jail", "prison"],
  military: ["troops", "soldiers", "army", "platoons", "deployed", "missile", "missiles", "drone", "attack", "attacks", "forces"],
  money: ["loan", "loans", "bank", "funds", "taka", "price", "prices", "billion", "million", "salary", "wage", "wages"],
  rebellion: ["uprising", "revolt", "protest", "protests", "movement", "regime"],
  sport: ["match", "wicket", "wickets", "goal", "goals", "league", "team", "innings", "runs", "score", "pitch", "bowler", "batsman", "cricket", "football"],
};
function withHints(words: Set<string>): Set<string> {
  const out = new Set(words);
  for (const [topic, cues] of Object.entries(HINTS)) if (cues.some((c) => words.has(c))) out.add(topic);
  return out;
}

type Entry = { phonetic?: string; phonetics?: { text?: string }[]; meanings?: { partOfSpeech?: string; synonyms?: string[]; definitions?: { definition?: string; synonyms?: string[] }[] }[] };

/**
 * Read one Free Dictionary API answer. Of all its senses, the one that fits the story's
 * sentence is chosen: the right part of speech, and words shared with the sentence
 * ("abetting murder" -> the sense about crime); otherwise the first, most common sense.
 */
export function readDictionaryEntry(data: unknown, form: string, sentence = "", written = form): WordMeaning | null {
  if (!Array.isArray(data) || !data.length) return null;
  const self = form.slice(0, 5);
  // Topic hints come from the whole sentence (the word itself included); shared words exclude the word
  const ctx = new Set([...withHints(contentWords(sentence))].filter((w) => !w.startsWith(self) || Object.hasOwn(HINTS, w)));
  const pos = sentence ? guessPos(written, sentence) : null;
  let best: { score: number; m: WordMeaning } | null = null;
  let meaningIndex = 0;
  for (const entry of data as Entry[]) {
    const phonetic = entry.phonetic || (entry.phonetics || []).find((p) => p.text)?.text || "";
    for (const m of entry.meanings || []) {
      meaningIndex += 1;
      let defIndex = 0;
      for (const d of (m.definitions || []).slice(0, 4)) {
        const text = (d.definition || "").trim();
        if (!text || POINTER.test(text)) continue;
        const shared = [...withHints(contentWords(text))].filter((w) => !w.startsWith(self) && (ctx.has(w) || [...ctx].some((c) => c.length > 5 && w.length > 5 && c.slice(0, 5) === w.slice(0, 5)))).length;
        // The first senses are the common ones: a later sense must share words with the story to win
        // Earlier senses (of each part of speech) are the common ones
        const score = shared * 2 + (pos && m.partOfSpeech === pos ? 3.5 : 0) - defIndex * 0.7 - (meaningIndex - 1) * 0.5;
        defIndex += 1;
        if (!best || score > best.score) {
          const synonyms = [...new Set([...(d.synonyms || []), ...(m.synonyms || [])])].filter((x) => /^[a-z][a-z -]+$/i.test(x) && x.toLowerCase() !== form).slice(0, 4);
          best = { score, m: { word: form, pos: m.partOfSpeech || "", definition: text, synonyms, phonetic } };
        }
      }
    }
  }
  return best ? best.m : null;
}

/** found = a real meaning; none = the dictionary has no entry; error = it could not be asked (try again later) */
export type LookupResult = { status: "found"; meaning: WordMeaning } | { status: "none" } | { status: "error" };

/**
 * Look a word up in the Free Dictionary API. When the form in the story has no entry of
 * its own, one base form is tried ("deployed" -> "deploy").
 */
export async function lookupWord(word: string, sentence = ""): Promise<LookupResult> {
  const inflected = /(?:s|ed|ing)$/.test(word);
  const bases = baseForms(word).filter((f) => f !== word && f.length >= 4);
  // The base word has the normal meanings ("approved" -> "approve"); the form itself is the fallback
  const forms = inflected ? [...bases.reverse(), word].slice(-3) : [word];
  for (const form of forms) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(form)}`, { signal: AbortSignal.timeout(5000) });
      if (res.status === 404) continue;
      if (!res.ok) return { status: "error" }; // busy or down: do not treat as "no word"
      const found = readDictionaryEntry(await res.json(), form, sentence, word);
      if (found) return { status: "found", meaning: found };
    } catch {
      return { status: "error" };
    }
  }
  return { status: "none" };
}

/**
 * Up to five words with real meanings, looked up three at a time in order of learning
 * value. `complete` is false when the dictionary could not be asked about some word, so
 * the caller can try again later instead of saving an incomplete list for good.
 */
export async function findStoryVocabulary(candidates: VocabCandidate[], lookup: (w: string, s: string) => Promise<LookupResult> = lookupWord) {
  const found: (WordMeaning & { sentence: string; asWritten: string })[] = [];
  let complete = true;
  for (let i = 0; i < candidates.length && found.length < VOCAB_COUNT; i += 3) {
    const batch = candidates.slice(i, i + 3);
    const results = await Promise.all(batch.map((c) => lookup(c.word, c.sentence).catch((): LookupResult => ({ status: "error" }))));
    results.forEach((r, j) => {
      if (r.status === "error") complete = false;
      if (r.status === "found" && found.length < VOCAB_COUNT && !found.some((f) => f.word === r.meaning.word))
        found.push({ ...r.meaning, sentence: batch[j].sentence, asWritten: batch[j].word });
    });
  }
  return { found, complete: complete || found.length >= VOCAB_COUNT };
}
