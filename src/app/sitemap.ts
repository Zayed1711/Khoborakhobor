import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE = "https://www.kkhobor.com";
export const revalidate = 3600; // rebuilt at most once an hour

/**
 * The pages search engines should know about: the main pages, every section, the stories
 * of the last 30 days (the ones still worth finding) and the weekly exam results.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/capsule`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/exam`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/policy`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const since = new Date(Date.now() - 30 * 86400000);
    const [categories, articles, exams] = await Promise.all([
      prisma.category.findMany({ select: { slug: true } }),
      prisma.article.findMany({
        where: { sourceUrl: { not: null }, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 5000,
        select: { slug: true, createdAt: true },
      }),
      prisma.weeklyExam.findMany({ where: { status: "scheduled" }, select: { id: true, day: true }, orderBy: { day: "desc" }, take: 50 }),
    ]);
    const today = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);
    return [
      ...fixed,
      ...categories.map((c) => ({ url: `${SITE}/category/${encodeURIComponent(c.slug)}`, changeFrequency: "daily" as const, priority: 0.6 })),
      ...articles.map((a) => ({ url: `${SITE}/article/${encodeURIComponent(a.slug)}`, lastModified: a.createdAt, changeFrequency: "weekly" as const, priority: 0.8 })),
      // Results pages exist once an exam has closed
      ...exams.filter((e) => e.day < today).map((e) => ({ url: `${SITE}/exam/results/${e.id}`, changeFrequency: "monthly" as const, priority: 0.4 })),
    ];
  } catch {
    return fixed;
  }
}
