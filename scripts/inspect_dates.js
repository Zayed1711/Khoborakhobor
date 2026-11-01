const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectDates() {
  const articles = await prisma.article.findMany({
    select: { id: true, publishedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total articles:', articles.length);
  const dates = new Map();
  articles.forEach(a => {
    const dStr = a.createdAt.toISOString().split('T')[0];
    dates.set(dStr, (dates.get(dStr) || 0) + 1);
  });
  console.log('Articles grouped by createdAt date:');
  for (const [d, count] of dates.entries()) {
    console.log(d, '->', count, 'articles');
  }
  console.log('Sample publishedAt strings:', articles.slice(0, 5).map(a => a.publishedAt));
}

inspectDates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

