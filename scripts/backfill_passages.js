/**
 * Backfill reading passages for today's English stories (one-off, safe to re-run).
 *
 * New English stories get their reading passage (the opening 80-150 words of the
 * article) when they are crawled. Stories crawled before that have none, so their page
 * falls back to the summary and key points. This script opens each such story's page
 * once, slowly, and saves only the passage - never the full article.
 *
 * Usage (on the server, in /var/www/khoborakhobor):
 *   node scripts/backfill_passages.js --db /var/www/kkhobor-data/kkhobor.db            # dry run: prints what it would save
 *   node scripts/backfill_passages.js --db /var/www/kkhobor-data/kkhobor.db --apply    # saves the passages
 * By default only stories from today (Bangladesh time) are done; older stories keep their
 * fallback passage. Add --days 3 to include the last 3 days, --limit 50 to stop after 50.
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const cheerio = require("cheerio");
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const DAYS = Number(opt("--days", 0)); // 0 = today only
const LIMIT = Number(opt("--limit", 1000));
const ROOT = path.join(__dirname, "..");
const DB_PATH = path.resolve(opt("--db", path.join(ROOT, "prisma", "dev.db")));
const PAUSE_MS = 1500; // one page every 1.5 seconds: gentle on the newspapers' servers

// Load the app's own TypeScript helpers, so the passage is cut exactly as on the site
const loaded = {};
function loadTs(rel) {
  if (loaded[rel]) return loaded[rel];
  const file = path.join(ROOT, rel);
  const out = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  const dir = path.dirname(rel);
  const localRequire = (id) => (id.startsWith("./") ? loadTs(path.join(dir, id.slice(2) + ".ts")) : require(id));
  new Function("exports", "require", "module", out)(mod.exports, localRequire, mod);
  loaded[rel] = mod.exports;
  return mod.exports;
}
const { passageFromParagraphs, passageToJson } = loadTs("src/lib/study/passage.ts");
const { isBoilerplate } = loadTs("src/lib/study/extractive.ts");
const { isPublicHttpUrl } = loadTs("src/lib/url-safety.ts");

const isBengali = (t) => /[ঀ-৿]/.test(t || "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The article's paragraphs, in order, from its page. */
async function fetchParagraphs(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; KhoboraKhoborPassage/1.0)", "Accept-Language": "en,bn;q=0.8" },
    signal: AbortSignal.timeout(12000),
    redirect: "follow",
  });
  if (!res.ok) return { status: res.status, paragraphs: [] };
  const $ = cheerio.load(await res.text());
  $("script, style, iframe, noscript, header, footer, nav, aside, figure, figcaption, form").remove();
  // Story text containers used by the English papers we follow, then general fallbacks
  const selectors = [
    ".story-element-text p", // Prothom Alo
    "[data-component='text-block'] p", // BBC
    ".section-content p", // The Business Standard
    ".article-section p, .pb-20 p", // The Daily Star
    ".report-mainbody p, .news-content p", // Dhaka Tribune
    "article p",
    "main p",
  ];
  let paragraphs = [];
  for (const sel of selectors) {
    paragraphs = $(sel)
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .filter((t) => t.length > 40 && !isBoilerplate(t));
    if (paragraphs.join(" ").length >= 400) break;
  }
  return { status: res.status, paragraphs: [...new Set(paragraphs)].slice(0, 20) };
}

async function main() {
  if (!fs.existsSync(DB_PATH)) throw new Error(`Database not found: ${DB_PATH}`);
  const prisma = new PrismaClient({ datasources: { db: { url: `file:${DB_PATH}` } } });
  // Start of today in Bangladesh (UTC+6), minus any extra days asked for
  const dhakaToday = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);
  const since = new Date(Date.parse(dhakaToday + "T00:00:00Z") - 6 * 3600000 - DAYS * 86400000);
  const stories = (
    await prisma.article.findMany({
      where: { sourceUrl: { not: null }, passage: null, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, sourceUrl: true, sourceName: true },
    })
  )
    .filter((a) => !isBengali(a.title) && isPublicHttpUrl(a.sourceUrl))
    .slice(0, LIMIT);

  console.log(`${stories.length} English stories from ${DAYS ? `the last ${DAYS} days and ` : ""}today have no passage. ${APPLY ? "Saving passages." : "Dry run: nothing is saved (add --apply to save)."}\n`);
  const report = { saved: 0, tooShort: 0, failed: 0, bySource: {} };
  for (const [i, a] of stories.entries()) {
    const src = (report.bySource[a.sourceName || "?"] ||= { saved: 0, missed: 0 });
    try {
      const { status, paragraphs } = await fetchParagraphs(a.sourceUrl);
      const passage = passageFromParagraphs(paragraphs, 40);
      if (passage.length) {
        const words = passage.flat().join(" ").split(/\s+/).length;
        if (APPLY) await prisma.article.update({ where: { id: a.id }, data: { passage: passageToJson(passage) } });
        report.saved++;
        src.saved++;
        console.log(`[${i + 1}/${stories.length}] ok    ${words} words  ${a.title.slice(0, 70)}`);
      } else {
        report.tooShort++;
        src.missed++;
        console.log(`[${i + 1}/${stories.length}] skip  (page ${status}, no usable text)  ${a.title.slice(0, 60)}`);
      }
    } catch (e) {
      report.failed++;
      src.missed++;
      console.log(`[${i + 1}/${stories.length}] fail  ${e.message}  ${a.title.slice(0, 60)}`);
    }
    await sleep(PAUSE_MS);
  }
  console.log(`\nDone. ${APPLY ? "Saved" : "Would save"} ${report.saved}; no usable text ${report.tooShort}; failed ${report.failed}.`);
  for (const [name, r] of Object.entries(report.bySource)) console.log(`  ${name}: ${r.saved} ok, ${r.missed} missed`);
  if (report.saved && APPLY) console.log("\nPractice questions and vocabulary for these stories are rebuilt from the new passage the next time each story is opened.");
  await prisma.$disconnect();
}

module.exports = { fetchParagraphs, passageFromParagraphs };

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
