import { prisma } from "@/lib/prisma";
import type { VocabularyTableRow } from "@/lib/vocabulary-table-engine";
import { findStoryVocabulary, pickVocabCandidates, posLabel } from "@/lib/study/story-vocab";

/**
 * Story vocabulary rows are saved once per story (as VocabularyTerm rows marked with this
 * version), so the dictionary is asked only the first time a story is opened.
 */
const VOCAB_VERSION = "story-vocab-v1";

interface Stored {
  v: string;
  /** Which passage the words were picked from (so a new passage gets new words) */
  key?: string;
  pos: string;
  definition: string;
  synonyms: string[];
  phonetic: string;
  none?: boolean;
}

const parse = (s: string): Stored | null => {
  try {
    const v = JSON.parse(s);
    return v && v.v === VOCAB_VERSION ? v : null;
  } catch {
    return null;
  }
};

/** A short fingerprint of the passage text. */
function passageKey(passage: string[]): string {
  let h = 2166136261;
  for (const c of passage.join(" ")) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36);
}

function toRow(t: { id: string; term: string; context: string | null }, d: Stored): VocabularyTableRow {
  const word = t.term;
  return {
    id: t.id,
    word: word.charAt(0).toUpperCase() + word.slice(1),
    // The dictionary's own pronunciation (IPA); a letter-by-letter Bengali spelling would mislead
    banglaPhonetic: d.phonetic,
    partOfSpeech: posLabel(d.pos),
    banglaMeaning: "",
    englishDefinition: d.definition,
    synonyms: d.synonyms,
    freshExampleEn: t.context || "",
    freshExampleBn: "",
  };
}

/**
 * The five words for an English story, from its reading passage. Built on first view and
 * saved; later views read the saved rows. When the passage has no suitable word, a marker
 * row is saved so the dictionary is not asked again on every view.
 */
export async function ensureStoryVocabulary(articleId: string, passage: string[], title: string): Promise<VocabularyTableRow[]> {
  const existing = await prisma.vocabularyTerm.findMany({ where: { articleId }, orderBy: { createdAt: "asc" } });
  const mine = existing.map((t) => ({ t, d: parse(t.definition) })).filter((x): x is { t: (typeof existing)[number]; d: Stored } => x.d !== null);
  const key = passageKey(passage);
  if (mine.length && mine.every((x) => x.d.key === key)) return mine.filter((x) => !x.d.none).map((x) => toRow(x.t, x.d));
  if (!passage.length) return mine.filter((x) => !x.d.none).map((x) => toRow(x.t, x.d));
  // The passage changed (e.g. the real article opening replaced the summary): retire the old
  // words (kept, so words students saved to their word bank stay) and pick again
  for (const x of mine) {
    await prisma.vocabularyTerm.update({ where: { id: x.t.id }, data: { definition: JSON.stringify({ ...x.d, v: "story-vocab-retired" }) } });
  }

  const { found: words, complete } = await findStoryVocabulary(pickVocabCandidates(passage, title));
  // The dictionary could not be asked about some words: show what was found, save nothing,
  // and try again on the next view
  if (!complete) return words.map((w, i) => toRow({ id: `tmp-${i}`, term: w.asWritten, context: w.sentence }, { v: VOCAB_VERSION, pos: w.pos, definition: w.definition, synonyms: w.synonyms, phonetic: w.phonetic }));
  if (!words.length) {
    // Saved so the next view does not ask again; never shown
    await prisma.vocabularyTerm.create({ data: { articleId, term: "", definition: JSON.stringify({ v: VOCAB_VERSION, key, none: true, pos: "", definition: "", synonyms: [], phonetic: "" }), context: null } });
    return [];
  }
  const rows = [];
  for (const w of words) {
    const d: Stored = { v: VOCAB_VERSION, key, pos: w.pos, definition: w.definition, synonyms: w.synonyms, phonetic: w.phonetic };
    const t = await prisma.vocabularyTerm.create({ data: { articleId, term: w.asWritten, definition: JSON.stringify(d), context: w.sentence } });
    rows.push(toRow(t, d));
  }
  return rows;
}
