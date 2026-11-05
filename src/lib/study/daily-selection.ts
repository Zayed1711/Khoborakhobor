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
export type RankedCard = FeedCard & { dailyTier: DailyTier; dailyRank: number; isTrending: boolean };


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
  /আবিষ্কার|বিজ্ঞানী|টিকা|ভ্যাকসিন|ডেঙ্গু|মহামারি|নাসা|মহাকাশ|টেলিস্কোপ|উপগ্রহ|ভূমিকম্প|ঘূর্ণিঝড়|বন্যা|জীববৈচিত্র্য|পরিবেশ|দূষণ|নদী রক্ষা|বনভূমি|মৌলিক সংখ্যা/,
  // Awards, records, indices, reports
  /পুরস্কার|নোবেল|বুকার|ব্যালন ডি|প্রথমবার|রেকর্ড|সূচক|র‍্যাঙ্কিং|জরিপ|প্রতিবেদন প্রকাশ/,
  // Exams and jobs
  /বিসিএস|পিএসসি|কর্ম কমিশন|নিয়োগ|পরীক্ষার ফল|পরীক্ষার্থী|ভর্তি পরীক্ষা|এইচএসসি|এসএসসি|আলিম|দাখিল|শিক্ষা বোর্ড|ফল প্রকাশ/,
  // English stories, same areas
  /budget|inflation|gdp|reserves?|exports?|remittance|monetary|central bank|imf|world bank|united nations|nato|asean|brics|g20|treaty|agreement|summit|cop\d|climate|sanctions?|ceasefire|nuclear|cyber|crypto|bitcoin|artificial intelligence|\bai\b|semiconductor|quantum|nasa|vaccine|earthquake|cyclone|nobel|award|record|index|survey|election commission|parliament|supreme court|ordinance/i,
].map((re) => new RegExp(nfc(re.source), re.flags));

/** True when the text touches at least one syllabus area. */
export function isSyllabusText(text: string): boolean {
  const t = nfc(text || "");
  return EXAM_SIGNALS.some((re) => re.test(t));
}

/**
 * A story belongs in the selection only if its headline or summary touches the
 * syllabus (or it is filed under exam preparation). Others are left out even when
 * there is room, so a quiet day shows fewer stories instead of padding.
 */
export function isSyllabusRelevant(c: Pick<FeedCard, "title" | "summary" | "category">): boolean {
  return c.category?.slug === "exam-prep" || isSyllabusText(`${c.title} ${c.summary}`);
}

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

// ---------------------------------------------------------------------------
// Trending (আলোচিত): important national or international news that is in the
// selection even when it matches nothing in the syllabus
// ---------------------------------------------------------------------------

// Only these sections can be "trending"; a viral sports or film story is not
const TREND_CATEGORIES = new Set(["national", "politics", "world", "economy"]);
const NATIONAL = new Set(["national", "politics", "economy"]);
const INTERNATIONAL = new Set(["world"]);
// Heads of state and government, elections: news of the day even outside the syllabus
const HIGH_PROFILE = new RegExp(
  nfc("প্রধানমন্ত্রী|রাষ্ট্রপতি|প্রধান উপদেষ্টা|প্রধান বিচারপতি|সেনাপ্রধান|জাতীয় নির্বাচন|সংসদ নির্বাচন|উপনির্বাচন|সিটি নির্বাচন|মধ্যবর্তী নির্বাচন|প্রেসিডেন্ট নির্বাচন|নির্বাচন কমিশন|ভোটগ্রহণ|ভোটের ফল|সিনেট|প্রতিনিধি পরিষদ|হোয়াইট হাউস|মার্কিন প্রেসিডেন্ট|president|prime minister|general election|midterm|senate|white house"),
  "i"
);
// 3+ stories about the same event in one day = wide coverage
const TRENDING_COVERAGE = 3;
// Letters (Unicode code units, after removing endings) for a word to count as specific
const SPECIFIC_WORD_LENGTH = 6;

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
  const inWindow = window === "latest" ? cards.filter((c) => timeOf(c) > newest - WINDOW_MS) : cards;

  // Coverage: how many of the day's stories are about the same event (same story,
  // or sharing a word that is in 3+ of the day's headlines)
  const tokensOf = new Map(inWindow.map((c) => [c.id, [...titleTokens(c.title)]]));
  const has = (id: string, w: string) => tokensOf.get(id)!.some((t) => sameWord(t, w));
  const hotWords = new Set<string>();
  for (const c of inWindow)
    for (const w of tokensOf.get(c.id)!)
      if (w.length >= 3 && !/^[০-৯0-9]+$/.test(w) && !GENERIC_WORDS.has(w) && !hotWords.has(w) &&
          inWindow.filter((x) => has(x.id, w)).length >= HOT_WORD_MIN_HEADLINES)
        hotWords.add(w);
  const hotOf = (id: string) => tokensOf.get(id)!.filter((w) => hotWords.has(w));
  // Two stories cover the same event when they are the same story, share one long,
  // specific topic word ("পোশাকশ্রমিক", "এইচএসসি"), or share two shorter ones.
  // Short common words ("দাম", "বোর্ড") alone do not connect stories.
  const isSpecific = (w: string) => stem(w).length >= SPECIFIC_WORD_LENGTH;
  const coverage = (c: FeedCard) => {
    const hot = hotOf(c.id);
    return inWindow.filter((x) => {
      if (isSameStory(c, x)) return true;
      const shared = hot.filter((w) => has(x.id, w));
      return shared.some(isSpecific) || shared.length >= 2;
    }).length;
  };
  const isTrending = (c: FeedCard) =>
    TREND_CATEGORIES.has(c.category?.slug) && (coverage(c) >= TRENDING_COVERAGE || HIGH_PROFILE.test(nfc(c.title)));

  // Syllabus stories, plus trending national/international news; a quiet day shows
  // fewer rather than padding with fluff
  const scored = inWindow
    .map((c) => {
      const trending = isTrending(c);
      // A small lift: the ten stay mostly syllabus; the top trending national and
      // international story are guaranteed a place below
      const s = scoreStory(c) + (trending ? 1 + Math.min(coverage(c) - 1, 3) * 0.3 : 0);
      return { c, s, trending };
    })
    .filter((x) => x.trending || isSyllabusRelevant(x.c))
    .sort((x, y) => y.s - x.s || timeOf(y.c) - timeOf(x.c));

  // Drop duplicates, keeping the higher-scored copy
  const unique: typeof scored = [];
  for (const item of scored) if (!unique.some((u) => isSameStory(u.c, item.c))) unique.push(item);

  const pickTier = (from: typeof unique, count: number, cap: number, topicCap = Infinity) => {
    const chosen: typeof unique = [];
    const perCat = new Map<string, number>();
    for (const item of from) {
      if (chosen.length >= count) break;
      const cat = item.c.category?.slug || "";
      if ((perCat.get(cat) || 0) >= cap) continue;
      if (hotOf(item.c.id).some((w) => chosen.filter((x) => has(x.c.id, w)).length >= topicCap)) continue;
      perCat.set(cat, (perCat.get(cat) || 0) + 1);
      chosen.push(item);
    }
    // Not enough variety in a quiet day: fill the remaining places by score
    for (const item of from) {
      if (chosen.length >= count) break;
      if (!chosen.includes(item)) chosen.push(item);
    }
    return chosen;
  };

  const urgent = pickTier(unique, URGENT_COUNT, MAX_PER_CATEGORY_URGENT, MAX_PER_TOPIC_URGENT);

  // The ten always carry the day's top trending national and international story
  for (const group of [NATIONAL, INTERNATIONAL]) {
    if (urgent.some((u) => u.trending && group.has(u.c.category?.slug))) continue;
    const best = unique.find((u) => u.trending && group.has(u.c.category?.slug) && !urgent.includes(u));
    if (!best) continue;
    if (urgent.length < URGENT_COUNT) { urgent.push(best); continue; }
    // Replace the lowest-scored story that is not itself a reserved trending one
    const sorted = [...urgent].sort((x, y) => x.s - y.s);
    const out = sorted.find((u) => !u.trending) ?? sorted[0];
    urgent.splice(urgent.indexOf(out), 1, best);
  }
  urgent.sort((x, y) => y.s - x.s || timeOf(y.c) - timeOf(x.c));

  const rest = unique.filter((u) => !urgent.includes(u));
  const more = pickTier(rest, MORE_COUNT, MAX_PER_CATEGORY_MORE).sort((x, y) => y.s - x.s || timeOf(y.c) - timeOf(x.c));

  return [
    ...urgent.map((u, i) => ({ ...u.c, dailyTier: "urgent" as const, dailyRank: i + 1, isTrending: u.trending })),
    ...more.map((u, i) => ({ ...u.c, dailyTier: "more" as const, dailyRank: URGENT_COUNT + i + 1, isTrending: u.trending })),
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
