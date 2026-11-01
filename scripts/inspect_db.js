const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { articles: true } } }
  });
  console.log('Categories count:', categories.length);
  categories.forEach(c => console.log(`Category: ${c.name} (${c.slug}) -> ${c._count.articles} articles`));

  const articles = await prisma.article.findMany({
    select: { id: true, title: true, publishedAt: true, createdAt: true, category: { select: { name: true, slug: true } } }
  });
  console.log('\nTotal articles:', articles.length);
  articles.forEach(a => console.log(`[${a.category.name}] ${a.title} | Published: ${a.publishedAt} | Created: ${a.createdAt.toISOString()}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());

