import { prisma } from "../src/lib/prisma";
import { getDailyChallengeQuiz } from "../src/lib/quiz/generator";
import { getPublishedArticles } from "../src/actions/articles";

async function verifyDailyQuizContext() {
  console.log("========================================================");
  console.log("  VERIFYING DAILY QUIZ CONTEXT CITATION & SHUFFLE       ");
  console.log("========================================================");

  const articles = await getPublishedArticles();
  console.log(`Loaded ${articles.length} articles from database.`);

  // Test 1: English Mode Daily Challenges across consecutive days
  const enDay1 = getDailyChallengeQuiz({ mode: "en", articles, date: "2026-11-01" });
  const enDay2 = getDailyChallengeQuiz({ mode: "en", articles, date: "2026-11-02" });
  const enDay3 = getDailyChallengeQuiz({ mode: "en", articles, date: "2026-11-03" });

  console.log("\n[EN Day 1]", {
    source: enDay1.sourceName,
    paragraph: enDay1.paragraphRef,
    quote: enDay1.contextQuote?.slice(0, 80) + "...",
    question: enDay1.question,
    optionsCount: enDay1.options.length,
    correctOption: enDay1.correctOption,
    hasLink: Boolean(enDay1.articleSlug),
  });

  console.log("\n[EN Day 2]", {
    source: enDay2.sourceName,
    paragraph: enDay2.paragraphRef,
    quote: enDay2.contextQuote?.slice(0, 80) + "...",
    question: enDay2.question,
    optionsCount: enDay2.options.length,
    correctOption: enDay2.correctOption,
    hasLink: Boolean(enDay2.articleSlug),
  });

  console.log("\n[EN Day 3]", {
    source: enDay3.sourceName,
    paragraph: enDay3.paragraphRef,
    quote: enDay3.contextQuote?.slice(0, 80) + "...",
    question: enDay3.question,
    optionsCount: enDay3.options.length,
    correctOption: enDay3.correctOption,
    hasLink: Boolean(enDay3.articleSlug),
  });

  // Verify English days rotate
  const enRotates = enDay1.question !== enDay2.question || enDay1.articleTitle !== enDay2.articleTitle;
  console.log("\n[ASSERTION] English Quiz Rotates Across Days:", enRotates ? "PASS" : "FAIL");
  if (!enRotates) throw new Error("English daily quiz did not rotate!");

  // Verify English citation completeness
  if (!enDay1.sourceName || !enDay1.paragraphRef || !enDay1.contextQuote || !enDay1.articleSlug) {
    throw new Error("English daily quiz missing citation metadata!");
  }
  console.log("[ASSERTION] English Quiz Citation Metadata Complete: PASS");

  // Test 2: Bangla Mode Daily Challenges across consecutive days
  const bnDay1 = getDailyChallengeQuiz({ mode: "bn", articles, date: "2026-11-01" });
  const bnDay2 = getDailyChallengeQuiz({ mode: "bn", articles, date: "2026-11-02" });
  const bnDay3 = getDailyChallengeQuiz({ mode: "bn", articles, date: "2026-11-03" });

  console.log("\n[BN Day 1]", {
    source: bnDay1.sourceName,
    paragraph: bnDay1.paragraphRef,
    quote: bnDay1.contextQuote?.slice(0, 80) + "...",
    question: bnDay1.question,
    hasLink: Boolean(bnDay1.articleSlug),
  });

  console.log("\n[BN Day 2]", {
    source: bnDay2.sourceName,
    paragraph: bnDay2.paragraphRef,
    quote: bnDay2.contextQuote?.slice(0, 80) + "...",
    question: bnDay2.question,
    hasLink: Boolean(bnDay2.articleSlug),
  });

  const bnRotates = bnDay1.question !== bnDay2.question || bnDay1.articleTitle !== bnDay2.articleTitle;
  console.log("\n[ASSERTION] Bangla Quiz Rotates Across Days:", bnRotates ? "PASS" : "FAIL");
  if (!bnRotates) throw new Error("Bangla daily quiz did not rotate!");

  if (!bnDay1.sourceName || !bnDay1.paragraphRef || !bnDay1.contextQuote || !bnDay1.articleSlug) {
    throw new Error("Bangla daily quiz missing citation metadata!");
  }
  console.log("[ASSERTION] Bangla Quiz Citation Metadata Complete: PASS");

  // Test 3: Fallback Pool Integrity
  const fallbackEn = getDailyChallengeQuiz({ mode: "en", articles: [], date: "2026-11-01" });
  const fallbackBn = getDailyChallengeQuiz({ mode: "bn", articles: [], date: "2026-11-01" });
  if (!fallbackEn.contextQuote || !fallbackEn.paragraphRef || !fallbackEn.sourceName) {
    throw new Error("Fallback English quiz missing citation!");
  }
  if (!fallbackBn.contextQuote || !fallbackBn.paragraphRef || !fallbackBn.sourceName) {
    throw new Error("Fallback Bangla quiz missing citation!");
  }
  console.log("[ASSERTION] Fallback Pools Citation Metadata Complete: PASS");

  console.log("\n========================================================");
  console.log("  ALL DAILY QUIZ CITATION & SHUFFLE TESTS PASSED!       ");
  console.log("========================================================");
}

verifyDailyQuizContext()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
