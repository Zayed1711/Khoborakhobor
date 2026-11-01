import { prisma } from "../src/lib/prisma";
import { evaluateExamRelevance, extractFactTable } from "../src/lib/scraper/examFilter";

function resolveSourceDetails(caption?: string | null, title?: string) {
  const text = `${caption || ""} ${title || ""}`.toLowerCase();
  if (text.includes("প্রথম আলো") || text.includes("prothomalo")) {
    return { name: "প্রথম আলো", url: "https://www.prothomalo.com" };
  }
  if (text.includes("daily star") || text.includes("ডেইলি স্টার")) {
    return { name: "The Daily Star", url: "https://www.thedailystar.net" };
  }
  if (text.includes("bbc") || text.includes("বিবিসি")) {
    return { name: "বিবিসি বাংলা", url: "https://www.bbc.com/bengali" };
  }
  if (text.includes("business standard") || text.includes("tbs")) {
    return { name: "The Business Standard", url: "https://www.tbsnews.net" };
  }
  return { name: "প্রথম আলো", url: "https://www.prothomalo.com" };
}

async function run() {
  console.log("==========================================================");
  console.log("  KhoboraKhobor: Academic Sanitization & Fact Backfill    ");
  console.log("==========================================================");

  const articles = await prisma.article.findMany({
    include: { category: true },
  });

  console.log(`Analyzing ${articles.length} existing articles in database...`);

  let deletedCount = 0;
  let enrichedCount = 0;

  for (const art of articles) {
    const relevance = evaluateExamRelevance(art.title, art.content, art.category.slug);

    if (!relevance.isRelevant) {
      await prisma.article.delete({ where: { id: art.id } });
      console.log(`❌ [PURGED NOISE] "${art.title.slice(0, 50)}..." (${relevance.reason})`);
      deletedCount++;
    } else {
      const src = resolveSourceDetails(art.imageCaption, art.title);
      const factTable = extractFactTable(
        art.title,
        art.content,
        art.category.name,
        src.name
      );

      await prisma.article.update({
        where: { id: art.id },
        data: {
          factTable: JSON.stringify(factTable),
          sourceName: art.sourceName || src.name,
          sourceUrl: art.sourceUrl || src.url,
          examTags: relevance.suggestedExamTrack || art.examTags,
        },
      });

      enrichedCount++;
    }
  }

  console.log("==========================================================");
  console.log(`🎉 Complete! Purged ${deletedCount} non-exam articles.`);
  console.log(`✨ Enriched & Tagged ${enrichedCount} articles with Fact Sheets.`);
  console.log("==========================================================");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
