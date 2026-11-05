/**
 * Content integrity cleanup (one-off, safe to re-run).
 *
 * Fixes content problems found in the November 2026 audit:
 *   1. Invented filler paragraphs (from the retired enrich_short_articles.ts): re-fetch the
 *      real story when a story link exists, otherwise keep only the genuine summary.
 *   2. Publisher chrome scraped as text (share prompts, copyright lines) and repeated paragraphs.
 *   3. Source links that point only at a homepage (removed: no link beats a fake one), and
 *      source names that contradict the link's domain.
 *   4. Template fact rows, takeaways and exam tags: rebuilt from the article's own sentences.
 *   5. Template quizzes: replaced by a fill-in-the-blank quiz quoted from the article. Old
 *      questions that students already answered are kept (origin "legacy") so their history
 *      survives, but they are no longer shown.
 *   6. Stock photos standing in for news photos: replaced by the publisher's image when the
 *      story link has one, otherwise cleared (the UI shows a plain placeholder).
 *
 * Usage:
 *   node scripts/content_integrity_cleanup.js                 # dry run, prints a report
 *   node scripts/content_integrity_cleanup.js --apply         # backs up the DB, then writes
 *   node scripts/content_integrity_cleanup.js --apply --db /var/www/khoborakhobor/dev.db
 *   add --no-fetch to skip all network requests
 *   add --purge-bodies to delete stored publisher text after rebuilding study material
 *   (the site no longer shows it; the link-out model only needs summaries and quotes)
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const cheerio = require("cheerio");
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const FETCH = !args.includes("--no-fetch");
const PURGE_BODIES = args.includes("--purge-bodies");
const dbArg = args.includes("--db") ? args[args.indexOf("--db") + 1] : null;
const ROOT = path.join(__dirname, "..");
const DB_PATH = path.resolve(dbArg || path.join(ROOT, "prisma", "dev.db"));

// Load the app's own TypeScript helpers so this script and the scraper share one implementation
function loadTs(rel) {
  const file = path.join(ROOT, rel);
  const out = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  new Function("exports", "require", "module", out)(mod.exports, require, mod);
  return mod.exports;
}
const ex = loadTs("src/lib/study/extractive.ts");
const { isPublicHttpUrl } = loadTs("src/lib/url-safety.ts");

const HOMEPAGES = new Set([
  "https://www.prothomalo.com", "https://en.prothomalo.com", "https://www.thedailystar.net",
  "https://www.bbc.com/bengali", "https://www.tbsnews.net",
]);
const DOMAIN_SOURCES = [
  ["kishoralo.com", "কিশোর আলো"],
  ["bondhushava.com", "বন্ধুসভা (প্রথম আলো)"],
  ["en.prothomalo.com", "Prothom Alo (English)"],
  ["prothomalo.com", "প্রথম আলো"],
  ["thedailystar.net", "The Daily Star"],
  ["bbc.com/bengali", "বিবিসি বাংলা"],
  ["tbsnews.net", "The Business Standard"],
];
const isStock = (u) => /images\.unsplash\.com|images\.pexels\.com/i.test(u || "");
const normUrl = (u) => (u || "").trim().replace(/\/+$/, "");
const isStoryLink = (u) => Boolean(u) && isPublicHttpUrl(u) && !HOMEPAGES.has(normUrl(u));

async function fetchStory(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KhoboraKhoborIntegrity/1.0)",
        "Accept-Language": "bn,en;q=0.8",
      },
      signal: AbortSignal.timeout(9000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const $ = cheerio.load(await res.text());
    $("script, style, iframe, noscript, header, footer, nav, aside, figure figcaption").remove();
    const image = $("meta[property='og:image']").attr("content") || null;
    const selectors = [".story-element-text p", "[data-component='text-block'] p", "article p", "main p", ".article-content p"];
    let paras = [];
    for (const sel of selectors) {
      paras = $(sel).map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get().filter((t) => t.length > 30 && !ex.isBoilerplate(t));
      if (paras.length >= 3) break;
    }
    paras = [...new Set(paras)].slice(0, 20);
    const text = paras.join(" ");
    return { image: image && isPublicHttpUrl(image) ? image : null, paragraphs: text.length >= 400 ? paras : [] };
  } catch {
    return null;
  }
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function main() {
  if (!fs.existsSync(DB_PATH)) throw new Error(`Database not found: ${DB_PATH}`);
  console.log(`${APPLY ? "APPLY" : "DRY RUN"} on ${DB_PATH}${FETCH ? "" : " (no network)"}`);

  if (APPLY) {
    const dir = path.join(path.dirname(DB_PATH), "..", "backups");
    fs.mkdirSync(dir, { recursive: true });
    const backup = path.join(dir, `${path.basename(DB_PATH)}.before-integrity.${new Date().toISOString().replace(/[:.]/g, "-")}`);
    fs.copyFileSync(DB_PATH, backup);
    console.log(`Backup written: ${backup}`);
  }

  const prisma = new PrismaClient({ datasources: { db: { url: `file:${DB_PATH}` } } });
  const articles = await prisma.article.findMany({
    include: { quizQuestions: { include: { _count: { select: { attempts: true } } } } },
  });

  const report = {
    articles: articles.length, fillerFound: 0, refetched: 0, summaryOnly: 0, boilerplateRemoved: 0,
    homepageLinksRemoved: 0, sourceRenamed: 0, factsRows: 0, articlesWithFacts: 0, takeawaysArticles: 0,
    examTagsCleared: 0, quizzesDeleted: 0, quizzesKeptAsLegacy: 0, quizzesCreated: 0,
    stockImagesReplaced: 0, stockImagesCleared: 0, bodiesPurged: 0, skippedNoBody: 0, samples: [],
  };

  const queue = [...articles];
  async function worker() {
    while (queue.length) {
      const a = queue.shift();
      // Link-out stories never store a body; their study material was built at crawl time
      // and must not be rebuilt from an empty string.
      if (!a.content || !a.content.trim()) {
        report.skippedNoBody++;
        continue;
      }
      const data = {};
      const note = [];
      const hadFiller = ex.hasInventedFiller(a.content);
      const storyLink = isStoryLink(a.sourceUrl) ? a.sourceUrl : null;
      const needFetch = FETCH && storyLink && (hadFiller || isStock(a.featuredImage));
      const fetched = needFetch ? await fetchStory(storyLink) : null;

      // 1-2. Body
      let { html, removed, paragraphs } = ex.cleanArticleBody(a.content);
      report.boilerplateRemoved += removed;
      if (hadFiller) {
        report.fillerFound++;
        if (fetched && fetched.paragraphs.length) {
          paragraphs = fetched.paragraphs;
          html = paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n");
          data.contentOrigin = "scraped";
          report.refetched++;
          note.push("refetched body");
        } else {
          // Keep only text a publisher actually wrote
          const genuine = paragraphs.filter((p) => !ex.isBoilerplate(p));
          paragraphs = genuine.length ? genuine : [a.summary];
          html = paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n");
          data.contentOrigin = "summary_only";
          report.summaryOnly++;
          note.push("summary only");
        }
      }
      if (html !== a.content) {
        data.content = html;
        data.readTime = `${Math.max(1, Math.round(paragraphs.join(" ").split(/\s+/).length / 180))} মিনিট`;
      }
      const bodyText = paragraphs.join(" ");

      // 2b. Summary that is publisher chrome (e.g. a "আরও পড়ুন" link block)
      // Only linked stories are ever shown. A paragraph that starts with the headline is a
      // scraped heading glued to other text (often old invented filler), so it is not used.
      if (a.sourceUrl && ex.isBoilerplate(a.summary || "")) {
        const head = a.title.replace(/\s+/g, " ").trim().normalize("NFC");
        const real = paragraphs.filter((p) => !p.replace(/\s+/g, " ").trim().normalize("NFC").startsWith(head));
        const fixed = ex.pickSummary("", real);
        if (fixed) { data.summary = fixed; note.push("summary was publisher chrome"); }
        else note.push("summary is publisher chrome; no clean paragraph to replace it");
      }

      // 3. Sources
      if (a.sourceUrl && !storyLink) {
        data.sourceUrl = null;
        report.homepageLinksRemoved++;
      }
      if (storyLink) {
        const hit = DOMAIN_SOURCES.find(([d]) => storyLink.includes(d));
        if (hit && a.sourceName && !a.sourceName.startsWith(hit[1]) && !(hit[1] === "প্রথম আলো" && a.sourceName.startsWith("প্রথম আলো"))) {
          data.sourceName = hit[1];
          report.sourceRenamed++;
          note.push(`source -> ${hit[1]}`);
        }
      }

      // 4. Facts, takeaways, tags
      const facts = ex.extractFacts(a.title, bodyText);
      data.factTable = JSON.stringify(facts);
      report.factsRows += facts.length;
      if (facts.length) report.articlesWithFacts++;
      const takeaways = ex.extractTakeaways(a.title, a.summary, bodyText);
      data.keyTakeaways = JSON.stringify(takeaways);
      if (takeaways.length) report.takeawaysArticles++;
      if (a.examTags) {
        data.examTags = null;
        report.examTagsCleared++;
      }

      // 6. Images
      if (isStock(a.featuredImage)) {
        if (fetched && fetched.image) {
          data.featuredImage = fetched.image;
          report.stockImagesReplaced++;
        } else {
          data.featuredImage = "";
          report.stockImagesCleared++;
        }
      }

      // 5. Quizzes. An extracted quiz stays only if its sentence is still in the cleaned text
      // (e.g. not one that carried a photo credit that has since been stripped).
      const cleanedNorm = bodyText.normalize("NFC").replace(/\s+/g, " ");
      const isValidExtracted = (q) =>
        q.origin === "extracted" && q.sourceSentence && cleanedNorm.includes(q.sourceSentence.normalize("NFC").replace(/\s+/g, " "));
      const quiz = ex.buildExtractiveQuiz(a.title, bodyText);
      const ops = [];
      for (const q of a.quizQuestions) {
        if (isValidExtracted(q)) continue; // already rebuilt from the current text
        if (q._count.attempts > 0) {
          ops.push(prisma.quizQuestion.update({ where: { id: q.id }, data: { origin: "legacy" } }));
          report.quizzesKeptAsLegacy++;
        } else {
          ops.push(prisma.quizQuestion.delete({ where: { id: q.id } }));
          report.quizzesDeleted++;
        }
      }
      const hasExtracted = a.quizQuestions.some(isValidExtracted);
      if (quiz && !hasExtracted) {
        ops.push(prisma.quizQuestion.create({
          data: {
            articleId: a.id, question: quiz.question, options: JSON.stringify(quiz.options),
            correctOption: quiz.correctOption, explanation: quiz.explanation,
            origin: "extracted", sourceSentence: quiz.sourceSentence,
          },
        }));
        report.quizzesCreated++;
      }

      if (PURGE_BODIES) {
        data.content = "";
        report.bodiesPurged++;
      }

      if (report.samples.length < 8 && note.length) report.samples.push(`${a.title.slice(0, 60)} | ${note.join(", ")}`);

      if (APPLY) {
        await prisma.$transaction([prisma.article.update({ where: { id: a.id }, data }), ...ops]);
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  await prisma.$disconnect();

  console.log(JSON.stringify(report, null, 2));
  if (!APPLY) console.log("\nDry run only. Re-run with --apply to write these changes (a backup is made first).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
