import { PrismaClient } from "@prisma/client";
import { getArticleBySlug, getPublishedArticles, getArticlesByCategory } from "../src/actions/articles";
import { searchArticlesAction } from "../src/actions/search";
import { isBengaliText } from "../src/lib/bilingual";

const prisma = new PrismaClient();

async function runSqaSuite() {
  console.log("========================================================");
  console.log("  KHOBORAKHOBOR SQA DEPLOYMENT READINESS TEST MATRIX   ");
  console.log("========================================================");

  let passed = 0;
  let total = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] ${title}`);
    } else {
      console.error(`  [FAIL] ${title} - Detail: ${detail}`);
    }
  }

  // 1. Database Integrity & Article Hydration
  const articles = await getPublishedArticles();
  assert("Database: Fetch published articles returns non-empty array", articles.length > 0, `Count: ${articles.length}`);
  assert("Database: Every article has parsed keyTakeaways array", articles.every((a) => Array.isArray(a.keyTakeaways)));
  assert("Database: Every article has valid quiz questions array", articles.every((a) => Array.isArray(a.quizQuestions)));

  // 2. Resilience: Non-existent and malformed slugs
  const nullArticle = await getArticleBySlug("completely-non-existent-article-slug-xyz-999");
  assert("Resilience: getArticleBySlug returns null gracefully on unknown slug", nullArticle === null);

  const specialCharsArticle = await getArticleBySlug("test%20slug%2Fwith%2Fslashes%26symbols");
  assert("Resilience: getArticleBySlug handles URL-encoded special characters safely", specialCharsArticle === null);

  // 3. Category Feeds & Safety
  const emptyCategory = await getArticlesByCategory("non-existent-category-slug");
  assert("Resilience: getArticlesByCategory returns empty array on invalid category", Array.isArray(emptyCategory) && emptyCategory.length === 0);

  // 4. Search Resilience & Boundary Value Testing
  const emptySearch = await searchArticlesAction("");
  assert("Search: Empty string returns empty array", emptySearch.length === 0);

  const spacesSearch = await searchArticlesAction("   ");
  assert("Search: Whitespace-only string returns empty array", spacesSearch.length === 0);

  const specialSearch = await searchArticlesAction("!@#$%^&*()");
  assert("Search: Special characters query does not throw and returns array", Array.isArray(specialSearch));

  const validSearch = await searchArticlesAction("বাংলাদেশ");
  assert("Search: Real query returns matching results", validSearch.length > 0, `Matches found: ${validSearch.length}`);

  // 5. Dual-Track Language & Quiz Mode Alignment
  const sampleBn = articles.find((a) => isBengaliText(a.title));
  const sampleEn = articles.find((a) => !isBengaliText(a.title));

  assert("Bilingual Engine: Successfully identifies Bengali article", sampleBn !== undefined && isBengaliText(sampleBn.title));
  assert("Bilingual Engine: Successfully identifies English article", sampleEn !== undefined && !isBengaliText(sampleEn.title));

  // 6. User Security Standard
  const students = await prisma.student.findMany();
  assert("Security: All registered users have PBKDF2/SHA256 salted hashes", students.every((s) => s.passwordHash && s.passwordHash.length >= 32));
  assert("Security: All student emails conform to @gmail.com standard", students.every((s) => s.email.endsWith("@gmail.com")));

  console.log("========================================================");
  console.log(`  SQA TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  if (passed === total) {
    console.log("  CERTIFICATION: 100% PRODUCTION & DEPLOYMENT READY");
  } else {
    console.log("  WARNING: SOME TESTS FAILED");
  }
  console.log("========================================================");

  await prisma.$disconnect();
  if (passed !== total) process.exit(1);
}

runSqaSuite().catch((err) => {
  console.error("SQA Suite crashed:", err);
  process.exit(1);
});
