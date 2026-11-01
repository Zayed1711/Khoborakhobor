const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
  const articles = await prisma.article.findMany({
    select: { id: true, title: true, summary: true }
  });

  const students = await prisma.student.findMany();

  console.log(`Total Articles: ${articles.length}`);
  console.log(`Students count: ${students.length} (${students.map(s => `${s.name} <${s.email}> [${s.role}]`).join(', ')})`);
}

checkDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
