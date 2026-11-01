const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEnglishArticles() {
  const articles = await prisma.article.findMany({
    select: { id: true, title: true, sourceName: true }
  });
  const en = articles.filter(a => !/[\u0980-\u09FF]/.test(a.title));
  console.log('Total English articles:', en.length);
  en.forEach((a, i) => console.log(`${i+1}. [${a.sourceName}] ${a.title}`));
}

checkEnglishArticles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

