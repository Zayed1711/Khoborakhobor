"use server";

import { prisma } from "@/lib/prisma";

export async function searchArticlesAction(query: string) {
  if (!query || !query.trim()) return [];

  try {
    const q = query.trim().toLowerCase();

    // Query articles matching title, summary, examTags, or category name
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { summary: { contains: q } },
          { examTags: { contains: q } },
          { category: { name: { contains: q } } },
        ],
      },
      include: {
        category: true,
        vocabulary: true,
      },
      take: 8,
    });

    return articles.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      categoryName: a.category.name,
      examTags: a.examTags,
    }));
  } catch (err) {
    console.error("[SEARCH] Error executing searchArticlesAction:", err);
    return [];
  }
}
