import { describe, expect, it } from "vitest";
import { findStoryVocabulary, pickVocabCandidates, readDictionaryEntry, type LookupResult } from "@/lib/study/story-vocab";
import { isCommonWord } from "@/lib/study/common-words";

const passage = [
  "Bournemouth extended their perfect Europa League record on Thursday as they came from behind to win at Sparta Prague.",
  "Palace sit in the Premier League's relegation zone, just behind Manchester United on goal difference.",
  "Police said the workers were deployed after the blockade, and officials embezzled funds meant for the project.",
  "The minister announced the government would increase the budget for schools.",
];

describe("story vocabulary: words from the story itself", () => {
  const picks = pickVocabCandidates(passage, "Bournemouth stay perfect in Europa League");
  const words = picks.map((p) => p.word);

  it("picks less common words from the passage", () => {
    expect(words).toEqual(expect.arrayContaining(["relegation", "embezzled", "blockade"]));
  });

  it("skips everyday news words and names", () => {
    for (const w of ["minister", "government", "budget", "schools", "police", "workers", "increase", "announced"]) expect(words).not.toContain(w);
    for (const name of ["bournemouth", "manchester", "palace", "prague"]) expect(words).not.toContain(name);
  });

  it("keeps the sentence each word is used in", () => {
    const r = picks.find((p) => p.word === "relegation");
    expect(r?.sentence).toContain("relegation zone");
  });

  it("never repeats the fixed list (inflation, accountability…) when the story does not use them", () => {
    for (const w of ["inflation", "accountability", "resilience", "sovereignty"]) expect(words).not.toContain(w);
  });

  it("knows common words, also in other forms", () => {
    expect(isCommonWord("workers")).toBe(true);
    expect(isCommonWord("announced")).toBe(true);
    expect(isCommonWord("relegation")).toBe(false);
  });

  it("takes at most five words that have a real meaning, best first", async () => {
    const fake = async (w: string): Promise<LookupResult> =>
      w === "blockade" ? { status: "none" } : { status: "found", meaning: { word: w, pos: "noun", definition: `meaning of ${w}`, synonyms: [], phonetic: "" } };
    const { found, complete } = await findStoryVocabulary(picks, fake);
    expect(complete).toBe(true);
    expect(found.length).toBeLessThanOrEqual(5);
    expect(found.map((f) => f.word)).not.toContain("blockade"); // no dictionary entry: skipped, not invented
    expect(found[0].sentence.length).toBeGreaterThan(20);
  });

  it("a dictionary that cannot be reached is not taken as 'no words'", async () => {
    const { found, complete } = await findStoryVocabulary(picks, async () => ({ status: "error" }));
    expect(found).toEqual([]);
    expect(complete).toBe(false); // so nothing is saved and the next view tries again
  });

  it("reads a dictionary answer and skips 'plural of…' pointers", () => {
    const entry = [{ phonetic: "/blɒˈkeɪd/", meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "Plural of blockade." }, { definition: "The blocking of a place.", synonyms: ["siege"] }] }] }];
    expect(readDictionaryEntry(entry, "blockade")).toEqual({ word: "blockade", pos: "noun", definition: "The blocking of a place.", synonyms: ["siege"], phonetic: "/blɒˈkeɪd/" });
    expect(readDictionaryEntry({ title: "No Definitions Found" }, "zzz")).toBeNull();
  });

  it("chooses the sense that fits the story's sentence", () => {
    const abet = [{ meanings: [{ partOfSpeech: "verb", definitions: [{ definition: "To urge on, stimulate (a person to do) something desirable." }, { definition: "To assist or encourage someone in committing a crime, such as murder." }] }] }];
    expect(readDictionaryEntry(abet, "abetting", "He was charged with abetting murder in the case.")?.definition).toContain("crime");
    const rise = [{ meanings: [{ partOfSpeech: "verb", definitions: [{ definition: "To rise; to get up." }] }, { partOfSpeech: "noun", definitions: [{ definition: "A rebellion or revolt against authority." }] }] }];
    expect(readDictionaryEntry(rise, "uprising", "Killings during the uprising were investigated.")?.pos).toBe("noun");
  });
});

import { guessPos } from "@/lib/study/story-vocab";

describe("part of speech in the story's sentence", () => {
  it.each([
    ["valuable", "John Campbell also made a valuable contribution with 49.", "adjective"],
    ["intercepted", "The coalition said it intercepted and destroyed a drone.", "verb"],
    ["chasing", "West Indies won on Saturday, chasing down a target of 170.", "verb"],
    ["blockade", "As a result of the blockade, the gates were closed.", "noun"],
    ["deployed", "Five platoons have been deployed to the area.", "verb"],
  ])("%s → %s", (word, sentence, pos) => {
    expect(guessPos(word, sentence)).toBe(pos);
  });
});
