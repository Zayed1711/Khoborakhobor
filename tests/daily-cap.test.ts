import { describe, expect, it, vi } from "vitest";

// daily-cap imports the database client; the decision tested here needs no database
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { chooseDrops } from "@/lib/scraper/daily-cap";
import type { FeedCard } from "@/lib/feed-card";

let n = 0;
const card = (title: string, slug = "national", summary = "বাজেট ঘোষণা"): FeedCard =>
  ({
    id: `id${++n}`,
    slug: `s${n}`,
    title,
    summary,
    titleBn: null,
    summaryBn: null,
    keyTakeaways: [],
    factTable: [],
    sourceName: "প্রথম আলো",
    sourceUrl: `https://www.prothomalo.com/s${n}`,
    examTags: null,
    featuredImage: "",
    imageCaption: null,
    publishedAt: "",
    readTime: "",
    isCapsule: false,
    isLead: false,
    createdAtIso: new Date(Date.UTC(2026, 10, 5, 6) - n * 60000).toISOString(),
    category: { name: slug, slug },
    quizQuestions: [],
  }) as FeedCard;

const PLACES = ["রংপুর", "খুলনা", "বরিশাল", "সিলেট", "রাজশাহী", "কুমিল্লা", "নোয়াখালী", "বগুড়া", "যশোর", "পাবনা"];
const WORDS = ["নদী", "পাহাড়", "বাজার", "সেতু", "বন্দর", "কারখানা", "বিদ্যালয়", "হাসপাতাল", "খামার", "জাদুঘর"];
const CATS = ["national", "economy", "politics", "world", "tech"];
const manyDistinct = (k: number) =>
  Array.from({ length: k }, (_, i) => card(`${PLACES[i % 10]}${"কখগঘঙ"[Math.floor(i / 10)]} ${WORDS[(i * 3) % 10]}${i}`, CATS[i % 5]));

describe("crawler keeps the day's best 30 Bengali stories", () => {
  it("drops everything beyond 30", () => {
    const day = manyDistinct(45);
    const drops = chooseDrops(day, new Set());
    expect(day.length - drops.length).toBe(30);
  });

  it("drops a Bengali story that touches nothing in the syllabus, even on a quiet day", () => {
    const fluff = card("মিরপুর টেস্টে জিতবে কে", "sports", "খেলার খবর");
    const drops = chooseDrops([fluff, ...manyDistinct(5)], new Set());
    expect(drops.map((d) => d.id)).toEqual([fluff.id]);
  });

  it("never drops a story a student has used", () => {
    const day = manyDistinct(40);
    const dropsWithout = chooseDrops(day, new Set());
    const used = new Set([dropsWithout[0].id]);
    expect(chooseDrops(day, used).map((d) => d.id)).not.toContain(dropsWithout[0].id);
  });

  it("never drops an English story (English learning has no daily limit)", () => {
    const english = Array.from({ length: 50 }, (_, i) => card(`Story number ${i} about the budget`, "economy"));
    expect(chooseDrops([...english, ...manyDistinct(35)], new Set()).every((d) => /[ঀ-৿]/.test(d.title))).toBe(true);
  });

  it("is stable: a second run with nothing new removes nothing", () => {
    const day = manyDistinct(45);
    const first = new Set(chooseDrops(day, new Set()).map((d) => d.id));
    const remaining = day.filter((c) => !first.has(c.id));
    const pinned = new Set(remaining.map((c) => c.id));
    expect(chooseDrops(remaining, new Set(), pinned)).toEqual([]);
  });

  it("a stronger new story still takes the place of the weakest kept one when the day is full", () => {
    const day = manyDistinct(30);
    const pinned = new Set(day.map((c) => c.id));
    const strong = card("বাজেটে রাজস্ব আদায়ের লক্ষ্য ঘোষণা করল মন্ত্রিসভা, মূল্যস্ফীতি নিয়ন্ত্রণে নতুন মুদ্রানীতি", "economy");
    const drops = chooseDrops([...day, strong], new Set(), pinned);
    expect(drops).toHaveLength(1);
    expect(drops[0].id).not.toBe(strong.id);
  });
});

