/**
 * KhoboraKhobor (খবরাখবর) - Exam Relevance Gatekeeper & Fact Sheet Engine
 * 1. Filters out non-academic noise (domestic violence, petty crimes, tabloids, gossip, actors).
 * 2. High-Yield Boosters for BCS Written Essay & General Knowledge (road surveys, sports milestones).
 * 3. Extracts structured 4-tier Fact Tables (Authority, Metric/Finding, Legal/History, Exam Syllabus Angle).
 */

import { FactTableRow } from "@/types";

export interface ExamRelevanceResult {
  isRelevant: boolean;
  reason: string;
  examPhase: "PRELIM" | "WRITTEN" | "COMPREHENSIVE";
  suggestedExamTrack?: string;
}

// -------------------------------------------------------------
// 1. Negative Filtering Patterns (Academic Noise Exclusions)
// -------------------------------------------------------------

export const DOMESTIC_AND_PETTY_CRIME_PATTERNS = [
  // Murders, killings, corpses (specific petty/domestic crime phrases)
  /কুপিয়ে\s*হত্যা/i,
  /গুলি\s*করে\s*হত্যা/i,
  /নেতা\s*(?:খুন|হত্যা)/i,
  /কর্মী\s*(?:খুন|হত্যা)/i,
  /ছাত্রদল\s*নেতা/i,
  /খুনের\s*দায়ে/i,
  /ছুরিকাঘাতে\s*হত্যা/i,
  /ছুরিকাঘাত/i,
  /কুপিয়ে\s*জখম/i,
  /অজ্ঞাত\s*(?:লাশ|মরদেহ)/i,
  /মরদেহ\s*উদ্ধার/i,
  /লাশ\s*উদ্ধার/i,
  /ঝুলন্ত\s*লাশ/i,
  /গলায়\s*ফাঁস/i,
  /বিষপানে?\s*(?:আত্মহত্যা|মৃত্যু)?/i,
  /পুতুলের\s*মতো\s*মেয়েটা/i,
  /মরদেহ\s*আসছে/i,
  /পুলিশ\s*হেফাজতে\s*মৃত্যু/i,
  /jumped\s*into\s*river/i,
  /dies\s*beforehand/i,
  /bodies\s*of\s*five/i,

  // Land, family, local feuds & domestic violence
  /জমি\s*নিয়ে\s*বিরোধ/i,
  /পারিবারিক\s*কলহ/i,
  /যৌতুক/i,
  /গৃহকর্মী\s*নির্যাতন/i,
  /চুনকালি\s*মাখিয়ে/i,
  /ভাইয়ের\s*হাতে\s*ভাই/i,
  /স্বামীর\s*হাতে\s*স্ত্রী/i,
  /স্ত্রীর\s*হাতে\s*স্বামী/i,
  /বিয়েতে\s*রাজি\s*না\s*হওয়ায়/i,
  /মাটির\s*ব্যবসা\s*নিয়ে\s*বিরোধ/i,
  /প্রেমের\s*জেরে\s*(?:খুন|হত্যা)/i,
  /দোকানে\s*হামলা-?লুটপাট/i,
  /ছিনতাইকারীর\s*কবলে/i,
  /ছিনতাইকালে\s*আটক/i,
  /মোবাইল\s*ছিনতাই/i,
  /আইফোন\s*ছিনিয়ে/i,
  /আইফোন\s*ছিনিয়ে/i,
  /অস্ত্র\s*ধরে\s*ডাকাতি/i,
  /গরু\s*চুরি/i,
  /মোটরসাইকেল\s*চুরি/i,
  /ব্যাটারি\s*চুরি/i,
  /চুরির\s*অভিযোগে\s*পিটিয়ে/i,
  /চুরির\s*অভিযোগে\s*আটক/i,
  /মারধরের\s*অভিযোগ/i,
  /মারপিটের\s*ঘটনা/i,
  /ধর্ষণের\s*অভিযোগ/i,
];

export const CELEBRITY_TABLOID_PATTERNS = [
  // Specific celebrity names
  /শাকিব\s*খান/i,
  /বুবলী/i,
  /পরীমণি/i,
  /অপু\s*বিশ্বাস/i,
  /মেহজাবীন/i,
  /জেসিয়া/i,
  /জেসিয়া/i,
  /পূজা\s*চেরী/i,
  /মারিয়া\s*শান্ত/i,
  /তাহসান/i,
  /মিথিলা/i,
  /অনন্ত\s*জলিল/i,
  /হিরো\s*আলম/i,
  /জায়েদ\s*খান/i,
  /শাহরুখ\s*খান/i,
  /সালমান\s*খান/i,
  /প্যাট্রিক\s*স্টুয়ার্ট/i,
  /প্যাট্রিক\s*স্টুয়ার্ট/i,
  /shakib\s*khan/i,
  /bubly/i,
  /porimoni/i,
  /mehazabien/i,
  /jesia/i,
  /puja\s*cherry/i,
  /shahrukh\s*khan/i,

  // Showbiz, cinema, actors & television
  /শোবিজ\s*(?:তারকা|জগতের|সংবাদ)/i,
  /নায়ক-নায়িকা/i,
  /গ্ল্যামার\s*জগৎ/i,
  /বিগ\s*বস/i,
  /সিনেমার\s*পোস্টার/i,
  /নাটকের\s*শুটিং/i,
  /নতুন\s*মুখের\s*অভিষেক/i,
  /চার\s*জুটির\s*চার\s*রকম\s*প্রেম/i,
  /নায়িকা\s*আমার\s*মা/i,

  // Relationships, gossip & divorces
  /প্রেমের\s*গুঞ্জন/i,
  /বিচ্ছেদের\s*(?:পর|গুঞ্জন|খবর)/i,
  /বিয়ে\s*করলেন/i,
  /তালাকের\s*(?:পর|ঘোষণা)/i,
  /দ্বিতীয়\s*স্ত্রী/i,
  /পরকীয়া/i,

  // Fashion, photoshoots & viral
  /ফ্যাশন\s*ডায়েরি/i,
  /উষ্ণতা\s*ছড়ানো/i,
  /স্নিগ্ধ\s*লুক/i,
  /কনে\s*সাজে/i,
  /বোল্ড\s*লুক/i,
  /দেখুন\s*[০-৯0-9]+\s*ছবি/i,
  /ছবিতে\s*দেখুন/i,
  /সোশ্যাল\s*মিডিয়ায়\s*ভাইরাল/i,
  /একঝলক/i,
  /TOP\s*SHOTS/i,
];

export const SENSATIONALISM_AND_SUPERSTITION = [
  /অলৌকিক/i,
  /জিন-পরীর/i,
  /কবিরাজি/i,
  /ভাগ্য\s*গণনা/i,
  /হাসপাতাল\s*ছাড়েনি\s*মোরগ/i,
  /মোরগ.*হাসপাতাল/i,
  /পদ্মার\s*শুশুক/i,
  /বাগাড়\s*মাছ/i,
  /পচা\s*মাছ/i,
  /দাঁত\s*শিরশির/i,
];

export const LOCAL_FACTIONAL_CLASHES = [
  /আধিপত্য\s*বিস্তার/i,
  /ককটেল\s*বিস্ফোরণ/i,
  /সিট\s*দখল/i,
  /দুই\s*গ্রুপের\s*সংঘর্ষ/i,
  /দুই\s*পক্ষের\s*সংঘর্ষ/i,
  /গ্রুপিং/i,
  /উচ্ছেদ\s*অভিযানে\s*প্রশাসক/i,
  /মানিক\s*পশারী/i,
];

export const ROUTINE_ACCIDENT_PATTERNS = [
  /(?:মোটরসাইকেল|অটোরিকশা|রিকশা)\s*(?:আরোহী|চালক)?\s*(?:নিহত|আহত|মৃত্যু)/i,
  /(?:বাস|ট্রাক|লরি)[^\n।]*(?:ধাক্কায়|চাপায়)[^\n।]*(?:নিহত|আহত|মৃত্যু)/i,
  /সড়ক\s*দুর্ঘটনায়\s*(?:এক|১|দুই|২|তিন|৩)\s*জন\s*(?:নিহত|মৃত্যু)/i,
  /road\s*crash\s*kills/i,
  /killed\s*in\s*accident/i,
];

export const ROUTINE_WEATHER_PATTERNS = [
  /এক\s*পশলা\s*বৃষ্টি/i,
  /স্বস্তির\s*বৃষ্টি/i,
  /তাপমাত্রা\s*কমতে\s*পারে/i,
  /আজকের\s*আবহাওয়া/i,
];

// -------------------------------------------------------------
// 2. High-Yield Written Essay & General Knowledge Boosters
// -------------------------------------------------------------

export const WRITTEN_SURVEY_AND_POLICY_SIGNALS = [
  /বুয়েট/i,
  /বুয়েট/i,
  /এআরআই/i,
  /অ্যাকসিডেন্ট\s*রিসার্চ\s*ইনস্টিটিউট/i,
  /নিসচা/i,
  /নিরাপদ\s*সড়ক\s*চাই/i,
  /বিআরটিএ\s*(?:প্রতিবেদন|জরিপ|পরিসংখ্যান|নীতিমালা)/i,
  /রোড\s*সেফটি\s*ফাউন্ডেশন/i,
  /যাত্রী\s*কল্যাণ\s*সমিতি/i,
  /সড়ক\s*দুর্ঘটনা\s*(?:জরিপ|সমীক্ষা|প্রতিবেদন|পরিসংখ্যান|গবেষণা)/i,
  /সড়ক\s*নিরাপত্তা\s*আইন/i,
  /জিডিপির\s*(?:ক্ষতি|শতাংশ)/i,
  /বার্ষিক\s*ক্ষয়ক্ষতি/i,
  /যানবাহন\s*রেজিস্ট্রেশন\s*নীতিমালা/i,
  /মহাসড়কে\s*গতিসীমা/i,
];

export const MAJOR_SPORTS_AWARDS_AND_RECORDS = [
  /ব্যালন\s*ডি[’']?অর/i,
  /ballon\s*d[’']?or/i,
  /ফিফা\s*দ্য\s*বেস্ট/i,
  /বিশ্বকাপ\s*বাছাই/i,
  /অলিম্পিক\s*(?:পদক|রেকর্ড)/i,
  /গ্র্যান্ড\s*স্ল্যাম/i,
  /টেস্ট\s*(?:ম্যাচ|স্ট্যাটাস|সিরিজ|সেঞ্চুরি|রেকর্ড)/i,
  /ইতিহাস\s*গড়ল/i,
  /আন্তর্জাতিক\s*টুর্নামেন্ট/i,
  /মিরপুর\s*টেস্ট/i,
];

export const MACRO_INSTITUTIONAL_SIGNALS = [
  /বাংলাদেশ\s*ব্যাংক/i,
  /মুদ্রানীতি/i,
  /রেপো\s*রেট/i,
  /রিজার্ভ/i,
  /মূল্যস্ফীতি/i,
  /আইএমএফ/i,
  /বিশ্বব্যাংক/i,
  /এনবিআর/i,
  /কর\s*রাজস্ব/i,
  /অধ্যাদেশ/i,
  /সংবিধান\s*সংস্কার/i,
  /নির্বাচন\s*কমিশন/i,
  /হাইকোর্ট/i,
  /সুপ্রিম\s*কোর্ট/i,
  /গুম\s*কমিশন/i,
  /জুলাই\s*সনদ/i,
  /মেট্রোরেল/i,
  /জলবায়ু/i,
  /কপ/i,
  /cop/i,
  /জাতিসংঘ/i,
  /নিরাপত্তা\s*পরিষদ/i,
  /কূটনীতি/i,
  /পররাষ্ট্র/i,
  /কিসিঞ্জার/i,
  /আইইডিসিআর/i,
  /ডেঙ্গু/i,
];

/**
 * Check if the article belongs to a protected constitutional/state/historical commission
 */
function isExemptInstitutional(title: string, text: string): boolean {
  if (/গুম\s*সংক্রান্ত\s*কমিশন|গুমের\s*শিকার|আন্তর্জাতিক\s*অপরাধ\s*ট্রাইব্যুনাল/i.test(text)) return true;
  if (/আইইডিসিআর.*তদন্ত/i.test(title)) return true;
  if (/কিসিঞ্জার|মুক্তিযুদ্ধ|বঙ্গবন্ধু|স্বাধীনতার/i.test(text)) return true;
  return false;
}

/**
 * Primary Gatekeeper function to evaluate whether an article is academically relevant.
 */
export function evaluateExamRelevance(
  title: string,
  content: string = "",
  categorySlug: string = "national"
): ExamRelevanceResult {
  const fullText = `${title} ${content}`.trim();
  // Negative filters evaluate on headline and primary lead paragraph to prevent noise in scraped sidebars/footers from discarding valid news
  const primaryText = `${title} ${content.slice(0, 450)}`.trim();

  // 1. High-Profile Institutional and Historical Commission Exemption
  if (isExemptInstitutional(title, fullText)) {
    return {
      isRelevant: true,
      reason: "INSTITUTIONAL_EXEMPTION",
      examPhase: "COMPREHENSIVE",
      suggestedExamTrack: "বিসিএস প্রিলি ও লিখিত: রাষ্ট্র সংস্কার, সুশাসন ও মুক্তিযুদ্ধ",
    };
  }

  // 2. Positive Macro-Institutional Check (If article clearly covers macro economics, diplomacy, constitution or state policy, prioritize it)
  const isMacroInstitutional = MACRO_INSTITUTIONAL_SIGNALS.some((rx) => rx.test(fullText));
  const hasMacroKeywords = /মন্ত্রণালয়|মন্ত্রণালয়|বাংলাদেশ\s*ব্যাংক|অর্থনীতি|মুদ্রানীতি|রিজার্ভ|বাজেট|রাজস্ব|এনবিআর|জিডিপি|আইএমএফ|পোশাকশিল্প|মজুরি|পররাষ্ট্র|কূটনীতি|জাতিসংঘ|হোয়াইট\s*হাউস|নির্বাচন\s*কমিশন|পারমাণবিক|সংসদ|হাইকোর্ট|সুপ্রিম\s*কোর্ট|সুইডেন|ইরান|যুক্তরাষ্ট্র|ট্রাম্প|হোয়াইট\s*হাউস/i.test(fullText);

  if (isMacroInstitutional || (hasMacroKeywords && categorySlug !== "entertainment")) {
    return {
      isRelevant: true,
      reason: "MACRO_INSTITUTIONAL_EVENT",
      examPhase: "COMPREHENSIVE",
      suggestedExamTrack: "বিসিএস প্রিলি ও লিখিত: অর্থনীতি, সুশাসন ও আন্তর্জাতিক পরিক্রমা",
    };
  }

  // 3. Check for Road Safety Surveys & Transport Policy (Written Exam High-Yield)
  const hasRoadContext = /সড়ক|দুর্ঘটনা|পরিবহন|ট্রাফিক/i.test(fullText);
  const isWrittenSurveyOrPolicy = WRITTEN_SURVEY_AND_POLICY_SIGNALS.some((rx) => rx.test(fullText));

  if (hasRoadContext && isWrittenSurveyOrPolicy) {
    return {
      isRelevant: true,
      reason: "ROAD_SAFETY_SURVEY_AND_POLICY",
      examPhase: "WRITTEN",
      suggestedExamTrack: "বিসিএস লিখিত ও রচনা প্রস্তুতি: সড়ক নিরাপত্তা ও প্রাতিষ্ঠানিক রূপরেখা",
    };
  }

  // 4. Check Negative Crime & Tabloid Triggers on primaryText
  if (CELEBRITY_TABLOID_PATTERNS.some((rx) => rx.test(primaryText))) {
    return {
      isRelevant: false,
      reason: "CELEBRITY_TABLOID_OR_GOSSIP",
      examPhase: "PRELIM",
      suggestedExamTrack: "",
    };
  }

  if (DOMESTIC_AND_PETTY_CRIME_PATTERNS.some((rx) => rx.test(primaryText))) {
    return {
      isRelevant: false,
      reason: "DOMESTIC_VIOLENCE_OR_PETTY_CRIME",
      examPhase: "PRELIM",
      suggestedExamTrack: "",
    };
  }

  if (LOCAL_FACTIONAL_CLASHES.some((rx) => rx.test(primaryText))) {
    return {
      isRelevant: false,
      reason: "LOCAL_FACTIONAL_CLASH",
      examPhase: "PRELIM",
      suggestedExamTrack: "",
    };
  }

  if (SENSATIONALISM_AND_SUPERSTITION.some((rx) => rx.test(primaryText))) {
    return {
      isRelevant: false,
      reason: "SUPERSTITION_OR_SENSATIONALISM",
      examPhase: "PRELIM",
      suggestedExamTrack: "",
    };
  }

  // 5. Exclude Isolated Routine Accidents (unless already qualified under survey above)
  if (ROUTINE_ACCIDENT_PATTERNS.some((rx) => rx.test(primaryText)) && !isWrittenSurveyOrPolicy) {
    return {
      isRelevant: false,
      reason: "ROUTINE_ISOLATED_ACCIDENT",
      examPhase: "PRELIM",
      suggestedExamTrack: "",
    };
  }

  // 6. Check for Major Sports Awards or International Records (General Knowledge Booster)
  if (MAJOR_SPORTS_AWARDS_AND_RECORDS.some((rx) => rx.test(fullText))) {
    return {
      isRelevant: true,
      reason: "MAJOR_SPORTS_AWARD_OR_MILESTONE",
      examPhase: "COMPREHENSIVE",
      suggestedExamTrack: "আন্তর্জাতিক ক্রীড়াঙ্গন, বৈশ্বিক পুরস্কার ও সাধারণ জ্ঞান",
    };
  }

  // 7. Exclude Routine Daily Weather
  if (ROUTINE_WEATHER_PATTERNS.some((rx) => rx.test(primaryText)) && !/জলবায়ু|কপ|COP|তহবিল/i.test(fullText)) {
    return {
      isRelevant: false,
      reason: "ROUTINE_WEATHER",
      examPhase: "PRELIM",
      suggestedExamTrack: "",
    };
  }

  // 8. Editorial and Opinion categories are naturally analytical for written prep
  if (categorySlug === "opinion" || /মতামত|সম্পাদকীয়|কলাম|বিশ্লেষণ/i.test(title)) {
    return {
      isRelevant: true,
      reason: "EDITORIAL_AND_OPINION",
      examPhase: "WRITTEN",
      suggestedExamTrack: "বিসিএস লিখিত: সমকালীন বিশ্লেষণ, অনুবাদ ও মুক্তমত",
    };
  }

  // Default: If it has reasonable substance without negative triggers, accept under general prep
  return {
    isRelevant: true,
    reason: "GENERAL_ACADEMIC_PASS",
    examPhase: "PRELIM",
    suggestedExamTrack: "বিসিএস, বিশ্ববিদ্যালয় ভর্তি ও সাম্প্রতিক ঘটনাবলি",
  };
}
