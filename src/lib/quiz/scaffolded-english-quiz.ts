/**
 * Scaffolded English Active Recall Quiz Engine for KhoboraKhobor Learners.
 * 
 * Rules:
 * 1. Question stems are written in clear, conversational Bangla with the target English word embedded.
 * 2. Options remain in English with plain Bengali meanings provided in brackets.
 * 3. Explanations provide high-yield grammar and contextual learning tips in Bangla.
 */

export interface ScaffoldedQuizQuestion {
  id: string;
  question: string;
  options: string[]; // e.g. ["Control or restrain (নিয়ন্ত্রণ বা রাশ টেনে ধরা)", ...]
  correctOption: number;
  explanation: string;
  topicTag: string;
}

interface VocabQuizItem {
  targetWord: string;
  correctEn: string;
  correctBn: string;
  distractors: [
    { en: string; bn: string },
    { en: string; bn: string },
    { en: string; bn: string }
  ];
  explanationTip: string;
}

const HIGH_YIELD_SCAFFOLDED_BANK: Record<string, VocabQuizItem> = {
  austerity: {
    targetWord: "austerity",
    correctEn: "Measures to reduce government spending",
    correctBn: "ব্যয়সংকোচন বা কৃচ্ছ্রসাধন নীতি",
    distractors: [
      { en: "Massive luxury spending", bn: "বিলাসবহুল অতিরিক্ত খরচ" },
      { en: "Printing unlimited new money", bn: "অতিরিক্ত নতুন টাকা ছাপানো" },
      { en: "Borrowing from foreign individuals", bn: "ব্যক্তিগত বিদেশি ঋণ গ্রহণ" },
    ],
    explanationTip: "Austerity শব্দের মূল অর্থ রাষ্ট্রীয় বা প্রাতিষ্ঠানিক ব্যয় কমানোর কঠোর কৃচ্ছ্রসাধন নীতি।",
  },
  inflation: {
    targetWord: "inflation",
    correctEn: "Continuous increase in overall price levels",
    correctBn: "দ্রব্যমূল্যের ক্রমাগত বৃদ্ধি ও অর্থের মান হ্রাস",
    distractors: [
      { en: "Sudden drop in vegetable prices", bn: "সবজির দামের আকস্মিক পতন" },
      { en: "Increase in national foreign reserves", bn: "বৈদেশিক মুদ্রার রিজার্ভ বৃদ্ধি" },
      { en: "Total closure of import markets", bn: "আমদানি বাজার পুরোপুরি বন্ধ হওয়া" },
    ],
    explanationTip: "Inflation বা মূল্যস্ফীতি বলতে পণ্য ও সেবার সামগ্রিক দাম বৃদ্ধিকে বোঝায়।",
  },
  sovereignty: {
    targetWord: "sovereignty",
    correctEn: "Supreme and independent state authority",
    correctBn: "স্বাধীন রাষ্ট্রের সর্বোচ্চ ও চূড়ান্ত শাসনক্ষমতা",
    distractors: [
      { en: "Foreign military occupation", bn: "বিদেশি সামরিক দখলদারিত্ব" },
      { en: "Voluntary regional surrender", bn: "আঞ্চলিক নিয়ন্ত্রণ সমর্পণ" },
      { en: "Commercial merchant alliance", bn: "ব্যবসায়িক বণিকদের জোট" },
    ],
    explanationTip: "Sovereignty হলো বিদেশি শক্তির নিয়ন্ত্রণহীন নিজ ভূখণ্ডের ওপর রাষ্ট্রের সর্বোচ্চ সার্বভৌম ক্ষমতা।",
  },
  deteriorate: {
    targetWord: "deteriorate",
    correctEn: "To become progressively worse",
    correctBn: "ধীরে ধীরে অবনতি ঘটা বা আরও খারাপ হওয়া",
    distractors: [
      { en: "To recover and improve rapidly", bn: "দ্রুত সেরে ওঠা বা উন্নতি করা" },
      { en: "To remain completely constant", bn: "সম্পূর্ণ অপরিবর্তিত থাকা" },
      { en: "To double in financial value", bn: "দ্বিগুণ আর্থিক মান অর্জন করা" },
    ],
    explanationTip: "Deteriorate একটি ক্রিয়াপদ (Verb), যার অর্থ ক্রমাগত খারাপ বা সংকটজনক দশায় পৌঁছানো।",
  },
  alleviate: {
    targetWord: "alleviate",
    correctEn: "To make suffering or a problem less severe",
    correctBn: "কষ্ট, বেদনা বা সমস্যার তীব্রতা কমানো",
    distractors: [
      { en: "To worsen an existing dispute", bn: "বিদ্যমান বিরোধ আরও জটিল করে তোলা" },
      { en: "To destroy an economic bridge", bn: "অর্থনৈতিক অবকাঠামো ধ্বংস করা" },
      { en: "To double domestic interest rates", bn: "অভ্যন্তরীণ সুদের হার দ্বিগুণ করা" },
    ],
    explanationTip: "Alleviate মানে কোনো সমস্যার তীব্রতা উপশম বা প্রশমিত করা (যেমন: alleviate poverty/traffic)।",
  },
  resilience: {
    targetWord: "resilience",
    correctEn: "Ability to quickly recover from difficulties",
    correctBn: "সংকটের ধাক্কা সামলে দ্রুত ঘুরে দাঁড়ানোর ক্ষমতা",
    distractors: [
      { en: "Extreme physical fragility", bn: "চরম ভঙ্গুরতা বা দুর্বলতা" },
      { en: "Total refusal to work", bn: "কাজকর্মে অংশ নিতে সরাসরি অস্বীকৃতি" },
      { en: "Complete lack of adaptability", bn: "অভিযোজন ক্ষমতার সামগ্রিক অভাব" },
    ],
    explanationTip: "Resilience অর্থনীতি বা ব্যক্তির ক্ষেত্রে বিপর্যয়ের ধাক্কা সামলে ঘুরে দাঁড়ানোর ইতিবাচক ক্ষমতা।",
  },
  rein_in: {
    targetWord: "rein in",
    correctEn: "Control or restrain something strictly",
    correctBn: "নিয়ন্ত্রণ করা বা শক্তভাবে রাশ টেনে ধরা",
    distractors: [
      { en: "Accelerate without any limits", bn: "সীমাহীনভাবে গতি আরও বাড়িয়ে দেওয়া" },
      { en: "Postpone indefinitely", bn: "অনির্দিষ্টকালের জন্য পিছিয়ে দেওয়া" },
      { en: "Ignore and overlook completely", bn: "পুরোপুরি উপেক্ষা বা এড়িয়ে চলা" },
    ],
    explanationTip: "Rein in একটি প্রচলিত phrasal verb, যার অর্থ লাগাম টেনে ধরা বা কঠোরভাবে নিয়ন্ত্রণ করা।",
  },
  curb: {
    targetWord: "curb",
    correctEn: "Restrain or keep in check",
    correctBn: "দমন করা, সংবরণ করা বা রাশ টানা",
    distractors: [
      { en: "Promote and encourage widely", bn: "ব্যাপকভাবে উৎসাহিত বা সম্প্রসারিত করা" },
      { en: "Double public subsidies", bn: "সরকারি ভর্তুকি দ্বিগুণ করা" },
      { en: "Celebrate an annual festival", bn: "বার্ষিক কোনো উৎসব উদযাপন করা" },
    ],
    explanationTip: "Curb শব্দের অর্থ কোনো নেতিবাচক কার্যকলাপ বা অতিরিক্ত খরচকে নিয়ন্ত্রণ বা দমন করা।",
  },
};

/**
 * Generates an array of scaffolded micro-quizzes aligned with the article
 */
export function generateScaffoldedEnglishQuiz(
  articleTitle: string,
  articleContent: string
): ScaffoldedQuizQuestion[] {
  const combined = `${articleTitle} ${articleContent}`.toLowerCase();
  const questions: ScaffoldedQuizQuestion[] = [];
  let idCounter = 1;

  // 1. Vocabulary in Context Questions
  for (const [key, item] of Object.entries(HIGH_YIELD_SCAFFOLDED_BANK)) {
    const searchWord = key.replace("_", " ");
    const regex = new RegExp(`\\b${searchWord}\\b`, "i");

    if (regex.test(combined)) {
      // Build options with brackets
      const correctOptionText = `${item.correctEn} (${item.correctBn})`;
      const distractorTexts = item.distractors.map((d) => `${d.en} (${d.bn})`);

      // Deterministic placement or position 0/1/2 based on length
      const allOpts = [
        correctOptionText,
        distractorTexts[0],
        distractorTexts[1],
        distractorTexts[2],
      ];

      // Shuffle options deterministically
      const correctIndex = (key.length + idCounter) % 4;
      const temp = allOpts[0];
      allOpts[0] = allOpts[correctIndex];
      allOpts[correctIndex] = temp;

      questions.push({
        id: `scaffold-vocab-${key}-${idCounter++}`,
        question: `এই প্যাসেজে "${item.targetWord}" শব্দটা দিয়ে কী বোঝানো হয়েছে?`,
        options: allOpts,
        correctOption: correctIndex,
        explanation: `${item.explanationTip} সঠিক উত্তর: "${item.correctEn}" (${item.correctBn})।`,
        topicTag: "শব্দার্থ ও প্রেক্ষাপট",
      });

      if (questions.length >= 2) break;
    }
  }

  // 2. Preposition / Collocation Spotter Challenge
  if (combined.includes("comply") || combined.includes("compliance")) {
    questions.push({
      id: `scaffold-prep-${idCounter++}`,
      question: `প্যাসেজে "comply" শব্দের পর কোন Preposition-টি মানানসইভাবে বসেছে?`,
      options: [
        "with (নিয়ম বা আইন মেনে চলার ক্ষেত্রে)",
        "to (কারো প্রতি নির্দেশনা দেওয়া)",
        "for (নির্দিষ্ট উদ্দেশ্যের ক্ষেত্রে)",
        "against (বিরোধিতা বা সংঘাত বোঝাতে)",
      ],
      correctOption: 0,
      explanation: "ইংরেজি ব্যাকরণে নিয়ম, শর্ত বা আইন মানার ক্ষেত্রে সবসময় 'comply with' ব্যবহৃত হয়।",
      topicTag: "উপযুক্ত প্রিপজিশন",
    });
  } else if (combined.includes("depend") || combined.includes("dependent")) {
    questions.push({
      id: `scaffold-prep-${idCounter++}`,
      question: `প্যাসেজে "depend" শব্দের সাথে উপযুক্ত কোন Preposition-টি ব্যবহৃত হয়?`,
      options: [
        "on / upon (কারো বা কিছুর ওপর নির্ভর করা)",
        "in (অভ্যন্তরীণ ক্ষেত্রে)",
        "at (নির্দিষ্ট স্থান বোঝাতে)",
        "by (মাধ্যমে বা উপায়ে)",
      ],
      correctOption: 0,
      explanation: "নির্ভরশীলতা প্রকাশের ক্ষেত্রে 'depend on' বা 'depend upon' ব্যবহৃত হয়।",
      topicTag: "উপযুক্ত প্রিপজিশন",
    });
  }

  // 3. Cloze Test / Missing Verb Challenge
  if (combined.includes("rate") || combined.includes("hike") || combined.includes("inflation")) {
    questions.push({
      id: `scaffold-cloze-${idCounter++}`,
      question: `নিচের বাক্যের শূন্যস্থানে প্যাসেজের প্রেক্ষাপট অনুযায়ী কোন শব্দটি সবচেয়ে মানানসই?\n"The authorities decided to _______ key interest rates to fight inflation."`,
      options: [
        "hike (সুদের হার বৃদ্ধি করা)",
        "demolish (ভেঙে ফেলা বা গুঁড়িয়ে দেওয়া)",
        "hesitate (সিদ্ধান্ত নিতে দ্বিধা করা)",
        "forget (উপেক্ষা করে ভুলে যাওয়া)",
      ],
      correctOption: 0,
      explanation: "মূল্যস্ফীতি নিয়ন্ত্রণে কেন্দ্রীয় ব্যাংক সাধারণত সুদের হার বাড়ায় (hike interest rates)।",
      topicTag: "শূন্যস্থান পূরণ",
    });
  }

  // 4. Default Guaranteed Vocabulary Question if none matched
  if (questions.length === 0) {
    const defaultItem = HIGH_YIELD_SCAFFOLDED_BANK["inflation"];
    questions.push({
      id: `scaffold-vocab-default-${idCounter++}`,
      question: `ইংরেজি সংবাদে "${defaultItem.targetWord}" শব্দটা দিয়ে সাধারণত কী বোঝানো হয়?`,
      options: [
        `${defaultItem.correctEn} (${defaultItem.correctBn})`,
        `${defaultItem.distractors[0].en} (${defaultItem.distractors[0].bn})`,
        `${defaultItem.distractors[1].en} (${defaultItem.distractors[1].bn})`,
        `${defaultItem.distractors[2].en} (${defaultItem.distractors[2].bn})`,
      ],
      correctOption: 0,
      explanation: defaultItem.explanationTip,
      topicTag: "শব্দার্থ ও প্রেক্ষাপট",
    });
  }

  return questions;
}
