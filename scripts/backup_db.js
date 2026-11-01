/**
 * KhoboraKhobor (খবরাখবর) - Production Database Backup & Restore Utility
 * Dumps all tables to a clean timestamped JSON payload.
 *
 * Usage:
 *   node scripts/backup_db.js                  # Takes full backup into backups/
 *   node scripts/backup_db.js --stats          # Inspects counts of current database
 *   node scripts/backup_db.js --restore <path> # Restores database from backup JSON file
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const isStats = args.includes("--stats");
  const restoreIndex = args.indexOf("--restore");

  if (restoreIndex !== -1 && args[restoreIndex + 1]) {
    const backupFilePath = path.resolve(args[restoreIndex + 1]);
    await restoreFromBackup(backupFilePath);
    return;
  }

  if (isStats) {
    await displayStats();
    return;
  }

  await executeFullBackup();
}

async function displayStats() {
  console.log("==================================================");
  console.log("  খবরাখবর (KhoboraKhobor) Database Health & Stats ");
  console.log("==================================================");

  const [
    studentCount,
    categoryCount,
    articleCount,
    vocabCount,
    savedWordCount,
    quizQuestionCount,
    quizAttemptCount,
    savedArticleCount,
    studyNoteCount,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.category.count(),
    prisma.article.count(),
    prisma.vocabularyTerm.count(),
    prisma.savedWord.count(),
    prisma.quizQuestion.count(),
    prisma.quizAttempt.count(),
    prisma.savedArticle.count(),
    prisma.studyNote.count(),
  ]);

  console.log(`👤 Students Registered : ${studentCount}`);
  console.log(`📂 Categories          : ${categoryCount}`);
  console.log(`📰 Curated Articles    : ${articleCount}`);
  console.log(`📖 Vocabulary Terms    : ${vocabCount}`);
  console.log(`⭐ Saved Word Bank     : ${savedWordCount}`);
  console.log(`❓ Quiz Questions      : ${quizQuestionCount}`);
  console.log(`📝 Quiz Attempts Log   : ${quizAttemptCount}`);
  console.log(`🔖 Saved Articles      : ${savedArticleCount}`);
  console.log(`✏️ Student Study Notes : ${studyNoteCount}`);
  console.log("==================================================");
}

async function executeFullBackup() {
  console.log("⏳ Starting KhoboraKhobor database backup...");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const [
    students,
    categories,
    articles,
    vocabulary,
    savedWords,
    quizQuestions,
    quizAttempts,
    savedArticles,
    studyNotes,
  ] = await Promise.all([
    prisma.student.findMany(),
    prisma.category.findMany(),
    prisma.article.findMany(),
    prisma.vocabularyTerm.findMany(),
    prisma.savedWord.findMany(),
    prisma.quizQuestion.findMany(),
    prisma.quizAttempt.findMany(),
    prisma.savedArticle.findMany(),
    prisma.studyNote.findMany(),
  ]);

  const backupPayload = {
    meta: {
      version: "1.0",
      system: "KhoboraKhobor Production Engine",
      generatedAt: new Date().toISOString(),
      counts: {
        students: students.length,
        categories: categories.length,
        articles: articles.length,
        vocabulary: vocabulary.length,
        savedWords: savedWords.length,
        quizQuestions: quizQuestions.length,
        quizAttempts: quizAttempts.length,
        savedArticles: savedArticles.length,
        studyNotes: studyNotes.length,
      },
    },
    data: {
      students,
      categories,
      articles,
      vocabulary,
      savedWords,
      quizQuestions,
      quizAttempts,
      savedArticles,
      studyNotes,
    },
  };

  const backupFileName = `backup_${timestamp}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);

  fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), "utf-8");

  const fileSizeKb = (fs.statSync(backupFilePath).size / 1024).toFixed(2);

  console.log("✅ Database Backup Successfully Exported!");
  console.log(`📁 File location: ${backupFilePath}`);
  console.log(`📦 Size: ${fileSizeKb} KB`);
  console.log("📊 Summary of Exported Records:");
  console.log(`   - Articles: ${articles.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Quiz Questions: ${quizQuestions.length}`);
  console.log(`   - Vocabulary Terms: ${vocabulary.length}`);
  console.log(`   - Study Notes: ${studyNotes.length}`);
}

async function restoreFromBackup(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Backup file not found at: ${filePath}`);
    process.exit(1);
  }

  console.log(`⏳ Reading backup file: ${filePath}`);
  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const { data } = content;

  if (!data) {
    console.error("❌ Invalid backup structure: missing 'data' node.");
    process.exit(1);
  }

  console.log("⚠️ Restoring records into database...");

  // 1. Categories
  if (data.categories) {
    for (const cat of data.categories) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: cat,
        create: cat,
      });
    }
  }

  // 2. Students
  if (data.students) {
    for (const stu of data.students) {
      await prisma.student.upsert({
        where: { id: stu.id },
        update: stu,
        create: stu,
      });
    }
  }

  // 3. Articles
  if (data.articles) {
    for (const art of data.articles) {
      await prisma.article.upsert({
        where: { id: art.id },
        update: art,
        create: art,
      });
    }
  }

  // 4. Vocabulary
  if (data.vocabulary) {
    for (const voc of data.vocabulary) {
      await prisma.vocabularyTerm.upsert({
        where: { id: voc.id },
        update: voc,
        create: voc,
      });
    }
  }

  // 5. Quiz Questions
  if (data.quizQuestions) {
    for (const q of data.quizQuestions) {
      await prisma.quizQuestion.upsert({
        where: { id: q.id },
        update: q,
        create: q,
      });
    }
  }

  console.log("✅ Restore operation successfully completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error running backup script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

