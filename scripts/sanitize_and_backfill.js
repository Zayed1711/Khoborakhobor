/**
 * KhoboraKhobor Database Sanitization & Fact Sheet Backfill
 * 1. Purges non-academic noise (petty crimes, isolated deaths, gossip).
 * 2. Enriches academic articles with Fact Sheets, authoritative source names, and outbound links.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Re-implement evaluation logic for direct script execution
const NEGATIVE_PATTERNS = [
  /জমি\s*নিয়ে\s*বিরোধ/i,
  /পারিবারিক\s*কলহ/i,
  /পরকীয়া/i,
  /যৌতুক/i,
  /বিষপান/i,
  /গলায়\s*ফাঁস/i,
  /ভাইয়ের\s*হাতে\s*ভাই/i,
  /স্বামীর\s*হাতে\s*স্ত্রী/i,
  /স্ত্রীর\s*হাতে\s*স্বামী/i,
  /ছিনতাই/i,
  /চুরির\s*অভিযোগ/i,
  /গৃহকর্মী\s*নির্যাতন/i,
  /অজ্ঞাত\s*(?:লাশ|মরদেহ)/i,
  /মরদেহ\s*উদ্ধার/i,
  /লাশ\s*উদ্ধার/i,
  /ধর্ষণ/i,
  /খুনের\s*দায়ে/i,
  /tahsif/i,
  /dwip/i,
  /police\s*custody/i,
  /jumped\s*into\s*river/i,
  /dies\s*beforehand/i,
  /bodies\s*of\s*five/i,
  /shakib/i,
  /bubly/i,
  /শাকিব\s*খান/i,
  /বুবলী/i,
  /পরীমণি/i,
  /অপু\s*বিশ্বাস/i,
  /বিয়ে\s*করলেন/i,
  /সোশ্যাল\s*মিডিয়ায়\s*ভাইরাল/i,
  /অলৌকিক/i,
  /জিন-পরীর/i,
  /কবিরাজি/i,
  /আধিপত্য\s*বিস্তার/i,
  /ককটেল\s*বিস্ফোরণ/i,
  /সিট\s*দখল/i,
  /এক\s*পশলা\s*বৃষ্টি/i,
  /মোটরসাইকেল\s*আরোহী\s*নিহত/i,
  /বাসের\s*ধাক্কায়\s*নিহত/i,
];

const NEGATIVE_PATTERNS = [
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
  /মোটরসাইকেল\s*আরোহী\s*নিহত/i,
  /বাসের\s*ধাক্কায়\s*নিহত/i,
];

const WRITTEN_SURVEY_AND_POLICY_SIGNALS = [
  /বুয়েট/i,
  /বুয়েট/i,
  /এআরআই|ARI/i,
  /অ্যাকসিডেন্ট\s*রিসার্চ\s*ইনস্টিটিউট/i,
  /নিসচা/i,
  /নিরাপদ\s*সড়ক\s*চাই/i,
  /বিআরটিএ/i,
  /সড়ক\s*পরিবহন\s*আইন/i,
  /সড়ক\s*নিরাপত্তা/i,
  /সড়ক\s*দুর্ঘটনা\s*(?:জরিপ|সমীক্ষা|গবেষণা)/i,
  /ব্যালন\s*ডি['’]?অর|Ballon\s*d['’]?Or/i,
  /জাতীয়\s*ক্রীড়া\s*পুরস্কার/i,
];

function isStoryRelevant(title, content) {
  const text = `${title} ${content}`.toLowerCase();

  // State commissions and historical events are exempt
  if (/গুম\s*সংক্রান্ত\s*কমিশন|গুমের\s*শিকার|আন্তর্জাতিক\s*অপরাধ\s*ট্রাইব্যুনাল|কিসিঞ্জার|মুক্তিযুদ্ধ|বঙ্গবন্ধু|আইইডিসিআর.*তদন্ত/i.test(text)) {
    return true;
  }

  // 1. Check negative triggers FIRST - eliminates all celebrity & crime noise!
  for (const rx of NEGATIVE_PATTERNS) {
    if (rx.test(text)) return false;
  }

  // 2. Check written boosters
  const hasBooster = WRITTEN_SURVEY_AND_POLICY_SIGNALS.some((rx) => rx.test(text));
  if (hasBooster) return true;

  return true;
}

function generateFactTable(title, content, categoryName, sourceName) {
  const plain = `${title} ${content}`.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  const rows = [];

  // 1. Institution
  let institution = "জাতীয় ও আন্তর্জাতিক নীতিনির্ধারণী কর্তৃপক্ষ";
  if (/বাংলাদেশ\s*ব্যাংক/i.test(plain)) institution = "বাংলাদেশ ব্যাংক (কেন্দ্রীয় ব্যাংক)";
  else if (/অর্থ\s*মন্ত্রণালয়/i.test(plain)) institution = "অর্থ মন্ত্রণালয় ও রাজস্ব বিভাগ";
  else if (/নির্বাচন\s*কমিশন/i.test(plain)) institution = "বাংলাদেশ নির্বাচন কমিশন (ইসি)";
  else if (/বুয়েট|এআরআই/i.test(plain)) institution = "বুয়েট এক্সিডেন্ট রিসার্চ ইনস্টিটিউট (ARI)";
  else if (/বিআরটিএ/i.test(plain)) institution = "বাংলাদেশ সড়ক পরিবহন কর্তৃপক্ষ (BRTA)";
  else if (/জাতিসংঘ|UN/i.test(plain)) institution = "জাতিসংঘ (United Nations)";
  else if (/আইএমএফ|IMF/i.test(plain)) institution = "আন্তর্জাতিক মুদ্রা তহবিল (IMF)";
  else if (/বিশ্বব্যাংক|World\s*Bank/i.test(plain)) institution = "বিশ্বব্যাংক গ্রুপ (World Bank)";
  else if (/ফিফা|FIFA/i.test(plain)) institution = "ফিফা (FIFA) ও আন্তর্জাতিক ক্রীড়া পরিষদ";
  else if (/ইউনেস্কো|UNESCO/i.test(plain)) institution = "ইউনেস্কো (UNESCO)";

  rows.push({
    parameter: "নিয়ন্ত্রণকারী সংস্থা / প্রধান পক্ষ",
    value: institution,
    relevance: "সংবিধিবদ্ধ প্রাতিষ্ঠানিক এখতিয়ার ও সুশাসন",
  });

  // 2. Metrics & Numbers
  let statValue = "সমসাময়িক প্রাতিষ্ঠানিক নীতি ও কাঠামোগত সিদ্ধান্ত";
  let statRelevance = "প্রিলিমিনারি নৈর্ব্যক্তিক ও লিখিত উপাত্ত";

  const percentMatch = plain.match(/([০-৯0-9]+(?:\.[০-৯0-9]+)?\s*%\s*(?:বৃদ্ধি|হ্রাস|বৃদ্ধি পেয়ে|হ্রাস পেয়ে)?)/);
  const moneyMatch = plain.match(/([০-৯0-9]+(?:\.[০-৯0-9]+)?\s*(?:হাজার\s*)?(?:কোটি|বিলিয়ন|মিলিয়ন)\s*(?:টাকা|ডলার))/);
  const surveyMatch = plain.match(/([০-৯0-9,]+\s*(?:জন|টি|শতাংশ)\s*(?:নিহত|আহত|ক্ষতিগ্রস্ত|অংশগ্রহণকারী))/);

  if (percentMatch) {
    statValue = `সূচক পরিবর্তন: ${percentMatch[1]}`;
    statRelevance = "সামষ্টিক অর্থনীতি ও পরিসংখ্যানভিত্তিক সরাসরি প্রশ্ন";
  } else if (moneyMatch) {
    statValue = `বরাদ্দ / আর্থিক পরিমাণ: ${moneyMatch[1]}`;
    statRelevance = "বাজেট, অর্থনীতি ও উন্নয়ন প্রকল্প সংক্রান্ত উপাত্ত";
  } else if (surveyMatch) {
    statValue = `জরিপ উপাত্ত: ${surveyMatch[1]}`;
    statRelevance = "লিখিত পরীক্ষার রচনা ও বিশ্লেষণে ব্যবহারের সুনির্দিষ্ট ডেটা";
  } else {
    statValue = `${categoryName} বিষয়ক কাঠামোগত তথ্য ও সিদ্ধান্ত`;
    statRelevance = "সাধারণ জ্ঞান ও সমকালীন পর্যালোচনা";
  }

  rows.push({
    parameter: "সুনির্দিষ্ট উপাত্ত / পরিসংখ্যান",
    value: statValue,
    relevance: statRelevance,
  });

  // 3. Timeline / Law
  let timeline = "চলতি অর্থবছর ও সমসাময়িক পরিক্রমা";
  const dateMatch = plain.match(/([০-৯0-9]{1,2}\s*(?:জানুয়ারি|ফেব্রুয়ারি|মার্চ|এপ্রিল|মে|জুন|জুলাই|আগস্ট|সেপ্টেম্বর|অক্টোবর|নভেম্বর|ডিসেম্বর|January|February|March|April|May|June|July|August|September|October|November|December)\s*[০-৯0-9]{4}?)/i);
  if (dateMatch) {
    timeline = `ঘোষিত / কার্যকর সময়কাল: ${dateMatch[1]}`;
  } else if (/অধ্যাদেশ|গেজেট/i.test(plain)) {
    timeline = "রাষ্ট্রপতির অধ্যাদেশ ও সরকারি গেজেট নোটিফিকেশন";
  }

  rows.push({
    parameter: "কার্যকর সময়কাল / আইনি ভিত্তি",
    value: timeline,
    relevance: "সরকারি নীতি কার্যকর ও বাস্তবায়ন সময়রেখা",
  });

  // 4. Target Exam
  let examAngle = "বিসিএস প্রিলিমিনারি ও ব্যাংক নিয়োগ পরীক্ষা";
  if (/জরিপ|সমীক্ষা|গবেষণা|বুয়েট|নিসচা/i.test(plain)) {
    examAngle = "বিসিএস লিখিত: বাংলাদেশ বিষয়াবলি ও রচনায় কোটেশনযোগ্য ডেটা";
  } else if (/মুদ্রানীতি|ব্যাংক|রিজার্ভ|মূল্যস্ফীতি/i.test(plain)) {
    examAngle = "বাংলাদেশ ব্যাংক এডি ও বিসিএস অর্থনীতি পর্ব";
  } else if (/পুরস্কার|ব্যালন|অলিম্পিক|শিরোপা/i.test(plain)) {
    examAngle = "আন্তর্জাতিক পরিক্রমা ও সাম্প্রতিক ক্রীড়া পুরস্কার";
  }

  rows.push({
    parameter: "বিসিএস ও ভর্তি পরীক্ষার সিলেবাস কোণ",
    value: examAngle,
    relevance: "পরীক্ষার খাতায় উচ্চ নম্বর নিশ্চিতকরণ প্রস্তুতি",
  });

  return rows;
}

function resolveSourceDetails(caption, title) {
  const text = `${caption || ""} ${title || ""}`.toLowerCase();
  if (text.includes("প্রথম আলো") || text.includes("prothomalo")) {
    return { name: "প্রথম আলো", url: "https://www.prothomalo.com" };
  }
  if (text.includes("daily star") || text.includes("ডেইলি স্টার")) {
    return { name: "The Daily Star", url: "https://www.thedailystar.net" };
  }
  if (text.includes("bbc") || text.includes("বিবিসি")) {
    return { name: "বিবিসি বাংলা", url: "https://www.bbc.com/bengali" };
  }
  if (text.includes("business standard") || text.includes("tbs")) {
    return { name: "The Business Standard", url: "https://www.tbsnews.net" };
  }
  return { name: "প্রথম আলো", url: "https://www.prothomalo.com" };
}

async function run() {
  console.log("==========================================================");
  console.log("  KhoboraKhobor: Academic Sanitization & Fact Backfill    ");
  console.log("==========================================================");

  const articles = await prisma.article.findMany({
    include: { category: true },
  });

  console.log(`Found ${articles.length} existing articles in database.`);

  let deletedCount = 0;
  let enrichedCount = 0;

  for (const art of articles) {
    const isGood = isStoryRelevant(art.title, art.content);

    if (!isGood) {
      // Purge non-academic noisy stories
      await prisma.article.delete({ where: { id: art.id } });
      console.log(`❌ [PURGED NOISE] "${art.title.slice(0, 50)}..."`);
      deletedCount++;
    } else {
      // Enrich with Fact Table, sourceName, and sourceUrl
      const src = resolveSourceDetails(art.imageCaption, art.title);
      const factTable = generateFactTable(
        art.title,
        art.content,
        art.category.name,
        src.name
      );

      await prisma.article.update({
        where: { id: art.id },
        data: {
          factTable: JSON.stringify(factTable),
          sourceName: art.sourceName || src.name,
          sourceUrl: art.sourceUrl || src.url,
        },
      });

      enrichedCount++;
    }
  }

  console.log("==========================================================");
  console.log(`🎉 Complete! Purged ${deletedCount} non-exam articles.`);
  console.log(`✨ Enriched ${enrichedCount} articles with Fact Sheets & Source Links.`);
  console.log("==========================================================");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
