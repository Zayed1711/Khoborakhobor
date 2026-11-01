/**
 * KhoboraKhobor (খবরাখবর) - Universal Multi-Category Production Spider
 * Ingests fresh, real news across ALL 10 categories:
 * IR, Business, National, International Affairs, Sports, Entertainment, Science & Tech, Opinion, Lifestyle, Exam Prep.
 */

const { PrismaClient } = require("@prisma/client");
const Parser = require("rss-parser");
const cheerio = require("cheerio");

const prisma = new PrismaClient();
const rssParser = new Parser({ timeout: 10000 });

// 1. All 10 Standard Academic Editorial Categories
const CATEGORIES = [
  { name: "জাতীয় পরিক্রমা", slug: "national", color: "red", examTrack: "জাতীয় পরিক্রমা, সংবিধান ও বিসিএস" },
  { name: "আন্তর্জাতিক সম্পর্ক", slug: "world", color: "indigo", examTrack: "আন্তর্জাতিক সম্পর্ক, কূটনীতি ও ভূরাজনীতি" },
  { name: "অর্থনীতি ও বাণিজ্য", slug: "economy", color: "emerald", examTrack: "ব্যাংকিং, সামষ্টিক অর্থনীতি ও বাণিজ্য" },
  { name: "বিজ্ঞান ও প্রযুক্তি", slug: "tech", color: "violet", examTrack: "বিজ্ঞান, কৃত্রিম বুদ্ধিমত্তা ও প্রযুক্তি" },
  { name: "শিল্প, সাহিত্য ও সংস্কৃতি", slug: "entertainment", color: "purple", examTrack: "শিল্পকলা, সাহিত্য, চলচ্চিত্র ও সংস্কৃতি" },
  { name: "খেলাধুলা", slug: "sports", color: "orange", examTrack: "বিশ্ব ক্রীড়াঙ্গন ও বাংলাদেশ" },
  { name: "রাজনীতি ও সুশাসন", slug: "politics", color: "blue", examTrack: "গণতান্ত্রিক রূপরেখা ও সুশাসন" },
  { name: "সম্পাদকীয় ও কলাম", slug: "opinion", color: "rose", examTrack: "সমকালীন বিশ্লেষণ ও মুক্তমত" },
  { name: "জীবনযাপন ও শিক্ষা", slug: "lifestyle", color: "teal", examTrack: "জনস্বাস্থ্য, পরিবেশ ও শিক্ষানীতি" },
  { name: "বিসিএস ও সাধারণ জ্ঞান", slug: "exam-prep", color: "amber", examTrack: "বিসিএস প্রিলি ও বিশ্ববিদ্যালয় ভর্তি" },
];

const CATEGORY_EDITORIAL_IMAGES = {
  national: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
  world: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
  economy: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  tech: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  entertainment: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
  sports: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
  politics: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
  opinion: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
  lifestyle: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "exam-prep": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
};

const VOCAB_LOOKUP = {
  "মুদ্রানীতি": "দেশের অর্থ সরবরাহ, সুদের হার ও ঋণের প্রবাহ নিয়ন্ত্রণ করে মূল্যস্ফীতি নিয়ন্ত্রণের কৌশল।",
  "মুদ্রাস্ফীতি": "একটি নির্দিষ্ট সময় ধরে সাধারণ পণ্য ও সেবার মূল্যস্তর ক্রমাগত বৃদ্ধি পাওয়া।",
  "মূল্যস্ফীতি": "একটি নির্দিষ্ট সময় ধরে সাধারণ পণ্য ও সেবার সামগ্রিক মূল্যবৃদ্ধি।",
  "সুদের হার": "ঋণ গ্রহণের জন্য ঋণগ্রহীতাকে মূলধনের অতিরিক্ত যে শতকরা অর্থ প্রদান করতে হয়।",
  "বিনিয়োগ": "ভবিষ্যতে আর্থিক মুনাফা বা সম্পদ বৃদ্ধির উদ্দেশ্যে অর্থ বা সম্পদ নিয়োজিত করা।",
  "শেয়ারবাজার": "যেখানে তালিকাভুক্ত পাবলিক লিমিটেড কোম্পানির শেয়ার ও সিকিউরিটিজ কেনাবেচা হয়।",
  "কূটনীতি": "আন্তর্জাতিক সম্পর্কের ক্ষেত্রে বিভিন্ন রাষ্ট্রের মধ্যে পারস্পরিক স্বার্থ রক্ষা ও আলোচনার কৌশল।",
  "ভূরাজনীতি": "ভৌগোলিক অবস্থান ও প্রাকৃতিক সম্পদের ভিত্তিতে আন্তর্জাতিক ক্ষমতার ভারসাম্য ও প্রভাব।",
  "সার্বভৌমত্ব": "একটি রাষ্ট্রের অভ্যন্তরীণ বিষয়ে চূড়ান্ত কর্তৃত্ব ও বহিঃশক্তির হস্তক্ষেপমুক্ত স্বাধীনতা।",
  "কৃত্রিম বুদ্ধিমত্তা": "কম্পিউটার সিস্টেম দ্বারা মানুষের মতো যুক্তি, শেখা ও সিদ্ধান্ত গ্রহণের প্রযুক্তি।",
  "এআই": "আর্টিফিশিয়াল ইন্টেলিজেন্স বা কম্পিউটার সিস্টেমের বুদ্ধিবৃত্তিক স্বয়ংক্রিয় কার্যক্ষমতা।",
  "অটোমেশন": "মানুষের শারীরিক বা মানসিক শ্রমের পরিবর্তে স্বয়ংক্রিয় প্রযুক্তির মাধ্যমে কার্য সম্পাদন।",
  "সাইবার নিরাপত্তা": "ইন্টারনেট ও কম্পিউটার নেটওয়ার্কে সংরক্ষিত তথ্যের নিরাপত্তা ও সুরক্ষার ব্যবস্থা।",
  "জলবায়ু": "কোনো বিস্তীর্ণ অঞ্চলের ৩০-৪০ বছরের গড় আবহাওয়ার সামগ্রিক রূপান্তর ও চিত্র।",
  "নবায়নযোগ্য": "এমন শক্তির উৎস যা ব্যবহারের পর নিঃশেষ হয় না, যেমন সৌর ও বায়ুবিদ্যুৎ।",
  "গণতন্ত্র": "জনগণের প্রত্যক্ষ বা পরোক্ষ অংশগ্রহণে পরিচালিত শাসনব্যবস্থা ও নাগরিক অধিকারের সুরক্ষা।",
  "সংবিধান": "রাষ্ট্র পরিচালনার সর্বোচ্চ আইনগত ও মৌলিক প্রাতিষ্ঠানিক নীতিমালা।",
  "নির্বাচন": "জনগণের সাংবিধানিক ভোটাধিকার প্রয়োগের মাধ্যমে প্রতিনিধি নির্বাচনের গণতান্ত্রিক প্রক্রিয়া।",
  "সাহিত্য": "শিল্পিত ভাষা ও ভাবনার সমন্বয়ে রচিত মানবিক অভিজ্ঞতা ও কল্পনার চিরন্তন রূপ।",
  "চলচ্চিত্র": "দৃশ্য ও শব্দের মেলবন্ধনে নির্মিত শৈল্পিক ও সামাজিক যোগাযোগের শক্তিশালী মাধ্যম।",
};

const NOISE_FILTER_PATTERNS = [
  /শাকিব\s*খান/i, /বুবলী/i, /পরীমণি/i, /অপু\s*বিশ্বাস/i, /মেহজাবীন/i, /জেসিয়া/i, /জেসিয়া/i, /পূজা\s*চেরী/i,
  /মারিয়া\s*শান্ত/i, /তাহসান/i, /মিথিলা/i, /অনন্ত\s*জলিল/i, /হিরো\s*আলম/i, /জায়েদ\s*খান/i, /শাহরুখ/i, /সালমান\s*খান/i,
  /প্যাট্রিক\s*স্টুয়ার্ট/i, /প্যাট্রিক\s*স্টুয়ার্ট/i, /shakib/i, /bubly/i, /porimoni/i, /mehazabien/i, /jesia/i,
  /অভিনেত্রী/i, /অভিনেতা/i, /নায়িকা/i, /নায়ক/i, /সেলিব্রিটি/i, /শোবিজ/i, /গ্ল্যামার/i, /বিগ\s*বস/i,
  /সিনেমার\s*পোস্টার/i, /সংলাপ/i, /নাটকের/i, /ওটিটি/i, /ট্রেলার/i, /টিজার/i,
  /নতুন\s*মুখের\s*অভিষেক/i, /চার\s*জুটির\s*চার\s*রকম\s*প্রেম/i, /নায়িকা\s*আমার\s*মা/i,
  /প্রেমের\s*গুঞ্জন/i, /বিচ্ছেদের\s*পর/i, /তালাক/i, /দ্বিতীয়\s*স্ত্রী/i, /বিয়ে\s*করলেন/i,
  /ফ্যাশন\s*ডায়েরি/i, /উষ্ণতা\s*ছড়ানো/i, /স্নিগ্ধ\s*লুক/i, /কনে\s*সাজে/i, /বোল্ড\s*লুক/i,
  /দেখুন\s*[০-৯0-9]+\s*ছবি/i, /ছবিতে\s*দেখুন/i, /সোশ্যাল\s*মিডিয়ায়\s*ভাইরাল/i, /একঝলক/i, /TOP\s*SHOTS/i,
  /কুপিয়ে\s*হত্যা/i, /গুলি\s*করে\s*হত্যা/i, /নেতা\s*(?:খুন|হত্যা)/i, /কর্মী\s*(?:খুন|হত্যা)/i,
  /খুনের\s*দায়ে/i, /ছাত্রদল\s*নেতা/i, /ডাকাতি/i, /ছিনতাই/i, /লুটপাট/i, /হামলা-লুটপাট/i, /রেকি/i,
  /আইফোন\s*ছিনিয়ে/i, /আইফোন\s*ছিনিয়ে/i, /মাটির\s*ব্যবসা\s*নিয়ে\s*বিরোধ/i, /ব্যবসা\s*নিয়ে\s*বিরোধ/i,
  /চুনকালি\s*মাখিয়ে/i, /বিয়েতে\s*রাজি\s*না\s*হওয়ায়/i, /তাহসিফ/i, /সাউরি/i, /পুতুলের\s*মতো\s*মেয়েটা/i, /মরদেহ\s*আসছে/i,
  /অজ্ঞাত\s*(?:লাশ|মরদেহ)/i, /মরদেহ\s*উদ্ধার/i, /লাশ\s*উদ্ধার/i, /ঝুলন্ত\s*লাশ/i,
  /গলায়\s*ফাঁস/i, /বিষপান/i, /ভাইয়ের\s*হাতে\s*ভাই/i, /স্বামীর\s*হাতে\s*স্ত্রী/i, /স্ত্রীর\s*হাতে\s*স্বামী/i,
  /জমি\s*নিয়ে\s*বিরোধ/i, /পারিবারিক\s*কলহ/i, /যৌতুক/i, /গৃহকর্মী\s*নির্যাতন/i,
  /আধিপত্য\s*বিস্তার/i, /ককটেল\s*বিস্ফোরণ/i, /সিট\s*দখল/i, /দুই\s*গ্রুপের\s*সংঘর্ষ/i, /দুই\s*পক্ষের\s*সংঘর্ষ/i,
  /হাসপাতাল\s*ছাড়েনি\s*মোরগ/i, /মোরগ.*হাসপাতাল/i, /পদ্মার\s*শুশুক/i, /বাগাড়\s*মাছ/i, /দাঁত\s*শিরশির/i,
  /অলৌকিক/i, /জিন-পরীর/i, /কবিরাজি/i,
];

function isNoise(text) {
  if (/গুম\s*সংক্রান্ত\s*কমিশন|গুমের\s*শিকার|আন্তর্জাতিক\s*অপরাধ\s*ট্রাইব্যুনাল|কিসিঞ্জার|মুক্তিযুদ্ধ|বঙ্গবন্ধু|আইইডিসিআর.*তদন্ত/i.test(text)) {
    return false;
  }
  return NOISE_FILTER_PATTERNS.some((rx) => rx.test(text));
}

/**
 * Classify a story into one of the 10 categories
 */
function classifyCategory(sectionSlug, sectionName, title) {
  const s = (sectionSlug || "").toLowerCase();
  const sn = (sectionName || "").toLowerCase();
  const t = (title || "").toLowerCase();

  // 1. Tech & Science
  if (
    s.includes("tech") || s.includes("technology") || s.includes("artificial-intelligence") ||
    s.includes("biology") || s.includes("science") || sn.includes("প্রযুক্তি") || sn.includes("বিজ্ঞান") ||
    t.includes("এআই") || t.includes("স্মার্টফোন") || t.includes("সফটওয়্যার") || t.includes("প্রযুক্তি")
  ) {
    return "tech";
  }

  // 2. Economy & Business
  if (
    s.includes("business") || s.includes("economy") || s.includes("economics") || s.includes("bank") ||
    s.includes("market") || s.includes("corporate") || s.includes("industry") || sn.includes("বাণিজ্য") ||
    sn.includes("অর্থনীতি") || sn.includes("ব্যাংক") || sn.includes("শেয়ারবাজার") || sn.includes("শিল্প") ||
    t.includes("টাকা") || t.includes("ব্যাংক") || t.includes("ডলার") || t.includes("শেয়ার") || t.includes("মূল্যস্ফীতি")
  ) {
    return "economy";
  }

  // 3. World & IR
  if (
    s.includes("world") || s.includes("international") || s.includes("middle-east") || s.includes("europe") ||
    s.includes("india") || s.includes("america") || s.includes("asia") || sn.includes("বিশ্ব") ||
    sn.includes("আন্তর্জাতিক") || sn.includes("মধ্যপ্রাচ্য") || sn.includes("ভারত") || sn.includes("ইউরোপ") ||
    t.includes("ইসরায়েল") || t.includes("লেবানন") || t.includes("গাজা") || t.includes("যুক্তরাষ্ট্র") ||
    t.includes("চীন") || t.includes("রাশিয়া") || t.includes("ইউক্রেন") || t.includes("জাতিসংঘ")
  ) {
    return "world";
  }

  // 4. Entertainment & Culture
  if (
    s.includes("entertainment") || s.includes("bollywood") || s.includes("world-cinema") ||
    s.includes("books") || s.includes("ott") || s.includes("cinema") || s.includes("movie") ||
    sn.includes("বিনোদন") || sn.includes("চলচ্চিত্র") || sn.includes("নাটক") || sn.includes("গান") ||
    sn.includes("বই") || t.includes("সিনেমা") || t.includes("উপন্যাস") || t.includes("অভিনেতা") ||
    t.includes("অভিনেত্রী") || t.includes("তারকা") || t.includes("গান") || t.includes("অস্কার")
  ) {
    return "entertainment";
  }

  // 5. Sports
  if (
    s.includes("sports") || s.includes("cricket") || s.includes("football") || s.includes("tennis") ||
    sn.includes("খেলা") || sn.includes("ক্রিকেট") || sn.includes("ফুটবল") || t.includes("ম্যাচ") ||
    t.includes("উইকেট") || t.includes("গোল") || t.includes("রোনালদো") || t.includes("মেসি")
  ) {
    return "sports";
  }

  // 6. Politics & Governance
  if (
    s.includes("politics") || sn.includes("রাজনীতি") || t.includes("নির্বাচন") || t.includes("ভোট") ||
    t.includes("আওয়ামী") || t.includes("বিএনপি") || t.includes("জামায়াত") || t.includes("সংসদ") ||
    t.includes("অন্তর্বর্তী") || t.includes("উপদেষ্টা") || t.includes("জুলাই সনদ")
  ) {
    return "politics";
  }

  // 7. Editorial & Opinion
  if (
    s.includes("opinion") || s.includes("column") || s.includes("editorial") || sn.includes("মতামত") ||
    sn.includes("কলাম") || sn.includes("সম্পাদকীয়") || t.includes("কলাম") || t.includes("মতামত")
  ) {
    return "opinion";
  }

  // 8. Exam Prep & Education
  if (
    s.includes("education") || s.includes("campus") || s.includes("chakri") || sn.includes("শিক্ষা") ||
    sn.includes("ক্যাম্পাস") || sn.includes("চাকরি") || t.includes("বিশ্ববিদ্যালয়") || t.includes("ভর্তি") ||
    t.includes("বিসিএস") || t.includes("পরীক্ষা") || t.includes("শিক্ষার্থী")
  ) {
    return "exam-prep";
  }

  // 9. Lifestyle & Health
  if (
    s.includes("lifestyle") || s.includes("style") || s.includes("health") || sn.includes("জীবনযাপন") ||
    sn.includes("স্বাস্থ্য") || t.includes("ডেঙ্গু") || t.includes("খাবার") || t.includes("রোগ") ||
    t.includes("চিকিৎসা") || t.includes("পুষ্টি")
  ) {
    return "lifestyle";
  }

  // Default: National
  return "national";
}

function extractTakeaways(title, text) {
  const clean = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  const sentences = clean
    .split(/।|\.|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 160 && !s.includes("বিজ্ঞাপন") && !s.includes("ছবি:"));

  const list = [];
  if (sentences[0]) list.push(sentences[0] + "।");
  if (sentences[1]) list.push(sentences[1] + "।");
  if (sentences[2]) list.push(sentences[2] + "।");

  if (list.length === 0) {
    list.push(`${title} সংক্রান্ত প্রাতিষ্ঠানিক তথ্যাবলি এবং এর প্রাসঙ্গিক প্রভাব।`);
    list.push("সমসাময়িক ঘটনাপ্রবাহে নীতিগত পরিবর্তন ও নাগরিক সচেতনতা।");
  }
  return list;
}

function extractVocab(text) {
  const found = [];
  for (const [term, def] of Object.entries(VOCAB_LOOKUP)) {
    if (text.includes(term)) {
      found.push({
        term,
        definition: def,
        context: `প্রতিবেদনের প্রাসঙ্গিক শব্দার্থ: "${term}"`,
      });
      if (found.length >= 2) break;
    }
  }
  return found;
}

function buildMicroQuiz(title, categoryName) {
  const shortTitle = title.length > 55 ? title.slice(0, 52) + "..." : title;
  return {
    question: `প্রতিবেদনটির ("${shortTitle}") মূল প্রাতিষ্ঠানিক ও শিক্ষণীয় আলোচ্য ক্ষেত্র কোনটি?`,
    options: [
      `${categoryName}-সংক্রান্ত সাম্প্রতিক সিদ্ধান্ত, প্রাতিষ্ঠানিক রূপরেখা ও সার্বিক প্রভাব।`,
      "সামাজিক যোগাযোগ মাধ্যমের অনানুষ্ঠানিক নিছক বিনোদন আড্ডা।",
      "অতীতের কাল্পনিক পৌরাণিক আখ্যানের ঐতিহাসিক রোমাঞ্চ।",
      "বাণিজ্যিক ব্র্যান্ডের বাণিজ্যিক বিজ্ঞাপন ও মূল্যহ্রাস অফার।"
    ],
    correctOption: 0,
    explanation: `প্রতিবেদনটিতে ${categoryName} বিষয়ের বাস্তব গতিপ্রকৃতি, প্রাসঙ্গিক তথ্য এবং নাগরিক জীবনে এর তাৎপর্য তুলে ধরা হয়েছে।`,
  };
}

async function fetchFullPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    const ogImage = $("meta[property='og:image']").attr("content");
    const paras = [];

    $("p").each((_, el) => {
      const t = $(el).text().trim();
      if (
        t.length > 30 &&
        !t.includes("বিজ্ঞাপন") &&
        !t.startsWith("©") &&
        !t.startsWith("শেয়ার") &&
        !t.startsWith("Follow us") &&
        !t.includes("স্বত্ব সংরক্ষিত")
      ) {
        paras.push(`<p>${t}</p>`);
      }
    });

    return {
      content: paras.slice(0, 10).join("\n"),
      imageUrl: ogImage,
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log("==========================================================");
  console.log("  খবরাখবর (KhoboraKhobor) Universal Multi-Category Spider ");
  console.log("==========================================================");

  // 1. Ensure all 10 standard categories exist
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color },
      create: { name: cat.name, slug: cat.slug, color: cat.color },
    });
  }

  const allCategories = await prisma.category.findMany();
  const catMap = new Map(allCategories.map((c) => [c.slug, c.id]));
  console.log(`✅ Loaded ${allCategories.length} categories in database.`);

  let totalSaved = 0;
  const countByCategory = {};
  allCategories.forEach(c => countByCategory[c.slug] = 0);

  // 2. Ingest from Prothom Alo 100 Live Stories API
  console.log("\n📡 Ingesting from Prothom Alo Live Stories API (100 fresh items)...");
  try {
    const res = await fetch("https://www.prothomalo.com/api/v1/stories?limit=100", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const data = await res.json();
      const stories = data.stories || [];
      console.log(`   Fetched ${stories.length} stories from API.`);

      for (const s of stories) {
        const headline = s.headline?.trim();
        if (!headline || headline.length < 10) continue;

        // Skip non-academic noise (actors, murders, domestic feuds)
        if (isNoise(headline + " " + (s.subheadline || ""))) {
          continue;
        }

        // Clean slug
        const rawSlug = headline
          .toLowerCase()
          .replace(/[^\w\u0980-\u09FF]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 48);

        // Check deduplication
        const existing = await prisma.article.findFirst({
          where: {
            OR: [{ slug: { startsWith: rawSlug } }, { title: headline }],
          },
        });
        if (existing) continue;

        // Classify category
        const parentSec = s.sections?.find((sec) => !sec["parent-id"]) || s.sections?.[0];
        const catSlug = classifyCategory(parentSec?.slug, parentSec?.name, headline);
        const categoryId = catMap.get(catSlug) || catMap.get("national");
        const category = allCategories.find((c) => c.id === categoryId);

        // Fetch deep content if page exists
        let content = "";
        let pageImg = null;

        if (s.url) {
          const pageData = await fetchFullPage(s.url);
          if (pageData) {
            content = pageData.content;
            pageImg = pageData.imageUrl;
          }
        }

        if (!content || content.length < 80) {
          const summaryText = s.subheadline || s.summary || headline;
          content = `<p class="lead font-medium text-lg text-[#2a2f3a] mb-4">${summaryText}</p><p>বিশদ পর্যালোচনা ও প্রাতিষ্ঠানিক নীতিমালার প্রভাব নিয়ে বিস্তারিত তথ্যাবলির জন্য নিয়মিত নজর রাখুন খবরাখবর ডট কমে।</p>`;
        }

        const summary = (s.subheadline || s.summary || content.replace(/<[^>]*>/g, " ")).slice(0, 180) + "...";
        const takeaways = extractTakeaways(headline, content);
        const vocab = extractVocab(headline + " " + content);
        const quiz = buildMicroQuiz(headline, category.name);

        // Image resolve
        let finalImage = CATEGORY_EDITORIAL_IMAGES[catSlug] || CATEGORY_EDITORIAL_IMAGES.national;
        if (pageImg && pageImg.startsWith("http")) {
          finalImage = pageImg;
        } else if (s["hero-image-s3-key"]) {
          finalImage = `https://media.prothomalo.com/${encodeURIComponent(s["hero-image-s3-key"])}?w=1200&auto=format,compress`;
        }

        const pubDateObj = s["published-at"] ? new Date(s["published-at"]) : new Date();
        const publishedAt = pubDateObj.toLocaleDateString("bn-BD", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        const finalSlug = `${rawSlug}-${Math.floor(Math.random() * 900 + 100)}`;
        const isCapsule = totalSaved < 6;

        const article = await prisma.article.create({
          data: {
            slug: finalSlug,
            title: headline,
            summary,
            content,
            keyTakeaways: JSON.stringify(takeaways),
            examTags: CATEGORIES.find(c => c.slug === catSlug)?.examTrack || "বিসিএস ও সমকালীন গবেষণা",
            featuredImage: finalImage,
            imageCaption: `উৎস: প্রথম আলো • বিভাগ: ${category.name}`,
            publishedAt,
            readTime: "৩ মিনিট",
            isCapsule,
            isLead: false, // will set best lead article at end
            categoryId,
          },
        });

        // Insert vocabulary
        for (const v of vocab) {
          await prisma.vocabularyTerm.create({
            data: {
              term: v.term,
              definition: v.definition,
              context: v.context,
              articleId: article.id,
            },
          });
        }

        // Insert micro quiz
        await prisma.quizQuestion.create({
          data: {
            articleId: article.id,
            question: quiz.question,
            options: JSON.stringify(quiz.options),
            correctOption: quiz.correctOption,
            explanation: quiz.explanation,
          },
        });

        countByCategory[catSlug] = (countByCategory[catSlug] || 0) + 1;
        totalSaved++;
        console.log(`   [✓] [${category.name}] ${headline.slice(0, 48)}...`);
      }
    }
  } catch (err) {
    console.error("   [!] Error crawling Prothom Alo API:", err.message);
  }

  // 3. Ingest from BBC Bangla Live RSS Feed (Especially for IR & Science)
  console.log("\n📡 Ingesting from BBC Bangla (IR, World Affairs, Science)...");
  try {
    const feed = await rssParser.parseURL("https://feeds.bbci.co.uk/bengali/rss.xml");
    console.log(`   Found ${feed.items.length} items in BBC Bangla.`);

    for (const item of feed.items) {
      const title = item.title?.trim();
      if (!title || title.length < 8) continue;

      if (isNoise(title + " " + (item.contentSnippet || ""))) {
        continue;
      }

      const rawSlug = title
        .toLowerCase()
        .replace(/[^\w\u0980-\u09FF]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);

      const existing = await prisma.article.findFirst({
        where: {
          OR: [{ slug: { startsWith: rawSlug } }, { title }],
        },
      });
      if (existing) continue;

      const catSlug = classifyCategory("world", "আন্তর্জাতিক", title);
      const categoryId = catMap.get(catSlug) || catMap.get("world");
      const category = allCategories.find((c) => c.id === categoryId);

      let content = "";
      let pageImg = null;
      if (item.link) {
        const pageData = await fetchFullPage(item.link);
        if (pageData) {
          content = pageData.content;
          pageImg = pageData.imageUrl;
        }
      }

      if (!content || content.length < 80) {
        const snip = item.contentSnippet || item.summary || title;
        content = `<p class="lead font-medium text-lg text-[#2a2f3a] mb-4">${snip}</p><p>বিশদ আন্তর্জাতিক বিশ্লেষণের জন্য নিয়মিত চোখ রাখুন খবরাখবর পোর্টালে।</p>`;
      }

      const summary = (item.contentSnippet || content.replace(/<[^>]*>/g, " ")).slice(0, 180) + "...";
      const takeaways = extractTakeaways(title, content);
      const vocab = extractVocab(title + " " + content);
      const quiz = buildMicroQuiz(title, category.name);

      const finalImage = pageImg || CATEGORY_EDITORIAL_IMAGES[catSlug] || CATEGORY_EDITORIAL_IMAGES.world;
      const pubDateObj = item.pubDate ? new Date(item.pubDate) : new Date();
      const publishedAt = pubDateObj.toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const finalSlug = `${rawSlug}-${Math.floor(Math.random() * 900 + 100)}`;
      const article = await prisma.article.create({
        data: {
          slug: finalSlug,
          title,
          summary,
          content,
          keyTakeaways: JSON.stringify(takeaways),
          examTags: CATEGORIES.find(c => c.slug === catSlug)?.examTrack || "আন্তর্জাতিক সম্পর্ক ও কূটনীতি",
          featuredImage: finalImage,
          imageCaption: `উৎস: বিবিসি বাংলা • বিভাগ: ${category.name}`,
          publishedAt,
          readTime: "৩ মিনিট",
          isCapsule: false,
          isLead: false,
          categoryId,
        },
      });

      for (const v of vocab) {
        await prisma.vocabularyTerm.create({
          data: {
            term: v.term,
            definition: v.definition,
            context: v.context,
            articleId: article.id,
          },
        });
      }

      await prisma.quizQuestion.create({
        data: {
          articleId: article.id,
          question: quiz.question,
          options: JSON.stringify(quiz.options),
          correctOption: quiz.correctOption,
          explanation: quiz.explanation,
        },
      });

      countByCategory[catSlug] = (countByCategory[catSlug] || 0) + 1;
      totalSaved++;
      console.log(`   [✓] [${category.name}] ${title.slice(0, 48)}...`);
    }
  } catch (err) {
    console.error("   [!] Error crawling BBC Bangla:", err.message);
  }

  // 4. Ensure Leading Story is Set
  const leadArticle = await prisma.article.findFirst({
    where: { category: { slug: { in: ["national", "world", "economy"] } } },
    orderBy: { createdAt: "desc" },
  });
  if (leadArticle) {
    await prisma.article.updateMany({ data: { isLead: false } });
    await prisma.article.update({
      where: { id: leadArticle.id },
      data: { isLead: true },
    });
    console.log(`\n⭐ Designated Lead Article: "${leadArticle.title}"`);
  }

  console.log("\n==========================================================");
  console.log(`🎉 Ingestion Summary: Ingested ${totalSaved} articles!`);
  console.log("==========================================================");
  for (const cat of allCategories) {
    const totalInCat = await prisma.article.count({ where: { categoryId: cat.id } });
    console.log(`  * ${cat.name} (${cat.slug}): ${totalInCat} total articles (+${countByCategory[cat.slug] || 0} new)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

