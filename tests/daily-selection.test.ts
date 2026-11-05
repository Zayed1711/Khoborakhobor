import { describe, expect, it } from "vitest";
import type { FeedCard } from "@/lib/feed-card";
import { isSameStory, scoreStory, selectDaily, selectDailyFeed } from "@/lib/study/daily-selection";

let n = 0;
function card(title: string, over: Partial<FeedCard> = {}): FeedCard {
  n++;
  return {
    id: `id${n}`,
    slug: `s${n}`,
    title,
    summary: "",
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
    createdAtIso: new Date(Date.UTC(2026, 10, 5, 6, 0, 0) - n * 60000).toISOString(),
    category: { name: "জাতীয়", slug: "national" },
    quizQuestions: [],
    ...over,
  };
}

// Distinct headlines (no shared words), so none of them count as the same story or topic
const WORDS = ["নদী", "পাহাড়", "বাজার", "সেতু", "বন্দর", "কারখানা", "বিদ্যালয়", "হাসপাতাল", "খামার", "জাদুঘর", "উদ্যান", "গ্রন্থাগার", "স্টেশন", "মেলা", "উৎসব", "প্রদর্শনী", "কর্মশালা", "সেমিনার", "অভিযান", "প্রতিযোগিতা", "সমাবেশ", "নৌকা", "বিমানবন্দর", "চিড়িয়াখানা", "পার্ক"];
const PLACES = ["রংপুর", "খুলনা", "বরিশাল", "সিলেট", "রাজশাহী", "কুমিল্লা", "নোয়াখালী", "বগুড়া", "যশোর", "পাবনা"];
const filler = (k: number, slug = "national", from = 0) =>
  Array.from({ length: k }, (_, j) => {
    const i = from + j;
    // The summary touches the syllabus, so these count as relevant stories
    return card(`${PLACES[i % 10]}${"কখগঘঙচছজঝঞ"[Math.floor(i / 10)]} ${WORDS[i % 25]}${i}`, { category: { name: slug, slug }, summary: "বাজেট ঘোষণা" });
  });
const mixed = () => [...filler(5, "world", 0), ...filler(5, "economy", 5), ...filler(5, "politics", 10), ...filler(5, "tech", 15)];

describe("daily selection", () => {
  it("leaves out stories that touch nothing in the syllabus, even when there is room", () => {
    const off = card("মিরপুর টেস্টে জিতবে কে", { category: { name: "s", slug: "sports" } });
    const on = card("বাজেটে রাজস্ব আদায়ের নতুন লক্ষ্য", { category: { name: "e", slug: "economy" } });
    const ids = selectDaily([off, on]).map((c) => c.id);
    expect(ids).toEqual([on.id]);
  });

  it("returns at most 10 urgent + 20 more, ranked 1..30", () => {
    const sel = selectDaily(filler(45));
    expect(sel).toHaveLength(30);
    expect(sel.filter((c) => c.dailyTier === "urgent")).toHaveLength(10);
    expect(sel.map((c) => c.dailyRank)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it("keeps a story saved twice only once", () => {
    const a = card("প্রধানমন্ত্রীর জাপান সফর: কোথায় সম্ভাবনা, কোথায় পরীক্ষা");
    const sameLink = card("জাপান সফর নিয়ে বিশ্লেষণ", { sourceUrl: a.sourceUrl });
    const sameTitle = card("প্রধানমন্ত্রীর জাপান সফর: কোথায় সম্ভাবনা");
    expect(isSameStory(a, sameLink)).toBe(true);
    expect(isSameStory(a, sameTitle)).toBe(true);
    const ids = selectDaily([a, sameLink, sameTitle, ...filler(5)]).map((c) => c.id);
    expect(ids.filter((id) => [a.id, sameLink.id, sameTitle.id].includes(id))).toHaveLength(1);
  });

  it("puts at most 2 stories of one running topic in the ten", () => {
    const hsc = ["এইচএসসিতে পাসের হার কম", "এইচএসসি ফলাফল কোন বোর্ডে কত", "এইচএসসিতে অর্ধেক ফেল", "সিলেট বোর্ডে এইচএসসির ফল খারাপ"].map((t) =>
      card(t, { category: { name: "exam", slug: "exam-prep" } })
    );
    const urgent = selectDaily([...hsc, ...mixed()]).filter((c) => c.dailyTier === "urgent");
    expect(urgent.filter((c) => c.title.includes("এইচএসসি")).length).toBe(2);
  });

  it("puts at most 3 stories of one category in the ten when others exist", () => {
    const sel = selectDaily([...filler(10, "economy", 0), ...filler(4, "sports", 10), ...filler(4, "world", 14), ...filler(4, "tech", 18)]);
    expect(sel.filter((c) => c.dailyTier === "urgent" && c.category.slug === "economy").length).toBeLessThanOrEqual(3);
  });

  it("ranks a policy decision above a crime story", () => {
    const policy = card("বাজেটে রাজস্ব আদায়ের নতুন লক্ষ্য ঠিক করল মন্ত্রিসভা", { category: { name: "e", slug: "economy" } });
    const crime = card("পারিবারিক কলহে খুন, লাশ উদ্ধার", { category: { name: "n", slug: "national" } });
    expect(scoreStory(policy)).toBeGreaterThan(scoreStory(crime));
  });

  it("a word that only appears in the summary counts less than one in the headline", () => {
    const inTitle = card("জলবায়ু সম্মেলনে বাংলাদেশের প্রস্তাব");
    const inSummary = card("একটি পাখির গল্প", { summary: "জলবায়ু সম্মেলনে বাংলাদেশের প্রস্তাব" });
    expect(scoreStory(inTitle)).toBeGreaterThan(scoreStory(inSummary));
  });

  it("on the homepage uses only the latest 24 hours of news", () => {
    const fresh = filler(3);
    const old = card("দুই দিন আগের খবর", { summary: "মুদ্রানীতি ঘোষণা", createdAtIso: new Date(Date.UTC(2026, 10, 3)).toISOString() });
    const ids = selectDaily([...fresh, old], "latest").map((c) => c.id);
    expect(ids).not.toContain(old.id);
    expect(selectDaily([...fresh, old], "all").map((c) => c.id)).toContain(old.id);
  });

  it("ranks Bengali and English stories separately", () => {
    const sel = selectDailyFeed([...filler(12), card("Budget deficit narrows as revenue rises"), card("UN climate summit opens")]);
    expect(sel.filter((c) => !/[ঀ-৿]/.test(c.title)).map((c) => c.dailyRank)).toEqual([1, 2]);
  });

  describe("trending news outside the syllabus", () => {
    const many = () => [...filler(8, "economy", 0), ...filler(8, "tech", 8), ...filler(8, "exam-prep", 16)];

    it("includes the Prime Minister's visit in the ten (national)", () => {
      const pm = card("প্রধানমন্ত্রী আজ বাগেরহাট যাচ্ছেন", { category: { name: "n", slug: "national" } });
      const sel = selectDaily([pm, ...many()]);
      const got = sel.find((c) => c.id === pm.id);
      expect(got?.dailyTier).toBe("urgent");
      expect(got?.isTrending).toBe(true);
    });

    it("includes a US Senate result in the ten (international)", () => {
      const us = card("মার্কিন সিনেটে জয়ী হলেন ডেমোক্র্যাট প্রার্থী", { category: { name: "w", slug: "world" } });
      expect(selectDaily([us, ...many()]).find((c) => c.id === us.id)?.dailyTier).toBe("urgent");
    });

    it("counts a story covered by many outlets as trending", () => {
      const quake = ["চট্টগ্রামে শক্তিশালী কম্পন", "চট্টগ্রামে কম্পনে ভবনে ফাটল", "কম্পনের পর চট্টগ্রামে আতঙ্ক"].map((t) =>
        card(t, { category: { name: "n", slug: "national" } })
      );
      const sel = selectDaily([...quake, ...many()]);
      expect(sel.filter((c) => quake.some((q) => q.id === c.id) && c.isTrending).length).toBeGreaterThan(0);
    });

    it("does not treat viral sports or entertainment as trending", () => {
      const viral = ["মেসির জোড়া গোল", "মেসির গোলে উচ্ছ্বাস", "মেসি ফিরলেন মাঠে"].map((t) => card(t, { category: { name: "s", slug: "sports" } }));
      const ids = selectDaily([...viral, ...many()]).map((c) => c.id);
      expect(ids.some((id) => viral.some((v) => v.id === id))).toBe(false);
    });
  });
});
