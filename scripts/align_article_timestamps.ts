import { prisma } from "../src/lib/prisma";

const BN_DIGIT_MAP: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

const BN_MONTH_MAP: Record<string, number> = {
  "জানু": 0, "ফেব": 1, "মার্চ": 2, "এপ্রিল": 3, "মে": 4, "জুন": 5,
  "জুলাই": 6, "আগস্ট": 7, "সেপ্টে": 8, "অক্টো": 9, "নভে": 10, "ডিসে": 11,
};

function parseBnPublishedAt(bnDateStr: string): { year: number; month: number; day: number } | null {
  if (!bnDateStr) return null;
  const clean = bnDateStr.replace(/,/g, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length < 3) return null;

  // Day
  const dayStr = parts[0].replace(/[০-৯]/g, (d) => BN_DIGIT_MAP[d] || d);
  const day = parseInt(dayStr, 10);

  // Month
  let month = -1;
  for (const [mName, mIdx] of Object.entries(BN_MONTH_MAP)) {
    if (parts[1].includes(mName)) {
      month = mIdx;
      break;
    }
  }

  // Year
  const yearStr = parts[2].replace(/[০-৯]/g, (d) => BN_DIGIT_MAP[d] || d);
  const year = parseInt(yearStr, 10);

  if (!isNaN(day) && month !== -1 && !isNaN(year)) {
    return { year, month, day };
  }
  return null;
}

async function main() {
  console.log("Starting Article Timestamp Alignment...");
  const articles = await prisma.article.findMany({
    select: { id: true, title: true, publishedAt: true, createdAt: true },
  });

  console.log(`Loaded ${articles.length} articles from database.`);
  let updatedCount = 0;

  for (const article of articles) {
    const parsed = parseBnPublishedAt(article.publishedAt);
    if (!parsed) continue;

    const currentCreatedAt = new Date(article.createdAt);
    const targetDate = new Date(
      Date.UTC(
        parsed.year,
        parsed.month,
        parsed.day,
        currentCreatedAt.getUTCHours(),
        currentCreatedAt.getUTCMinutes(),
        currentCreatedAt.getUTCSeconds(),
        currentCreatedAt.getUTCMilliseconds()
      )
    );

    // Check if the date parts differ
    const curYear = currentCreatedAt.getUTCFullYear();
    const curMonth = currentCreatedAt.getUTCMonth();
    const curDay = currentCreatedAt.getUTCDate();

    if (curYear !== parsed.year || curMonth !== parsed.month || curDay !== parsed.day) {
      await prisma.article.update({
        where: { id: article.id },
        data: { createdAt: targetDate },
      });
      updatedCount++;
    }
  }

  console.log(`Timestamp Alignment Complete! Updated ${updatedCount} articles to their true publication dates.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
