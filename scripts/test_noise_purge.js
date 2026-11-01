const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Precise title and lead regexes targeting ONLY actors, gossip, local murders & petty crimes
const CELEBRITY_SHOWBIZ_TITLE_PATTERNS = [
  /শাকিব\s*খান/i, /বুবলী/i, /পরীমণি/i, /অপু\s*বিশ্বাস/i, /মেহজাবীন/i, /জেসিয়া/i, /জেসিয়া/i, /পূজা\s*চেরী/i,
  /মারিয়া\s*শান্ত/i, /তাহসান/i, /মিথিলা/i, /অনন্ত\s*জলিল/i, /হিরো\s*আলম/i, /জায়েদ\s*খান/i, /শাহরুখ/i, /সালমান\s*খান/i,
  /প্যাট্রিক\s*স্টুয়ার্ট/i, /প্যাট্রিক\s*স্টুয়ার্ট/i,
  /shakib/i, /bubly/i, /porimoni/i, /mehazabien/i, /jesia/i, /puja\s*cherry/i, /shahrukh/i,

  /অভিনেত্রী/i, /অভিনেতা/i, /নায়িকা/i, /নায়ক/i, /সেলিব্রিটি/i, /শোবিজ/i, /গ্ল্যামার/i, /বিগ\s*বস/i,
  /সিনেমার\s*পোস্টার/i, /সংলাপ/i, /নাটকের/i, /ওটিটি/i, /ট্রেলার/i, /টিজার/i,
  /নতুন\s*মুখের\s*অভিষেক/i, /চার\s*জুটির\s*চার\s*রকম\s*প্রেম/i, /নায়িকা\s*আমার\s*মা/i,

  /প্রেমের\s*গুঞ্জন/i, /বিচ্ছেদের\s*পর/i, /তালাক/i, /দ্বিতীয়\s*স্ত্রী/i, /বিয়ে\s*করলেন/i,

  /ফ্যাশন\s*ডায়েরি/i, /উষ্ণতা\s*ছড়ানো/i, /স্নিগ্ধ\s*লুক/i, /কনে\s*সাজে/i, /বোল্ড\s*লুক/i,
  /দেখুন\s*[০-৯0-9]+\s*ছবি/i, /ছবিতে\s*দেখুন/i, /সোশ্যাল\s*মিডিয়ায়\s*ভাইরাল/i, /একঝলক/i, /TOP\s*SHOTS/i,
];

const LOCAL_CRIME_AND_MURDER_TITLE_PATTERNS = [
  /কুপিয়ে\s*হত্যা/i, /গুলি\s*করে\s*হত্যা/i, /নেতা\s*(?:খুন|হত্যা)/i, /কর্মী\s*(?:খুন|হত্যা)/i,
  /খুনের\s*দায়ে/i, /ছাত্রদল\s*নেতা/i,
  /ডাকাতি/i, /ছিনতাই/i, /লুটপাট/i, /হামলা-লুটপাট/i, /রেকি/i,
  /আইফোন\s*ছিনিয়ে/i, /আইফোন\s*ছিনিয়ে/i,
  /মাটির\s*ব্যবসা\s*নিয়ে\s*বিরোধ/i, /ব্যবসা\s*নিয়ে\s*বিরোধ/i,
  /চুনকালি\s*মাখিয়ে/i, /বিয়েতে\s*রাজি\s*না\s*হওয়ায়/i,
  /তাহসিফ/i, /সাউরি/i, /পুতুলের\s*মতো\s*মেয়েটা/i, /মরদেহ\s*আসছে/i,
  /অজ্ঞাত\s*(?:লাশ|মরদেহ)/i, /মরদেহ\s*উদ্ধার/i, /লাশ\s*উদ্ধার/i, /ঝুলন্ত\s*লাশ/i,
  /গলায়\s*ফাঁস/i, /বিষপান/i, /ভাইয়ের\s*হাতে\s*ভাই/i, /স্বামীর\s*হাতে\s*স্ত্রী/i, /স্ত্রীর\s*হাতে\s*স্বামী/i,
  /জমি\s*নিয়ে\s*বিরোধ/i, /পারিবারিক\s*কলহ/i, /যৌতুক/i, /গৃহকর্মী\s*নির্যাতন/i,
  /আধিপত্য\s*বিস্তার/i, /ককটেল\s*বিস্ফোরণ/i, /সিট\s*দখল/i, /দুই\s*গ্রুপের\s*সংঘর্ষ/i, /দুই\s*পক্ষের\s*সংঘর্ষ/i,
  /হাসপাতাল\s*ছাড়েনি\s*মোরগ/i, /মোরগ.*হাসপাতাল/i, /পদ্মার\s*শুশুক/i, /বাগাড়\s*মাছ/i,
  /দাঁত\s*শিরশির/i, /অলৌকিক/i, /জিন-পরীর/i, /কবিরাজি/i,
];

function isTitleOrSummaryNoise(title, summary) {
  const text = `${title} ${summary || ""}`.toLowerCase();

  // Exemption for state commissions / historical events
  if (/গুম\s*সংক্রান্ত\s*কমিশন|গুমের\s*শিকার|আন্তর্জাতিক\s*অপরাধ\s*ট্রাইব্যুনাল|কিসিঞ্জার|মুক্তিযুদ্ধ|বঙ্গবন্ধু/i.test(text)) {
    return false;
  }
  // Exemption for health institute governance
  if (/আইইডিসিআর.*তদন্ত/i.test(text)) {
    return false;
  }

  for (const rx of CELEBRITY_SHOWBIZ_TITLE_PATTERNS) {
    if (rx.test(text)) return { isNoise: true, reason: "ACTOR_OR_SHOWBIZ", match: rx.toString() };
  }

  for (const rx of LOCAL_CRIME_AND_MURDER_TITLE_PATTERNS) {
    if (rx.test(text)) return { isNoise: true, reason: "LOCAL_CRIME_OR_MURDER", match: rx.toString() };
  }

  return { isNoise: false };
}

async function run() {
  const articles = await prisma.article.findMany({
    select: { id: true, title: true, summary: true, category: { select: { name: true } } }
  });

  const noiseList = [];
  const validList = [];

  for (const a of articles) {
    const res = isTitleOrSummaryNoise(a.title, a.summary);
    if (res.isNoise) {
      noiseList.push({ ...a, reason: res.reason, match: res.match });
    } else {
      validList.push(a);
    }
  }

  console.log(`Total checked: ${articles.length}`);
  console.log(`Detected Noise: ${noiseList.length}`);
  console.log(`Preserved Academic: ${validList.length}\n`);

  console.log("=== DETECTED NOISE ARTICLES ===");
  noiseList.forEach((n, i) => {
    console.log(`${i+1}. [${n.category.name}] "${n.title}"`);
    console.log(`   -> ${n.reason} (${n.match})`);
  });
}

run().finally(() => prisma.$disconnect());
