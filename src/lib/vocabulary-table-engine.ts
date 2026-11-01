/**
 * Vocabulary Matrix Engine for KhoboraKhobor English Learning Mode.
 * Generates the 3-column Vocabulary Table for any English article:
 * 1. Word + Syllabic Bangla Phonics + Part of Speech + Audio
 * 2. Dual Meanings (Bangla + Concise English Definition + Synonyms)
 * 3. Fresh Real-Life Example Sentence (NOT from the passage) with Bengali Translation.
 */

import { getBanglaPronunciation } from "@/lib/phonetics/en-to-bn";

export interface VocabularyTableRow {
  id: string;
  word: string;
  banglaPhonetic: string;
  partOfSpeech: string;
  banglaMeaning: string;
  englishDefinition: string;
  synonyms: string[];
  antonyms?: string[];
  freshExampleEn: string;
  freshExampleBn: string;
}

// Curated bank of academic terms with guaranteed fresh practical sentences (distinct from news text)
const CURATED_VOCAB_BANK: Record<string, Omit<VocabularyTableRow, "id">> = {
  austerity: {
    word: "Austerity",
    banglaPhonetic: "অস-টের-ই-টি",
    partOfSpeech: "Noun (বিশেষ্য)",
    banglaMeaning: "ব্যয়সংকোচন নীতি / অর্থনৈতিক সংকট উত্তরণে সরকারি বা প্রাতিষ্ঠানিক কঠোর ব্যয় নিয়ন্ত্রণ।",
    englishDefinition: "Difficult economic conditions created by policies aimed at reducing public spending and debt.",
    synonyms: ["Frugality", "Thrift", "Economy", "Curtailment"],
    antonyms: ["Extravagance", "Spending spree"],
    freshExampleEn: "During the severe downturn, the university management adopted austerity measures by freezing faculty hiring.",
    freshExampleBn: "তীব্র অর্থনৈতিক মন্দার সময় নতুন শিক্ষক নিয়োগ স্থগিত রেখে বিশ্ববিদ্যালয় প্রশাসন ব্যয়সংকোচন নীতি গ্রহণ করেছিল।",
  },
  inflation: {
    word: "Inflation",
    banglaPhonetic: "ইন-ফ্লে-শন",
    partOfSpeech: "Noun (বিশেষ্য)",
    banglaMeaning: "মুদ্রাস্ফীতি / বাজারে পণ্য ও সেবার মূল্যস্তর ক্রমাগত বৃদ্ধি পাওয়া ও ক্রয়ক্ষমতা কমে যাওয়া।",
    englishDefinition: "A general increase in prices and fall in the purchasing value of money over time.",
    synonyms: ["Price spiral", "Rising cost of living", "Devaluation"],
    antonyms: ["Deflation"],
    freshExampleEn: "Households have to rethink their monthly budgets when high inflation eats into their savings.",
    freshExampleBn: "উচ্চ মূল্যস্ফীতি যখন সঞ্চয় কমিয়ে দেয়, তখন পরিবারগুলোকে তাদের মাসিক বাজেট নতুন করে সাজাতে হয়।",
  },
  sovereignty: {
    word: "Sovereignty",
    banglaPhonetic: "সভ-রিন-টি",
    partOfSpeech: "Noun (বিশেষ্য)",
    banglaMeaning: "সার্বভৌমত্ব / নিজ সীমানা ও নাগরিকদের ওপর একটি স্বাধীন রাষ্ট্রের সর্বোচ্চ ও নিরঙ্কুশ শাসনক্ষমতা।",
    englishDefinition: "The supreme power or authority of a state to govern its territory and affairs independently.",
    synonyms: ["Autonomy", "Self-governance", "Independence"],
    antonyms: ["Subjugation", "Dependency"],
    freshExampleEn: "Every independent country possesses the fundamental right to defend its territorial sovereignty.",
    freshExampleBn: "প্রতিটি স্বাধীন রাষ্ট্রের নিজ ভৌগোলিক সার্বভৌমত্ব রক্ষা করার মৌলিক অধিকার রয়েছে।",
  },
  deteriorate: {
    word: "Deteriorate",
    banglaPhonetic: "ডি-টি-রি-ও-রেইট",
    partOfSpeech: "Verb (ক্রিয়া)",
    banglaMeaning: "অবনতি ঘটা / ক্রমশ খারাপ বা সংকটজনক অবস্থায় পৌঁছানো।",
    englishDefinition: "To become progressively worse in quality, condition, or value over time.",
    synonyms: ["Worsen", "Decline", "Degrade", "Decay"],
    antonyms: ["Improve", "Enhance", "Recover"],
    freshExampleEn: "Without regular maintenance, newly constructed bridges deteriorate rapidly under heavy traffic.",
    freshExampleBn: "নিয়মিত সংস্কার কাজ না করলে অতিরিক্ত যানবাহনের চাপে নতুন নির্মিত সেতুগুলোর দ্রুত অবনতি ঘটে।",
  },
  alleviate: {
    word: "Alleviate",
    banglaPhonetic: "আ-লি-ভি-য়েইট",
    partOfSpeech: "Verb (ক্রিয়া)",
    banglaMeaning: "উপশম করা / দুঃখ, কষ্ট বা জটিল সমস্যার তীব্রতা হ্রাস করা।",
    englishDefinition: "To make suffering, deficiency, or a problem less severe and more bearable.",
    synonyms: ["Relieve", "Ease", "Mitigate", "Soothe"],
    antonyms: ["Aggravate", "Exacerbate", "Worsen"],
    freshExampleEn: "Constructing bypass roads can significantly alleviate morning traffic jams in metropolitan cities.",
    freshExampleBn: "বাইপাস সড়ক নির্মাণ মহানগরগুলোতে সকালের তীব্র যানজট উল্লেখযোগ্যভাবে উপশম করতে পারে।",
  },
  resilience: {
    word: "Resilience",
    banglaPhonetic: "রে-জিল-ই-য়েন্স",
    partOfSpeech: "Noun (বিশেষ্য)",
    banglaMeaning: "স্থিতিস্থাপকতা / চরম বিপর্যয় বা সংকটের ধাক্কা সামলে পুনরায় দ্রুত ঘুরে দাঁড়ানোর ক্ষমতা।",
    englishDefinition: "The capacity to recover quickly from difficulties and adapt to challenging conditions.",
    synonyms: ["Toughness", "Endurance", "Flexibility", "Tenacity"],
    antonyms: ["Fragility", "Vulnerability"],
    freshExampleEn: "Coastal farmers demonstrated admirable resilience by cultivating saline-tolerant crops after the cyclone.",
    freshExampleBn: "ঘূর্ণিঝড়ের পর লবণাক্ততা-সহনশীল ফসল চাষ করে উপকূলীয় কৃষকেরা প্রশংসনীয় ঘুরে দাঁড়ানোর ক্ষমতা দেখিয়েছেন।",
  },
  rein_in: {
    word: "Rein in",
    banglaPhonetic: "রেইন ইন",
    partOfSpeech: "Phrasal Verb",
    banglaMeaning: "রাশ টেনে ধরা / লাগাম ধরা বা অতিরিক্ত কোনো কিছুকে শক্তভাবে নিয়ন্ত্রণে আনা।",
    englishDefinition: "To control, restrain, or limit someone or something that is getting out of hand.",
    synonyms: ["Control", "Restrain", "Curb", "Check"],
    antonyms: ["Unleash", "Encourage"],
    freshExampleEn: "Project leaders had to rein in production costs to prevent the startup from running out of capital.",
    freshExampleBn: "স্টার্টআপটির মূলধন সংকট এড়াতে প্রকল্প প্রধানদের উৎপাদন ব্যয়ের রাশ শক্তভাবে টেনে ধরতে হয়েছিল।",
  },
  curb: {
    word: "Curb",
    banglaPhonetic: "কার্ব",
    partOfSpeech: "Verb / Noun",
    banglaMeaning: "দমন বা সংবরণ করা / কোনো নেতিবাচক কার্যকলাপ বা অনাকাঙ্ক্ষিত বৃদ্ধিকে আটকে দেওয়া।",
    englishDefinition: "To check or restrain something, especially something undesirable.",
    synonyms: ["Restrain", "Suppress", "Hinder", "Stifle"],
    antonyms: ["Promote", "Fallow"],
    freshExampleEn: "Strict digital surveillance helped the banking division curb fraudulent financial transactions.",
    freshExampleBn: "কঠোর ডিজিটাল নজরদারি ব্যাংকিং বিভাগকে প্রতারণামূলক আর্থিক লেনদেন দমন করতে সহায়তা করেছিল।",
  },
  hegemony: {
    word: "Hegemony",
    banglaPhonetic: "হে-জে-মো-নি",
    partOfSpeech: "Noun (বিশেষ্য)",
    banglaMeaning: "আধিপত্য / প্রতিবেশী বা অপেক্ষাকৃত দুর্বল অঞ্চলের ওপর কোনো পরাশক্তির একচ্ছত্র প্রভাব বা কর্তৃত্ব।",
    englishDefinition: "Leadership or predominant influence exercised by one nation or social group over others.",
    synonyms: ["Dominance", "Supremacy", "Mastery", "Ascendancy"],
    antonyms: ["Subordination", "Self-determination"],
    freshExampleEn: "Developing nations formed economic alliances to counter global trade hegemony by major superpowers.",
    freshExampleBn: "বড় পরাশক্তিগুলোর বৈশ্বিক বাণিজ্যিক আধিপত্য রুখতে উন্নয়নশীল দেশগুলো নতুন অর্থনৈতিক জোট গঠন করেছে।",
  },
  scrutiny: {
    word: "Scrutiny",
    banglaPhonetic: "স্ক্রু-টি-নি",
    partOfSpeech: "Noun (বিশেষ্য)",
    banglaMeaning: "সূক্ষ্ম যাচাই বা চুলচেরা পরীক্ষা / কোনো নথি বা কাজের গভীর ও নিরপেক্ষ মূল্যায়ন।",
    englishDefinition: "Critical observation or close examination of something.",
    synonyms: ["Inspection", "Audit", "Examination", "Investigation"],
    antonyms: ["Neglect", "Glance"],
    freshExampleEn: "Public tender documents must undergo independent financial scrutiny before contracts are awarded.",
    freshExampleBn: "চুক্তি অনুমোদনের আগে সরকারি দরপত্রের নথিগুলো স্বাধীন আর্থিক নিরীক্ষার মুখোমুখি হতে হবে।",
  },
  unprecedented: {
    word: "Unprecedented",
    banglaPhonetic: "আন-প্রে-সি-ডেন-টেড",
    partOfSpeech: "Adjective (বিশেষণ)",
    banglaMeaning: "নজিরবিহীন / অতীতে যার কোনো তুলনীয় দৃষ্টান্ত বা নজির খুঁজে পাওয়া যায় না।",
    englishDefinition: "Never done, known, or experienced before.",
    synonyms: ["Novel", "Groundbreaking", "Incomparable", "Unrivaled"],
    antonyms: ["Common", "Routine", "Precedented"],
    freshExampleEn: "The breakthrough medical vaccine was approved with unprecedented speed by global health authorities.",
    freshExampleBn: "যুগান্তকারী চিকিৎসাবিজ্ঞান সংক্রান্ত টিকাটি বৈশ্বিক স্বাস্থ্য কর্তৃপক্ষ নজিরবিহীন দ্রুততায় অনুমোদন দিয়েছিল।",
  },
  vulnerable: {
    word: "Vulnerable",
    banglaPhonetic: "ভাল-নার-এ-বল",
    partOfSpeech: "Adjective (বিশেষণ)",
    banglaMeaning: "সুরক্ষাহীন বা ঝুঁকিপূর্ণ / আঘাত, ক্ষতি বা আক্রমণের সহজে শিকার হওয়ার আশঙ্কাযুক্ত।",
    englishDefinition: "Exposed to the possibility of being attacked or harmed, either physically or emotionally.",
    synonyms: ["Defenseless", "Susceptible", "Exposed", "Fragile"],
    antonyms: ["Protected", "Secure", "Invulnerable"],
    freshExampleEn: "Low-income urban families are particularly vulnerable to sudden surges in grocery prices.",
    freshExampleBn: "নিত্যপ্রয়োজনীয় পণ্যের আকস্মিক দাম বৃদ্ধির ক্ষেত্রে নিম্নআয়ের শহুরে পরিবারগুলো বিশেষভাবে ঝুঁকিপূর্ণ অবস্থায় পড়ে।",
  },
  consensus: {
    word: "Consensus",
    banglaPhonetic: "কন-সেন-সাস",
    partOfSpeech: "Noun (বিশেষ্য)",
    banglaMeaning: "সর্বসম্মত মতৈক্য / কোনো ইস্যুতে সংশ্লিষ্ট সকল পক্ষের মধ্যকার যৌথ সমঝোতা বা ঐক্যমত।",
    englishDefinition: "A general agreement or accord reached by a group as a whole.",
    synonyms: ["Agreement", "Concurrence", "Harmony", "Unanimity"],
    antonyms: ["Disagreement", "Dissent", "Discord"],
    freshExampleEn: "After hours of heated debate, committee members finally reached a consensus on the new education policy.",
    freshExampleBn: "কয়েক ঘণ্টার উত্তপ্ত বিতর্কের পর কমিটির সদস্যরা অবশেষে নতুন শিক্ষানীতির ওপর সর্বসম্মত মতৈক্যে পৌঁছান।",
  },
  comply: {
    word: "Comply",
    banglaPhonetic: "কম-প্লাই",
    partOfSpeech: "Verb (ক্রিয়া)",
    banglaMeaning: "মেনে চলা বা পালন করা / কোনো আইন, নীতি বা নির্দেশনার বাধ্যবাধকতা অনুযায়ী কাজ করা।",
    englishDefinition: "To act in accordance with a wish, request, command, or official regulation.",
    synonyms: ["Abide by", "Conform", "Adhere", "Obey"],
    antonyms: ["Defy", "Disobey", "Violate"],
    freshExampleEn: "All industrial manufacturing plants must strictly comply with national carbon emission standards.",
    freshExampleBn: "সকল শিল্প কারখানাকে অবশ্যই জাতীয় কার্বন নির্গমন মানদণ্ড কঠোরভাবে মেনে চলতে হবে।",
  },
  sustainable: {
    word: "Sustainable",
    banglaPhonetic: "সাস-টেই-নে-বল",
    partOfSpeech: "Adjective (বিশেষণ)",
    banglaMeaning: "টেকসই / পরিবেশ বা ভবিষ্যতের ক্ষতি না করে দীর্ঘকাল ধরে বজায় রাখার উপযোগী।",
    englishDefinition: "Able to be maintained at a certain rate or level without depleting natural resources.",
    synonyms: ["Viable", "Enduring", "Eco-friendly", "Renewable"],
    antonyms: ["Unsustainable", "Exhaustive"],
    freshExampleEn: "Investing in solar energy is essential for building a clean and sustainable power grid.",
    freshExampleBn: "একটি পরিচ্ছন্ন ও টেকসই বিদ্যুৎ গ্রিড গড়ে তুলতে সৌরশক্তিতে বিনিয়োগ করা অপরিহার্য।",
  },
};

/**
 * Extracts high-yield vocabulary terms and returns populated 3-column rows
 */
export function extractVocabularyTableRows(
  articleTitle: string,
  articleContent: string,
  existingDbVocab?: { term: string; definition: string; context?: string | null }[]
): VocabularyTableRow[] {
  const combinedText = `${articleTitle} ${articleContent}`.toLowerCase();
  const rows: VocabularyTableRow[] = [];
  const addedWords = new Set<string>();

  // 1. Check for matches against curated high-yield terms in article text
  for (const [key, data] of Object.entries(CURATED_VOCAB_BANK)) {
    const searchKey = key.replace("_", " ");
    const regex = new RegExp(`\\b${searchKey}\\b`, "i");

    if (regex.test(combinedText)) {
      addedWords.add(data.word.toLowerCase());
      rows.push({
        id: `vocab-${key}-${Date.now()}`,
        ...data,
      });
      if (rows.length >= 5) break;
    }
  }

  // 2. Incorporate any existing database terms from the article that haven't been added
  if (existingDbVocab && existingDbVocab.length > 0) {
    for (const v of existingDbVocab) {
      const cleanTerm = v.term.split("(")[0].trim();
      const lower = cleanTerm.toLowerCase();

      if (!addedWords.has(lower) && cleanTerm.length > 2) {
        addedWords.add(lower);
        const phonetic = getBanglaPronunciation(cleanTerm);

        // Check if we have curated data
        const match = CURATED_VOCAB_BANK[lower];
        if (match) {
          rows.push({
            id: `vocab-${lower}-${Date.now()}`,
            ...match,
          });
        } else {
          rows.push({
            id: `vocab-${cleanTerm}-${Date.now()}`,
            word: cleanTerm.charAt(0).toUpperCase() + cleanTerm.slice(1),
            banglaPhonetic: phonetic,
            partOfSpeech: "Vocabulary (শব্দার্থ)",
            banglaMeaning: v.definition || "নিবন্ধে ব্যবহৃত গুরুত্বপূর্ণ ইংরেজি ধারণা।",
            englishDefinition: `Key vocabulary concept relevant to journalistic analysis.`,
            synonyms: ["High-yield term"],
            freshExampleEn: `Scholars regularly employ the term "${cleanTerm}" when discussing academic frameworks.`,
            freshExampleBn: `শিক্ষাবিদরা প্রাতিষ্ঠানিক কাঠামো পর্যালোচনার সময় "${cleanTerm}" শব্দটি নিয়মিত ব্যবহার করেন।`,
          });
        }

        if (rows.length >= 6) break;
      }
    }
  }

  // 3. Fallback: If fewer than 3 words matched, populate with top academic essentials
  if (rows.length < 3) {
    const fallbacks = ["inflation", "austerity", "resilience", "curb"];
    for (const fb of fallbacks) {
      if (!addedWords.has(fb) && CURATED_VOCAB_BANK[fb]) {
        rows.push({
          id: `vocab-${fb}-${Date.now()}`,
          ...CURATED_VOCAB_BANK[fb],
        });
        if (rows.length >= 4) break;
      }
    }
  }

  return rows;
}
