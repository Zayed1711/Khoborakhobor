/**
 * English to Bangla Syllabic Phonetic Engine for KhoboraKhobor English Learners.
 * Provides accurate Bengali pronunciation guides (হরকত / উচ্চারণ নির্দেশিকা)
 * for academic, journalistic, economic, and competitive exam English words.
 */

// 1. Curated High-Yield Academic & Journalistic Phonetics
const CURATED_PHONETICS: Record<string, string> = {
  // Economic & Business
  austerity: "অস-টের-ই-টি",
  inflation: "ইন-ফ্লে-শন",
  deflation: "ডি-ফ্লে-শন",
  stagnation: "স্ট্যাগ-নে-শন",
  recession: "রি-সে-শন",
  monetary: "মা-নি-টা-রি",
  fiscal: "ফিস-কাল",
  revenue: "রে-ভে-নিউ",
  expenditure: "এক্স-পেন-ডি-চার",
  subsidy: "সাব-সি-ডি",
  deficit: "ডে-ফি-সিট",
  surplus: "সার-প্লাস",
  liquidity: "লি-কুই-ডি-টি",
  remittance: "রে-মিট-ট্যান্স",
  sovereign: "সভ-রিন",
  sovereignty: "সভ-রিন-টি",
  procurement: "প্রো-কিউর-মেন্ট",
  collateral: "কো-ল্যা-টা-রাল",
  moratorium: "মো-রা-টো-রি-য়াম",
  disinvestment: "ডিস-ইন-ভেস্ট-মেন্ট",
  privatization: "প্রাই-ভা-টাই-জেই-শন",
  macroeconomic: "ম্যাক্রো-ইকো-নো-মিক",
  benchmark: "বেঞ্চ-মার্ক",
  curb: "কার্ব",
  hike: "হাইক",
  plunge: "প্লাঞ্জ",
  surge: "সার্জ",
  soar: "সোর",
  slump: "স্লাম্প",
  fluctuation: "ফ্লাক-চু-য়ে-শন",
  equilibrium: "ই-কুই-লি-ব্রি-য়াম",
  commodity: "কো-মো-ডি-টি",
  tariff: "ট্যা-রিফ",
  embargo: "এম-বার-গো",

  // Law, Governance & Politics
  bureaucracy: "ব্যু-রো-ক্রে-সি",
  judiciary: "জু-ডি-শি-য়া-রি",
  legislation: "লে-জিস-লে-শন",
  legislature: "লে-জিস-লে-চার",
  amendment: "অ্যা-মেন্ড-মেন্ট",
  ordinance: "অর-ডি-ন্যান্স",
  gazette: "গে-জেট",
  ratification: "র‍্যা-টি-ফি-কে-শন",
  consensus: "কন-সেন-সাস",
  hegemony: "হে-জে-মো-নি",
  insurgency: "ইন-সার-জেন-সি",
  diplomacy: "ডিপ-লো-মে-সি",
  bilateral: "বাই-ল্যা-টা-রাল",
  multilateral: "মাল-টি-ল্যা-টা-রাল",
  jurisdiction: "জু-রিস-ডিক-শন",
  tribunal: "ট্রাই-বিউ-নাল",
  verdict: "ভার-ডিক্ট",
  indictment: "ইন-ডাইট-মেন্ট",
  litigation: "লি-টি-গেই-শন",
  acquittal: "অ্যা-কুই-টাল",
  prosecution: "প্রো-সি-কিউ-শন",
  custody: "কাস-তো-ডি",
  extradition: "এক্স-ট্রা-ডি-শন",
  arbitration: "আর-বি-ট্রেই-শন",
  clemency: "ক্লে-মেন-সি",
  affidavit: "অ্যা-ফি-ডে-ভিট",
  subpoena: "সাব-পী-না",
  plaintiff: "প্লেইন-টিফ",
  defendant: "ডি-ফেন-ড্যান্ট",
  sanction: "স্যাঙ্ক-শন",
  sanctions: "স্যাঙ্ক-শন্স",
  authoritarian: "অ-থো-রি-টে-রি-য়ান",
  totalitarian: "টো-ট্যা-লি-টে-রি-য়ান",
  nepotism: "নে-পো-টি-জম",

  // Editorial Vocabulary & Academic Concepts
  deteriorate: "ডি-টি-রি-ও-রেইট",
  alleviate: "আ-লি-ভি-য়েইট",
  exacerbate: "ইগ-জ্যা-সার-বেইট",
  scrutiny: "স্ক্রু-টি-নি",
  scrutinize: "স্ক্রু-টি-নাইজ",
  unprecedented: "আন-প্রে-সি-ডেন-টেড",
  vulnerable: "ভাল-নার-এ-বল",
  resilience: "রে-জিল-ই-য়েন্স",
  resilient: "রে-জিল-ই-য়েন্ট",
  sustainable: "সাস-টেই-নে-বল",
  sustainability: "সাস-টেই-না-বি-লি-টি",
  paradigm: "প্যা-রা-ডাইম",
  infrastructure: "ইন-ফ্রা-স্ট্রাক-চার",
  collaboration: "কো-ল্যা-বো-রে-শন",
  comply: "কম-প্লাই",
  compliance: "কম-প্লাই-অ্যান্স",
  accountability: "অ্যাকাউন্ট-আ-বি-লি-টি",
  transparency: "ট্রান্স-প্যা-রেন-সি",
  feasibility: "ফি-জি-বি-লি-টি",
  viability: "ভাই-আ-বি-লি-টি",
  rehabilitation: "রি-হ্যা-বি-লি-টেই-শন",
  prerequisite: "প্রি-রেক-উই-জিট",
  proliferation: "প্রো-লি-ফা-রেই-শন",
  catastrophic: "ক্যা-টাস-ট্রো-ফিক",
  equilibrium_point: "ভারসাম্য বিন্দু",
  consequence: "কন-সি-কোয়েন্স",
  consequences: "কন-সি-কোয়েন্সেস",
  deterrent: "ডি-টা-রেন্ট",
  deterrence: "ডি-টা-রেন্স",
  manifestation: "ম্যা-নি-ফেস-টেই-শন",
  repercussion: "রি-পার-কা-শন",
  repercussions: "রি-পার-কা-শন্স",
  inevitable: "ইন-এ-ভি-টা-বল",
  reluctance: "রি-লাক-ট্যান্স",
  skepticism: "স্কেপ-টি-সি-জম",
  comprehensive: "কম-প্রি-হেন-সিভ",
  apprehension: "অ্যা-প্রি-হেন-শন",
  equilibrium_state: "ভারসাম্য অবস্থা",
  precautionary: "প্রি-ক-শ-না-রি",
  countermeasure: "কাউন্টার-মেজার",
  countermeasures: "কাউন্টার-মেজার্স",
};

// Common English words phonetic map for clean inline reader guide
const COMMON_WORD_PHONETICS: Record<string, string> = {
  the: "দ্য",
  a: "আ",
  an: "অ্যান",
  and: "অ্যান্ড",
  or: "অর",
  but: "বাট",
  in: "ইন",
  on: "অন",
  at: "অ্যাট",
  to: "টু",
  for: "ফর",
  with: "উইথ",
  by: "বাই",
  from: "ফ্রম",
  about: "অ্যাবাউট",
  into: "ইনটু",
  through: "থ্রু",
  over: "ওভার",
  after: "আফটার",
  before: "বিফোর",
  between: "বিটুইন",
  under: "আন্ডার",
  during: "ডিউরিং",
  without: "উইদাউট",
  against: "অ্যাগেইনস্ট",
  is: "ইজ",
  are: "আর",
  was: "ওয়াজ",
  were: "ওয়্যার",
  be: "বি",
  been: "বিন",
  being: "বিয়িং",
  have: "হ্যাভ",
  has: "হ্যাস",
  had: "হ্যাড",
  do: "ডু",
  does: "ডাজ",
  did: "ডিড",
  will: "উইল",
  would: "উড",
  shall: "শ্যাল",
  should: "শুড",
  may: "মে",
  might: "মাইট",
  must: "মাস্ট",
  can: "ক্যান",
  could: "কুড",
  it: "ইট",
  its: "ইটস",
  this: "দিস",
  that: "দ্যাট",
  these: "দিজ",
  those: "দোজ",
  they: "দে",
  their: "দেয়ার",
  them: "দেম",
  we: "উই",
  our: "আওয়ার",
  us: "আস",
  he: "হি",
  his: "হিজ",
  him: "হিম",
  she: "শি",
  her: "হার",
  i: "আই",
  my: "মাই",
  me: "মি",
  you: "ইউ",
  your: "ইউর",
  what: "হোয়াট",
  which: "হুইচ",
  who: "হু",
  whom: "হুম",
  whose: "হুজ",
  when: "হোয়েন",
  where: "হোয়ার",
  why: "হোয়াই",
  how: "হাউ",
  all: "অল",
  any: "এনি",
  both: "বোথ",
  each: "ইচ",
  few: "ফিউ",
  more: "মোর",
  most: "মোস্ট",
  other: "আদার",
  some: "সাম",
  such: "সাচ",
  no: "নো",
  not: "নট",
  only: "অনলি",
  own: "ওন",
  same: "সেইম",
  so: "সো",
  than: "দ্যান",
  too: "টু",
  very: "ভেরি",
  government: "গভর্নমেন্ট",
  country: "কান্ট্রি",
  state: "স্টেট",
  national: "ন্যাশনাল",
  international: "ইন্টারন্যাশনাল",
  people: "পিপল",
  year: "ইয়ার",
  years: "ইয়ার্স",
  day: "ডে",
  days: "ডেস",
  report: "রিপোর্ট",
  news: "নিউজ",
  minister: "মিনিস্টার",
  ministry: "মিনিস্ট্রি",
  police: "পুলিশ",
  court: "কোর্ট",
  bank: "ব্যাংক",
  banks: "ব্যাংকস",
  central: "সেন্ট্রাল",
  policy: "পলিসি",
  policies: "পলিসিস",
  rate: "রেট",
  rates: "রেটস",
  price: "প্রাইস",
  prices: "প্রাইসেস",
  market: "মার্কেট",
  markets: "মার্কেটস",
  growth: "গ্রোথ",
  trade: "ট্রেড",
  sector: "সেক্টর",
  public: "পাবলিক",
  private: "প্রাইভেট",
  official: "অফিশিয়াল",
  officials: "অফিশিয়ালস",
  statement: "স্টেটমেন্ট",
  meeting: "মিটিং",
  development: "ডেভেলপমেন্ট",
  project: "প্রজেক্ট",
  projects: "প্রজেক্টস",
  crisis: "ক্রাইসিস",
  reform: "রিফর্ম",
  reforms: "রিফর্মস",
  system: "সিস্টেম",
  security: "সিকিউরিটি",
  economy: "ইকোনমি",
  economic: "ইকোনমিক",
  education: "এডুকেশন",
  health: "হেলথ",
  service: "সার্ভিস",
  services: "সার্ভিসেস",
  increase: "ইনক্রিজ",
  decrease: "ডিক্রিজ",
  announced: "অ্যানাউন্সড",
  decided: "ডিসাইডেড",
  called: "কল্ড",
  urged: "আর্জড",
  warned: "ওয়ার্নড",
  said: "সেইড",
  stated: "স্টেটেড",
};

/**
 * Heuristic phonetic transliterator for any arbitrary English word
 */
function phoneticRuleFallback(word: string): string {
  let w = word.toLowerCase().trim();
  if (!w) return "";

  // Common suffix transformations
  w = w.replace(/tion/g, "শন");
  w = w.replace(/sion/g, "শন");
  w = w.replace(/cian/g, "শিয়ান");
  w = w.replace(/ment/g, "মেন্ট");
  w = w.replace(/able/g, "এবল");
  w = w.replace(/ible/g, "ইবল");
  w = w.replace(/logy/g, "লজি");
  w = w.replace(/tomy/g, "টমি");
  w = w.replace(/ness/g, "নেস");
  w = w.replace(/ship/g, "শিপ");
  w = w.replace(/hood/g, "হুড");
  w = w.replace(/less/g, "লেস");
  w = w.replace(/ful/g, "ফুল");
  w = w.replace(/ous/g, "আস");
  w = w.replace(/ive/g, "ইভ");
  w = w.replace(/ity/g, "ইটি");
  w = w.replace(/ism/g, "ইজম");
  w = w.replace(/ist/g, "ইস্ট");
  w = w.replace(/ing/g, "ইং");
  w = w.replace(/ed$/g, "ড");

  // Common consonant combinations
  w = w.replace(/th/g, "থ");
  w = w.replace(/sh/g, "শ");
  w = w.replace(/ch/g, "চ");
  w = w.replace(/ph/g, "ফ");
  w = w.replace(/wh/g, "হোয়া");
  w = w.replace(/qu/g, "কুই");
  w = w.replace(/ck/g, "ক");
  w = w.replace(/ng/g, "ং");
  w = w.replace(/gh/g, "");

  // Common vowel combinations
  w = w.replace(/ee/g, "ী");
  w = w.replace(/ea/g, "ী");
  w = w.replace(/oo/g, "ু");
  w = w.replace(/ai/g, "েই");
  w = w.replace(/ay/g, "ে");
  w = w.replace(/ou/g, "আউ");
  w = w.replace(/ow/g, "ও");
  w = w.replace(/oa/g, "ও");
  w = w.replace(/oi/g, "অয়");
  w = w.replace(/oy/g, "অয়");

  // Simple consonant mapping
  const charMap: Record<string, string> = {
    b: "ব",
    c: "ক",
    d: "ড",
    f: "ফ",
    g: "গ",
    h: "হ",
    j: "জ",
    k: "ক",
    l: "ল",
    m: "ম",
    n: "ন",
    p: "প",
    r: "র",
    s: "স",
    t: "ট",
    v: "ভ",
    w: "ও",
    x: "ক্স",
    y: "ই",
    z: "জ",
    a: "আ",
    e: "এ",
    i: "ই",
    o: "ও",
    u: "উ",
  };

  let result = "";
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    result += charMap[ch] || ch;
  }

  return result || word;
}

/**
 * Returns clean Bengali syllable pronunciation for any English word or short phrase
 */
export function getBanglaPronunciation(term: string): string {
  if (!term) return "";
  const clean = term.toLowerCase().trim().replace(/[.,!?;:()[\]"']/g, "");

  // 1. Direct Curated Match
  if (CURATED_PHONETICS[clean]) {
    return CURATED_PHONETICS[clean];
  }

  // 2. Direct Common Word Match
  if (COMMON_WORD_PHONETICS[clean]) {
    return COMMON_WORD_PHONETICS[clean];
  }

  // 3. Multi-word phrase handling (e.g. "rein in", "curb inflation")
  if (clean.includes(" ")) {
    return clean
      .split(" ")
      .map((part) => getBanglaPronunciation(part))
      .join(" ");
  }

  // 4. Syllabic Fallback
  return phoneticRuleFallback(clean);
}

export const getEnToBnPhonetics = getBanglaPronunciation;
