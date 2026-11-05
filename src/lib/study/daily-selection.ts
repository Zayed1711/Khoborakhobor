/**
 * The daily selection: instead of every crawled story (60+ a day), readers get
 * "জরুরি ১০" (the ten most useful stories for exam preparation) plus up to 20 more.
 *
 * Everything here is rule-based and runs for free:
 *   1. Window: the 24 hours before the newest story (a stalled crawler never empties the feed).
 *   2. Duplicates: the same story saved twice (live-update pages, two feeds) is kept once.
 *   3. Score: exam value of the topic + how much real study material the story has
 *      - crime/accident noise.
 *   4. Variety: at most 3 stories from one category among the ten.
 */

import type { FeedCard } from "@/lib/feed-card";

const nfc = (s: string) => (s || "").normalize("NFC");

export const URGENT_COUNT = 10;
export const MORE_COUNT = 20;
const MAX_PER_CATEGORY_URGENT = 3;
const MAX_PER_CATEGORY_MORE = 6;
// A word in 3+ of the day's headlines marks a running topic (e.g. each board's HSC
// result); at most 2 stories per running topic go into the ten
const HOT_WORD_MIN_HEADLINES = 3;
const MAX_PER_TOPIC_URGENT = 2;
const GENERIC_WORDS = new Set(
  ["সরকার", "বাংলাদেশ", "দেশ", "নতুন", "ঢাকা", "কেন", "কী", "কত", "বছর", "মধ্যে", "দিন", "আজ", "প্রথম", "যেভাবে", "কীভাবে", "নিয়ে", "দাবি", "বললেন", "জানালেন"].map(nfc)
);
const WINDOW_MS = 24 * 3600 * 1000;

export type DailyTier = "urgent" | "more";
export type RankedCard = FeedCard & { dailyTier: DailyTier; dailyRank: number };


// Topic weight by category: what BCS / admission / job exams ask about most
const CATEGORY_WEIGHT: Record<string, number> = {
  "exam-prep": 3,
  economy: 3,
  politics: 2.5,
  world: 2.5,
  national: 2,
  tech: 2.5,
  opinion: 1,
  lifestyle: 1,
  sports: 0.5,
  entertainment: 0.5,
};

// Signals that a story carries exam-worthy facts, one group per syllabus area
// (BCS / bank / admission GK, current affairs, ICT and general science)
const EXAM_SIGNALS = [
  // Bangladesh affairs: state, constitution, law
  /সংবিধান|সংশোধনী|অধ্যাদেশ|প্রজ্ঞাপন|গেজেট|নীতিমালা|আইন পাস|নির্বাচন কমিশন|মন্ত্রিসভা|সংসদ|সুপ্রিম কোর্ট|হাইকোর্ট|রাষ্ট্রপতি|প্রধান উপদেষ্টা|প্রধানমন্ত্রী/,
  // Economic survey, budget, fiscal policy
  /বাজেট|রাজস্ব|এনবিআর|অর্থনৈতিক সমীক্ষা|জিডিপি|প্রবৃদ্ধি|মাথাপিছু আয়|ভর্তুকি|রাজস্বনীতি|মজুরি বোর্ড/,
  // Monetary policy, central banking, financial institutions, capital market
  /বাংলাদেশ ব্যাংক|মুদ্রানীতি|নীতি সুদহার|সুদহার|মূল্যস্ফীতি|রিজার্ভ|খেলাপি ঋণ|ব্যাংক একীভূত|পুঁজিবাজার|শেয়ারবাজার|বিএসইসি|ডিএসই|বন্ড|ট্রেজারি|তরঙ্গ/,
  // Export-import, remittance
  /রপ্তানি|আমদানি|প্রবাসী আয়|রেমিট্যান্স|বাণিজ্য ঘাটতি|লেনদেন ভারসাম্য|শুল্ক|এলসি/,
  // Mega projects, national achievements
  /মেগাপ্রকল্প|পদ্মা সেতু|মেট্রোরেল|টানেল|রূপপুর|মাতারবাড়ী|একনেক|উন্নয়ন প্রকল্প|এলডিসি|স্বীকৃতি|বিদ্যুৎ|জ্বালানি|এলএনজি/,
  // National security, foreign relations
  /কূটনৈতিক|দ্বিপক্ষীয়|পররাষ্ট্র|রোহিঙ্গা|সীমান্ত|সমুদ্রসীমা|ব্লু ইকোনমি|সফর/,
  // International organisations and regional alliances
  /জাতিসংঘ|নিরাপত্তা পরিষদ|ইউনেসকো|ডব্লিউএইচও|ডব্লিউটিও|আইএমএফ|বিশ্বব্যাংক|এডিবি|এআইআইবি|ন্যাটো|ইইউ|ইউরোপীয় ইউনিয়ন|আসিয়ান|সার্ক|বিমসটেক|ব্রিকস|জি-?৭|জি-?২০|ওআইসি|কোয়াড|এসসিও/,
  // Treaties, summits, global environment
  /চুক্তি|সমঝোতা স্মারক|সম্মেলন|কপ-?[০-৯]|জলবায়ু|কার্বন|প্যারিস/,
  // Geopolitics, flashpoints, defence, cyber, crypto
  /যুদ্ধবিরতি|নিষেধাজ্ঞা|প্রতিরক্ষা|পরমাণু|পারমাণবিক|সাইবার|গোয়েন্দা|গাজা|ইউক্রেন|তাইওয়ান|দক্ষিণ চীন সাগর|কাশ্মীর|ক্রিপ্টো|বিটকয়েন|মধ্যবর্তী নির্বাচন/,
  // ICT: AI, innovation, internet, computing
  /কৃত্রিম বুদ্ধিমত্তা|এআই|চ্যাটজিপিটি|সেমিকন্ডাক্টর|চিপ|কোয়ান্টাম|ইন্টারনেট|৫জি|ফাইভ-?জি|স্যাটেলাইট|প্রোটোকল|সফটওয়্যার|উদ্ভাবন/,
  // General science: health, space, hazards, ecology
  /আবিষ্কার|বিজ্ঞানী|টিকা|ভ্যাকসিন|ডেঙ্গু|মহামারি|নাসা|মহাকাশ|টেলিস্কোপ|উপগ্রহ|ভূমিকম্প|ঘূর্ণিঝড়|জীববৈচিত্র্য|মৌলিক সংখ্যা/,
  // Awards, records, indices, reports
  /পুরস্কার|নোবেল|বুকার|ব্যালন ডি|প্রথমবার|রেকর্ড|সূচক|র‍্যাঙ্কিং|জরিপ|প্রতিবেদন প্রকাশ/,
  // Exams and jobs
  /বিসিএস|পিএসসি|কর্ম কমিশন|নিয়োগ|পরীক্ষার ফল|পরীক্ষার্থী|ভর্তি পরীক্ষা|এইচএসসি|এসএসসি|আলিম|দাখিল|শিক্ষা বোর্ড|ফল প্রকাশ/,
  // English stories, same areas
  /budget|inflation|gdp|reserves?|exports?|remittance|monetary|central bank|imf|world bank|united nations|nato|asean|brics|g20|treaty|agreement|summit|cop\d|climate|sanctions?|ceasefire|nuclear|cyber|crypto|bitcoin|artificial intelligence|\bai\b|semiconductor|quantum|nasa|vaccine|earthquake|cyclone|nobel|award|record|index|survey|election commission|parliament|supreme court|ordinance/i,
].map((re) => new RegExp(nfc(re.source), re.flags));

// Stories exams almost never ask about
const NOISE_SIGNALS = [
  /খুন|হত্যা|ধর্ষণ|লাশ|মরদেহ|ছুরিকাঘাত|গণপিটুনি|চাঁদা|ছিনতাই|অপহরণ/,
  /হ্যালোউইন|ভাইরাল|তারকার|প্রেম|বিয়ের আসর/,
  /দুর্ঘটনায় নিহত|দুর্ঘটনায় আহত|সড়ক দুর্ঘটনা/,
  /murder|killed|stabbed|rape|crash kills|body found/i,
].map((re) => new RegExp(nfc(re.source), re.flags));

const STOP = new Set(["ও", "এবং", "বা", "থেকে", "জন্য", "সঙ্গে", "করে", "হয়েছে", "একটি", "এই", "নিয়ে", "the", "and", "for", "with", "from", "that", "this"]);

function titleTokens(title: string): Set<string> {
  return new Set(
    nfc(title)
      .toLowerCase()
      .split(/[\s,;:।()\[\]/"'“”‘’\-–—|.?!]+/)
      .filter((t) => t.length >= 2 && !STOP.has(t))
  );
}

// Bengali adds endings to words ("এইচএসসিতে", "বোর্ডের"), so two words match when
// one starts with the other and the shared part is at least 3 letters long
// Common Bengali endings, longest first ("এইচএসসির" / "এইচএসসিতে" -> "এইচএসসি")
const SUFFIXES = ["গুলোর", "গুলো", "দের", "তেও", "েরা", "ের", "তে", "কে", "রা", "টি", "টা", "য়", "র", "ে", "ও"].map(nfc);
function stem(w: string): string {
  for (const s of SUFFIXES) if (w.endsWith(s) && w.length - s.length >= 3) return w.slice(0, -s.length);
  return w;
}

function sameWord(x: string, y: string): boolean {
  if (x === y) return true;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  if (short.length >= 3 && long.startsWith(short)) return true;
  const sx = stem(x);
  return sx.length >= 3 && sx === stem(y);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) for (const u of b) if (sameWord(t, u)) { shared++; break; }
  return shared / (a.size + b.size - shared);
}

const squash = (s: string) => nfc(s).replace(/\s+/g, " ").trim();

/**
 * How much real, quoted study material a story has (0-2.5). Deliberately smaller than
 * the topic score: a quiz on a fluff story must not lift it into the ten.
 */
function studyValue(c: FeedCard): number {
  const facts = Math.min(c.factTable?.length || 0, 3) * 0.33;
  const points = c.keyTakeaways?.length ? 0.5 : 0;
  const quiz = c.quizQuestions?.length ? 1 : 0;
  return quiz + facts + points;
}

export function scoreStory(c: FeedCard): number {
  const title = nfc(c.title);
  const summary = nfc(c.summary);
  // The headline says what a story is about; a word in the summary is weaker evidence
  const titleHits = EXAM_SIGNALS.filter((re) => re.test(title)).length;
  const summaryHits = EXAM_SIGNALS.filter((re) => !re.test(title) && re.test(summary)).length;
  const noiseHits = NOISE_SIGNALS.filter((re) => re.test(`${title} ${summary}`)).length;
  return (
    (CATEGORY_WEIGHT[c.category?.slug] ?? 1.5) +
    Math.min(titleHits, 3) * 1.5 +
    Math.min(summaryHits, 2) * 0.5 +
    studyValue(c) +
    (c.isLead ? 1 : 0) -
    Math.min(noiseHits * 2, 4)
  );
}

/** True when two cards are the same story saved twice. */
export function isSameStory(a: FeedCard, b: FeedCard): boolean {
  if (a.sourceUrl && a.sourceUrl === b.sourceUrl) return true;
  if (jaccard(titleTokens(a.title), titleTokens(b.title)) >= 0.5) return true;
  const pa = new Set((a.keyTakeaways || []).filter((t) => t.length > 40).map(squash));
  return (b.keyTakeaways || []).some((t) => t.length > 40 && pa.has(squash(t)));
}

const timeOf = (c: FeedCard) => new Date(c.createdAtIso).getTime() || 0;

/**
 * Pick জরুরি ১০ + up to 20 more from one language's stories.
 * `window: "latest"` keeps only the 24 hours before the newest story (the homepage);
 * `window: "all"` uses every card given (a chosen archive date).
 */
export function selectDaily(cards: FeedCard[], window: "latest" | "all" = "latest"): RankedCard[] {
  if (!cards.length) return [];
  const newest = Math.max(...cards.map(timeOf));
  const pool = window === "latest" ? cards.filter((c) => timeOf(c) > newest - WINDOW_MS) : cards;

  // Best first; ties go to the newer story
  const scored = pool
    .map((c) => ({ c, s: scoreStory(c) }))
    .sort((x, y) => y.s - x.s || timeOf(y.c) - timeOf(x.c));

  // Drop duplicates, keeping the higher-scored copy
  const unique: { c: FeedCard; s: number }[] = [];
  for (const item of scored) if (!unique.some((u) => isSameStory(u.c, item.c))) unique.push(item);

  const tokensOf = new Map(unique.map((u) => [u.c.id, [...titleTokens(u.c.title)]]));
  const has = (id: string, w: string) => tokensOf.get(id)!.some((t) => sameWord(t, w));
  const hotWords = new Set<string>();
  for (const u of unique)
    for (const w of tokensOf.get(u.c.id)!)
      if (w.length >= 3 && !/^[০-৯0-9]+$/.test(w) && !GENERIC_WORDS.has(w) && unique.filter((x) => has(x.c.id, w)).length >= HOT_WORD_MIN_HEADLINES)
        hotWords.add(w);

  const pickTier = (from: typeof unique, count: number, cap: number, topicCap = Infinity) => {
    const chosen: typeof unique = [];
    const perCat = new Map<string, number>();
    for (const item of from) {
      if (chosen.length >= count) break;
      const cat = item.c.category?.slug || "";
      if ((perCat.get(cat) || 0) >= cap) continue;
      const hot = tokensOf.get(item.c.id)!.filter((w) => hotWords.has(w));
      if (hot.some((w) => chosen.filter((x) => has(x.c.id, w)).length >= topicCap)) continue;
      perCat.set(cat, (perCat.get(cat) || 0) + 1);
      chosen.push(item);
    }
    // Not enough variety in a quiet day: fill the remaining places by score
    for (const item of from) {
      if (chosen.length >= count) break;
      if (!chosen.includes(item)) chosen.push(item);
    }
    return chosen.sort((x, y) => y.s - x.s || timeOf(y.c) - timeOf(x.c));
  };

  const urgent = pickTier(unique, URGENT_COUNT, MAX_PER_CATEGORY_URGENT, MAX_PER_TOPIC_URGENT);
  const rest = unique.filter((u) => !urgent.includes(u));
  const more = pickTier(rest, MORE_COUNT, MAX_PER_CATEGORY_MORE);

  return [
    ...urgent.map((u, i) => ({ ...u.c, dailyTier: "urgent" as const, dailyRank: i + 1 })),
    ...more.map((u, i) => ({ ...u.c, dailyTier: "more" as const, dailyRank: URGENT_COUNT + i + 1 })),
  ];
}

const isBengali = (t: string) => /[ঀ-৿]/.test(t || "");

/** The selection for both feeds: Bengali stories and English stories are ranked separately. */
export function selectDailyFeed(cards: FeedCard[], window: "latest" | "all" = "latest"): RankedCard[] {
  return [
    ...selectDaily(cards.filter((c) => isBengali(c.title)), window),
    ...selectDaily(cards.filter((c) => !isBengali(c.title)), window),
  ];
}
