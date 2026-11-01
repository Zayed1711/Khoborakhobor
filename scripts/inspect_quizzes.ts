import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspect() {
  const articles = await prisma.article.findMany({
    take: 15,
    include: {
      category: true,
      quizQuestions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${articles.length} sample articles:\n`);
  for (const art of articles) {
    console.log(`--------------------------------------------------`);
    console.log(`ID: ${art.id}`);
    console.log(`Title: ${art.title}`);
    console.log(`Category: ${art.category.name}`);
    console.log(`Takeaways: ${art.keyTakeaways ? art.keyTakeaways.slice(0, 80) + '...' : 'none'}`);
    if (art.quizQuestions.length > 0) {
      console.log(`Quiz Question: ${art.quizQuestions[0].question}`);
      console.log(`Quiz Options: ${art.quizQuestions[0].options}`);
      console.log(`Correct: ${art.quizQuestions[0].correctOption}`);
    } else {
      console.log(`No quiz question found.`);
    }
  }

  const kissinger = await prisma.article.findFirst({
    where: { title: { contains: "কিসিঞ্জার" } },
    include: { quizQuestions: true, category: true },
  });

  console.log("\n================ KISSINGER ARTICLE ================");
  if (kissinger) {
    console.log(`Title: ${kissinger.title}`);
    console.log(`Category: ${kissinger.category.name}`);
    console.log(`Quiz Question: ${kissinger.quizQuestions[0]?.question}`);
    console.log(`Quiz Options: ${kissinger.quizQuestions[0]?.options}`);
  } else {
    console.log("Kissinger article not found");
  }
}

inspect()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
