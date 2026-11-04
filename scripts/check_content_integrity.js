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
  const paraUse = new Map();

  for (const a of articles) {
    const paras = ex.htmlToParagraphs(a.content);
    const hasBody = paras.length > 0;
    const body = squash(paras.join(" ") + " " + a.summary + " " + a.title);

    for (const p of paras) {
      if (ex.isBoilerplate(p)) add("filler or publisher chrome in body", a, p);
      if (p.length > 60) {
        const k = squash(p);
        paraUse.set(k, (paraUse.get(k) || 0) + 1);
      }
    }
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
  for (const [p, n] of paraUse) if (n >= 3) problems.push({ kind: `paragraph reused in ${n} stories`, title: "(several)", detail: p.slice(0, 100) });

  const storedBodies = articles.filter((a) => a.content && a.content.trim()).length;
  const unlinked = articles.filter((a) => !a.sourceUrl).length;
  await prisma.$disconnect();
  if (storedBodies) console.log(`Note: ${storedBodies} stories still store publisher text (not shown on the site). Remove with: npm run fix:content -- --apply --purge-bodies`);
  if (unlinked) console.log(`Note: ${unlinked} stories have no link to the original and are hidden from lists.`);
  const byKind = problems.reduce((m, p) => ((m[p.kind] = (m[p.kind] || 0) + 1), m), {});
  console.log(`Checked ${articles.length} stories in ${DB_PATH}`);
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
