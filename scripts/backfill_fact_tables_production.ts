import { PrismaClient } from '@prisma/client';
import { extractFactTable } from '../src/lib/scraper/examFilter';

const prisma = new PrismaClient();

async function main() {
  console.log('=== COMMENCING PRODUCTION FACT TABLE RE-EXTRACTION & SANITIZATION ===');
  const articles = await prisma.article.findMany({
    include: {
      category: true,
    },
  });

  console.log(`Found ${articles.length} articles to audit and update.`);

  let updatedCount = 0;
  let weirdFixedCount = 0;

  for (const article of articles) {
    const categoryName = article.category?.name || 'জাতীয় পরিক্রমা';
    const oldFactTableRaw = article.factTable || '';
    if (oldFactTableRaw.includes('সংক্রান্ত সংশ্লিষ্ট কর্তৃপক্ষ')) {
      weirdFixedCount++;
    }

    const newFactTable = extractFactTable(
      article.title,
      article.content || article.summary || '',
      categoryName,
      article.sourceName || undefined
    );

    await prisma.article.update({
      where: { id: article.id },
      data: {
        factTable: JSON.stringify(newFactTable),
      },
    });

    updatedCount++;
    if (updatedCount % 50 === 0) {
      console.log(`Processed ${updatedCount}/${articles.length} articles...`);
    }
  }

  console.log(`\n=== AUDIT & RE-EXTRACTION COMPLETE ===`);
  console.log(`Total Articles Updated: ${updatedCount}`);
  console.log(`Articles with Broken/Weird Authority Fixed: ${weirdFixedCount}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
