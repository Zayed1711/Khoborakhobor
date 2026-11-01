const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCapsules() {
  const caps = await prisma.article.findMany({
    where: { isCapsule: true },
    select: { id: true, title: true, isCapsule: true, sourceName: true }
  });
  console.log('Total capsules:', caps.length);
  caps.forEach(c => console.log(`${c.id} [${c.sourceName}] ${c.title.slice(0, 60)}`));
}

checkCapsules()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

