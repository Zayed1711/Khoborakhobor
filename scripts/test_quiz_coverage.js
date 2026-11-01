const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    include: { category: true, quizQuestions: true }
  });

  console.log(`Analyzing ${articles.length} articles...`);

  const kissinger = articles.find(a => a.title.includes("কিসিঞ্জার"));
  if (kissinger) {
    console.log("Found Kissinger article:");
    console.log("Title:", kissinger.title);
    console.log("Current quiz in DB:", kissinger.quizQuestions[0]?.question);
    console.log("Current quiz options:", kissinger.quizQuestions[0]?.options);
  } else {
    console.log("Kissinger article not found!");
  }
}

main().finally(() => prisma.$disconnect());
