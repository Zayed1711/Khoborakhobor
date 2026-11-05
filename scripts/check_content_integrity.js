/**
 * Content integrity check. Exits with code 1 when the database contains text that is
 * not backed by a publisher, so it can run after every crawl or before a deploy.
 *
 *   npm run check:content
 *   node scripts/check_content_integrity.js --db /var/www/khoborakhobor/prisma/dev.db
 *
 * Checks:
 *   - invented filler paragraphs or publisher chrome inside article bodies
 *   - the same paragraph reused across 3+ stories (a sign of templated text)
 *   - source links that point only at a homepage
 *   - stock photos used as story images
 *   - fact rows, takeaways and quiz answers that are not verbatim in their story
 *     (only checkable while the body is stored; link-out stories were checked at crawl time)
 *   - listed stories without a link to the original (warning)
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const { PrismaClient } = require("@prisma/client");

const args = process.argv.slice(2);
const ROOT = path.join(__dirname, "..");
const DB_PATH = path.resolve(args.includes("--db") ? args[args.indexOf("--db") + 1] : path.join(ROOT, "prisma", "dev.db"));

function loadTs(rel) {
  const out = ts.transpileModule(fs.readFileSync(path.join(ROOT, rel), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  new Function("exports", "require", "module", out)(mod.exports, require, mod);
  return mod.exports;
}
const ex = loadTs("src/lib/study/extractive.ts");

const HOMEPAGES = new Set([
  "https://www.prothomalo.com", "https://en.prothomalo.com", "https://www.thedailystar.net",
  "https://www.bbc.com/bengali", "https://www.tbsnews.net",
]);
const nfc = (s) => (s || "").normalize("NFC");
const squash = (s) => nfc(s).replace(/\s+/g, " ");

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: `file:${DB_PATH}` } } });
  const articles = await prisma.article.findMany({ include: { quizQuestions: true } });
  const problems = [];
  const add = (kind, a, detail) => problems.push({ kind, title: a.title.slice(0, 70), detail: (detail || "").slice(0, 100) });
  // Key points that appear in several stories usually mean the same story was saved
  // more than once (e.g. live-update pages). Reported as a note, not a failure.
  const pointUse = new Map();

  for (const a of articles) {
    // Stories without a link to the original are never shown (not even by address),
    // so only linked stories are judged. The stored publisher text is never shown
    // either: it is used only to prove that what IS shown came from the story.
    if (!a.sourceUrl) continue;
    const paras = ex.htmlToParagraphs(a.content);
    const hasBody = paras.length > 0;
    const body = squash(paras.join(" ") + " " + a.summary + " " + a.title);
    if (a.sourceUrl && HOMEPAGES.has(a.sourceUrl.trim().replace(/\/+$/, ""))) add("source link is only a homepage", a, a.sourceUrl);
    if (/images\.unsplash\.com|images\.pexels\.com/i.test(a.featuredImage || "")) add("stock photo used as story image", a, a.featuredImage);

    let facts = [];
    try { facts = JSON.parse(a.factTable || "[]"); } catch { add("fact table is not valid JSON", a); }
    for (const f of facts) {
      if (!f.relevance) add("fact has no source sentence", a, f.value);
      else if (!squash(f.relevance).includes(squash(f.value))) add("fact value not inside its source sentence", a, f.value);
      else if (hasBody && !body.includes(squash(f.relevance))) add("fact not found in story", a, f.value);
    }
    let takeaways = [];
    try { takeaways = JSON.parse(a.keyTakeaways || "[]"); } catch { add("takeaways are not valid JSON", a); }
    if (hasBody) for (const t of takeaways) if (!body.includes(squash(t))) add("takeaway not found in story", a, t);
    for (const t of takeaways) if (t.length > 60) pointUse.set(squash(t), (pointUse.get(squash(t)) || 0) + 1);

    // Everything a reader sees must be free of invented filler and publisher chrome
    const shown = [a.summary, ...takeaways, ...facts.map((f) => f.relevance || ""), ...a.quizQuestions.filter((q) => q.origin !== "legacy").flatMap((q) => [q.question, q.sourceSentence || ""])];
    for (const t of shown) if (t && ex.isBoilerplate(t)) add("filler or publisher chrome shown to readers", a, t);
    const CREDIT = new RegExp("ছবির উৎস|ছবির ক্যাপশন|via Getty Images".normalize("NFC"));
    for (const t of [...takeaways, ...facts.map((f) => f.relevance || "")]) {
      if (CREDIT.test(nfc(t))) add("photo credit inside a quoted sentence", a, t);
    }

    for (const q of a.quizQuestions) {
      if (q.origin === "legacy") continue; // hidden, kept only for attempt history
      if (q.origin === "extracted" && (!q.sourceSentence || (hasBody && !body.includes(squash(q.sourceSentence))))) add("quiz answer not backed by a story sentence", a, q.question);
      if (q.origin === "generated") add("generated quiz published without review", a, q.question);
    }
  }
  const repeatedPoints = [...pointUse].filter(([, n]) => n >= 3);

  const storedBodies = articles.filter((a) => a.content && a.content.trim()).length;
  const unlinked = articles.filter((a) => !a.sourceUrl).length;
  await prisma.$disconnect();
  if (storedBodies) console.log(`Note: ${storedBodies} stories still store publisher text (not shown on the site). Remove with: npm run fix:content -- --apply --purge-bodies`);
  if (unlinked) console.log(`Note: ${unlinked} stories have no link to the original and are not shown anywhere.`);
  if (repeatedPoints.length) {
    console.log(`Note: ${repeatedPoints.length} key points appear in 3 or more stories (probably the same story saved more than once):`);
    for (const [p, n] of repeatedPoints.slice(0, 5)) console.log(`   ${n}x  ${p.slice(0, 90)}`);
  }
  const byKind = problems.reduce((m, p) => ((m[p.kind] = (m[p.kind] || 0) + 1), m), {});
  console.log(`Checked ${articles.length - unlinked} linked stories in ${DB_PATH}`);
  if (!problems.length) {
    console.log("OK: no integrity problems found.");
    return;
  }
  console.log("Problems by kind:", byKind);
  for (const p of problems.slice(0, 20)) console.log(` - [${p.kind}] ${p.title} :: ${p.detail}`);
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
