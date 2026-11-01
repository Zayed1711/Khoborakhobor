/**
 * KhoboraKhobor (খবরাখবর) - Real-Time Scraper & News Synchronization Engine
 * Removes dummy/mock data and populates database with real-time news across all 9 categories.
 */

const { PrismaClient } = require("@prisma/client");
const Parser = require("rss-parser");
const cheerio = require("cheerio");

const prisma = new PrismaClient();

const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
  },
  timeout: 15000,
});

const CATEGORY_EDITORIAL_IMAGES = {
  national: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
  world: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
  economy: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
  tech: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  opinion: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
  politics: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
  "exam-prep": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
  sports: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
  lifestyle: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
};

const VOCAB_LOOKUP = {
  মুদ্রানীতি: "দেশের অর্থ সরবরাহ, সুদের হার ও ঋণের প্রবাহ নিয়ন্ত্রণ করে মূল্যস্ফীতি নিয়ন্ত্রণের কৌশল।",
  মুদ্রাস্ফীতি: "একটি নির্দিষ্ট সময় ধরে সাধারণ পণ্য ও সেবার মূল্যস্তর ক্রমাগত বৃদ্ধি পাওয়া।",
  "সুদের হার": "ঋণ গ্রহণের জন্য ঋণগ্রহীতাকে মূলধনের অতিরিক্ত যে শতকরা অর্থ প্রদান করতে হয়।",
  বিনিয়োগ: "ভবিষ্যতে আর্থিক মুনাফা বা সম্পদ বৃদ্ধির উদ্দেশ্যে অর্থ বা সম্পদ নিয়োজিত করা।",
  কূটনীতি: "আন্তর্জাতিক সম্পর্কের ক্ষেত্রে বিভিন্ন রাষ্ট্রের মধ্যে পারস্পরিক স্বার্থ রক্ষা ও আলোচনার কৌশল।",
  ভূরাজনীতি: "ভৌগোলিক অবস্থান ও প্রাকৃতিক সম্পদের ভিত্তিতে আন্তর্জাতিক ক্ষমতার ভারসাম্য ও প্রভাব।",
  "কৃত্রিম বুদ্ধিমত্তা": "কম্পিউটার সিস্টেম দ্বারা মানুষের মতো যুক্তি, শেখা ও সিদ্ধান্ত গ্রহণের প্রযুক্তি।",
  অটোমেশন: "মানুষের শারীরিক বা মানসিক শ্রমের পরিবর্তে স্বয়ংক্রিয় প্রযুক্তির মাধ্যমে কার্য সম্পাদন।",
  জলবায়ু: "কোনো বিস্তীর্ণ অঞ্চলের ৩০-৪০ বছরের গড় আবহাওয়ার সামগ্রিক রূপান্তর ও চিত্র।",
  নবায়নযোগ্য: "এমন শক্তির উৎস যা ব্যবহারের পর নিঃশেষ হয় না, যেমন সৌর, বায়ু ও পানিবিদ্যুৎ।",
  গণতন্ত্র: "জনগণের প্রত্যক্ষ বা পরোক্ষ অংশগ্রহণে পরিচালিত শাসনব্যবস্থা ও নাগরিক অধিকারের সুরক্ষা।",
  নির্বাচন: "জনগণের সাংবিধানিক ভোটাধিকার প্রয়োগের মাধ্যমে প্রতিনিধি নির্বাচনের গণতান্ত্রিক প্রক্রিয়া।",
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

function detectCategory(title, link, categories) {
  const l = (link || "").toLowerCase();
  const c = (categories || []).map((x) => String(x).toLowerCase()).join(" ");
  const t = (title || "").toLowerCase();

  if (l.includes("/world/") || l.includes("/middle-east/") || c.includes("আন্তর্জাতিক") || c.includes("মধ্যপ্রাচ্য") || t.includes("ইসরায়েল") || t.includes("জাতিসংঘ") || t.includes("যুক্তরাষ্ট্র")) {
    return "world";
  }
  if (l.includes("/business/") || l.includes("/economy/") || c.includes("অর্থনীতি") || c.includes("বাণিজ্য") || c.includes("শেয়ার") || t.includes("ব্যাংক") || t.includes("শেয়ার") || t.includes("মূল্যস্ফীতি") || t.includes("টাকা")) {
    return "economy";
  }
  if (l.includes("/technology/") || l.includes("/tech/") || c.includes("প্রযুক্তি") || c.includes("বিজ্ঞান") || t.includes("এআই") || t.includes("সফটওয়্যার") || t.includes("স্মার্টফোন")) {
    return "tech";
  }
  if (l.includes("/opinion/") || c.includes("মতামত") || c.includes("সম্পাদকীয়") || t.includes("মতামত") || t.includes("কলাম")) {
    return "opinion";
  }
  if (l.includes("/politics/") || c.includes("রাজনীতি") || t.includes("নির্বাচন") || t.includes("ভোট") || t.includes("দল") || t.includes("আসন")) {
    return "politics";
  }
  if (l.includes("/sports/") || c.includes("খেলা") || c.includes("ক্রিকেট") || t.includes("ম্যাচ") || t.includes("উইকেট") || t.includes("গোল")) {
    return "sports";
  }
  if (l.includes("/education/") || c.includes("শিক্ষা") || c.includes("চাকরি") || t.includes("পরীক্ষা") || t.includes("বিসিএস") || t.includes("ভর্তি")) {
    return "exam-prep";
  }
  if (l.includes("/lifestyle/") || c.includes("জীবনযাপন") || t.includes("স্বাস্থ্য") || t.includes("ডেঙ্গু")) {
    return "lifestyle";
  }
  return "national";
}

function extractTakeaways(title, text) {
  const sentences = text
    .replace(/<[^>]*>/g, " ")
    .split(/।|\.|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 160 && !s.includes("বিজ্ঞাপন") && !s.includes("ছবি:"));

  const list = [];
  if (sentences.length > 0) list.push(sentences[0] + "।");
  if (sentences.length > 1) list.push(sentences[1] + "।");
  if (sentences.length > 2) list.push(sentences[2] + "।");

  return list.length > 0 ? list : [`${title} সম্পর্কে বিস্তারিত প্রতিবেদন প্রকাশিত হয়েছে।`];
}

function extractVocabTerms(text) {
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
    explanation: `প্রতিবেদনটিতে ${categoryName} বিষয়ের বাস্তব গতিপ্রকৃতি, প্রাসঙ্গিক তথ্য এবং নাগরিক জীবনে এর গুরুত্ব তুলে ধরা হয়েছে।`,
  };
}

async function fetchFullPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9,bn;q=0.8",
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
        !t.startsWith("Follow us")
      ) {
        paras.push(`<p>${t}</p>`);
      }
    });

    return {
      content: paras.slice(0, 12).join("\n"),
      imageUrl: ogImage,
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log("==========================================================");
  console.log("  খবরাখবর (KhoboraKhobor) Real-Time Scraper Engine        ");
  console.log("==========================================================");

  // 1. Ensure Categories Exist
  const CATEGORIES = [
    { name: "জাতীয় পরিক্রমা", slug: "national", color: "red" },
    { name: "আন্তর্জাতিক সম্পর্ক", slug: "world", color: "indigo" },
    { name: "অর্থনীতি ও ব্যাংকিং", slug: "economy", color: "emerald" },
    { name: "বিজ্ঞান ও প্রযুক্তি", slug: "tech", color: "violet" },
    { name: "বিসিএস ও সাধারণ জ্ঞান", slug: "exam-prep", color: "amber" },
    { name: "সম্পাদকীয় ও কলাম", slug: "opinion", color: "rose" },
    { name: "রাজনীতি ও সুশাসন", slug: "politics", color: "blue" },
    { name: "খেলাধুলা", slug: "sports", color: "orange" },
    { name: "জীবনযাপন ও শিক্ষা", slug: "lifestyle", color: "teal" },
  ];

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, color: cat.color },
      create: { name: cat.name, slug: cat.slug, color: cat.color },
    });
  }

  const allCategories = await prisma.category.findMany();
  const catMap = new Map(allCategories.map((c) => [c.slug, c.id]));

  // 3. Clear Out Old Dummy / Mock Articles
  const dummySlugs = [
    "metro-rail-extended-route-operations-announced",
    "ai-revolution-transforming-bangladesh-software-exports",
    "inflation-control-monetary-policy-analysis",
    "editorial-future-of-education-and-critical-thinking",
  ];

  for (const dSlug of dummySlugs) {
    await prisma.article.deleteMany({ where: { slug: dSlug } });
  }

  console.log("🧹 Cleaned obsolete dummy records from database.");

  // 4. Live Scrape Sources
  const FEEDS = [
    {
      name: "প্রথম আলো",
      url: "https://www.prothomalo.com/feed",
      defaultCategory: "national",
      examTrack: "বিসিএস, বিশ্ববিদ্যালয় ভর্তি ও সাম্প্রতিক পরিক্রমা",
      limit: 30,
    },
    {
      name: "বিবিসি বাংলা",
      url: "https://feeds.bbci.co.uk/bengali/rss.xml",
      defaultCategory: "world",
      examTrack: "আন্তর্জাতিক সম্পর্ক ও বিজ্ঞান গবেষণা",
      limit: 10,
    },
    {
      name: "The Business Standard",
      url: "https://www.tbsnews.net/rss.xml",
      defaultCategory: "economy",
      examTrack: "ব্যাংকিং ও অর্থনৈতিক রূপরেখা",
      limit: 8,
    },
  ];

  let totalSaved = 0;
  let isFirstLead = true;

  for (const feedConfig of FEEDS) {
    console.log(`📡 Fetching live feed: ${feedConfig.name}...`);
    try {
      const feed = await parser.parseURL(feedConfig.url);
      console.log(`   Found ${feed.items.length} items in ${feedConfig.name}.`);

      let count = 0;
      for (const item of feed.items) {
        if (count >= feedConfig.limit) break;

        const title = item.title?.trim();
        if (!title || title.length < 8) continue;

        // Skip celebrity gossip, actors, local murders and petty disputes
        if (isNoise(title + " " + (item.contentSnippet || ""))) {
          console.log(`   ⏭ Skipping non-academic noise: "${title.slice(0, 45)}..."`);
          continue;
        }

        // Clean slug
        const rawSlug = title
          .toLowerCase()
          .replace(/[^\w\u0980-\u09FF]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 48);

        // Deduplication check
        const existing = await prisma.article.findFirst({
          where: {
            OR: [{ slug: { startsWith: rawSlug } }, { title }],
          },
        });

        if (existing) continue;

        // Categorize
        const catSlug = detectCategory(title, item.link, item.categories);
        const categoryId = catMap.get(catSlug) || catMap.get("national");
        const category = allCategories.find((c) => c.id === categoryId);

        // Extract deep page content & image
        let content = "";
        let ogImage = null;

        if (item.link) {
          const pageData = await fetchFullPage(item.link);
          if (pageData) {
            content = pageData.content;
            ogImage = pageData.imageUrl;
          }
        }

        if (!content || content.length < 100) {
          const rawSnippet = item.contentSnippet || item.summary || item.content || title;
          content = `<p class="lead">${rawSnippet}</p><p>বিশদ বিশ্লেষণের জন্য নিয়মিত চোখ রাখুন খবরাখবর প্ল্যাটফর্মে।</p>`;
        }

        const summary =
          (item.contentSnippet || content.replace(/<[^>]*>/g, " ")).slice(0, 180) + "...";

        const takeaways = extractTakeaways(title, content);
        const vocab = extractVocabTerms(title + " " + content);
        const quiz = buildMicroQuiz(title, category.name);

        const fallbackImg = CATEGORY_EDITORIAL_IMAGES[catSlug] || CATEGORY_EDITORIAL_IMAGES.national;
        const finalImage =
          ogImage && (ogImage.startsWith("http://") || ogImage.startsWith("https://"))
            ? ogImage
            : fallbackImg;

        const finalSlug = `${rawSlug}-${Math.floor(Math.random() * 900 + 100)}`;
        const isCapsule = totalSaved < 8; // Top 8 are capsules
        const isLead = isFirstLead;
        if (isLead) isFirstLead = false;

        const article = await prisma.article.create({
          data: {
            slug: finalSlug,
            title,
            summary,
            content,
            keyTakeaways: JSON.stringify(takeaways),
            examTags: feedConfig.examTrack,
            featuredImage: finalImage,
            imageCaption: `উৎস: ${feedConfig.name} • বিভাগ: ${category.name}`,
            publishedAt: new Date(item.pubDate || Date.now()).toLocaleDateString("bn-BD", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            readTime: "৩ মিনিট",
            isCapsule,
            isLead,
            categoryId,
          },
        });

        // Add vocabulary
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

        // Add micro quiz
        await prisma.quizQuestion.create({
          data: {
            articleId: article.id,
            question: quiz.question,
            options: JSON.stringify(quiz.options),
            correctOption: quiz.correctOption,
            explanation: quiz.explanation,
          },
        });

        totalSaved++;
        count++;
        console.log(`   [✓] [${category.name}] ${title.slice(0, 45)}...`);
      }
    } catch (err) {
      console.warn(`   [!] Error crawling ${feedConfig.name}:`, err.message);
    }
  }

  console.log("==========================================================");
  console.log(`🎉 Ingestion Complete! Successfully ingested ${totalSaved} real-time articles.`);
  console.log("==========================================================");
}

main()
  .catch((e) => {
    console.error("Fatal scraper error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

