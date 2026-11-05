import { describe, expect, it } from "vitest";
import {
  buildExtractiveQuiz,
  cleanArticleBody,
  extractFacts,
  extractTakeaways,
  hasInventedFiller,
  pickSummary,
  splitSentences,
} from "@/lib/study/extractive";

const BN_TITLE = "মিরপুরে পুলিশের সঙ্গে পোশাকশ্রমিকদের সংঘর্ষ";
const BN_BODY =
  "রাজধানীর মিরপুর–১০ নম্বর এলাকায় পুলিশের সঙ্গে তৈরি পোশাক কারখানার শ্রমিকদের সংঘর্ষের ঘটনা ঘটেছে। " +
  "ন্যূনতম মাসিক বেতন ৩০ হাজার টাকা করার দাবিতে সকাল থেকে মিরপুর–১০ নম্বর মোড়ের সড়ক অবরোধ করে বিক্ষোভ করছিলেন শ্রমিকেরা। " +
  "সড়ক অবরোধের কারণে সকাল সাড়ে ১০টা থেকে বেলা ১টা পর্যন্ত আশপাশের সড়কে যান চলাচল বন্ধ ছিল। " +
  "দুটি প্রকল্পে প্রায় ২৯ কোটি ৫৫ লাখ মার্কিন ডলার ঋণের প্রতিশ্রুতি দেওয়া হয়েছে বলে কর্মকর্তারা জানিয়েছেন। " +
  "প্রধানমন্ত্রীর ২৬–২৯ অক্টোবরের জাপান সফর নিয়ে বিস্তারিত আলোচনা হয়েছে আজকের বৈঠকে।";

describe("splitSentences", () => {
  it("splits Bengali on the dari and keeps whole sentences", () => {
    const s = splitSentences(BN_BODY);
    expect(s.length).toBe(5);
    expect(s.every((x) => x.endsWith("।"))).toBe(true);
  });
});

describe("cleanArticleBody", () => {
  it("drops publisher chrome, repeated paragraphs and invented filler", () => {
    const html =
      "<p>আসল প্রথম অনুচ্ছেদ, যা প্রতিবেদক লিখেছেন।</p>" +
      "<p>আসল প্রথম অনুচ্ছেদ, যা প্রতিবেদক লিখেছেন।</p>" +
      "<p>বিবিসি বাংলার হোয়াটসঅ্যাপ চ্যানেল ফলো করতে এখানে ক্লিক/ট্যাপ করুন</p>" +
      "<p>is strictly prohibited and constitutes copyright infringement liable to legal action.</p>" +
      "<p>উক্ত বিষয়ে সংশ্লিষ্ট খাত ও অংশীজনদের তরফ থেকে বিশদ বিশ্লেষণ পাওয়া গেছে।</p>";
    const r = cleanArticleBody(html);
    expect(r.paragraphs).toEqual(["আসল প্রথম অনুচ্ছেদ, যা প্রতিবেদক লিখেছেন।"]);
    expect(r.removed).toBe(4);
  });

  it("detects filler in both Unicode forms of য়", () => {
    const decomposed = "উক্ত বিষয়ে সংশ্লিষ্ট খাত ও অংশীজনদের তরফ থেকে";
    const precomposed = decomposed.replace("য়", "য়");
    expect(precomposed).not.toBe(decomposed);
    expect(hasInventedFiller(decomposed)).toBe(true);
    expect(hasInventedFiller(precomposed)).toBe(true);
  });

  it("strips a BBC photo credit but keeps the Bengali text after it", () => {
    const r = cleanArticleBody("<p>ছবির উৎস, Universal Images Group via Getty Images সালটা ১৬১৩, বর্ষাকাল শেষ।</p>");
    expect(r.paragraphs).toEqual(["সালটা ১৬১৩, বর্ষাকাল শেষ।"]);
  });

  it("escapes HTML in the cleaned output", () => {
    const r = cleanArticleBody("<p>এখানে &lt;script&gt;alert(1)&lt;/script&gt; লেখা আছে, যা বিপজ্জনক নয়।</p>");
    expect(r.html).not.toContain("<script>");
  });
});

describe("extractFacts", () => {
  const facts = extractFacts(BN_TITLE, BN_BODY);
  const values = facts.map((f) => f.value);

  it("keeps compound amounts whole", () => {
    expect(values).toContain("২৯ কোটি ৫৫ লাখ");
  });

  it("never returns a time of day or a date glued to a suffix", () => {
    expect(values.some((v) => v.includes("১০টা"))).toBe(false);
    expect(values.some((v) => v.startsWith("২৯ অক্টোবর"))).toBe(false);
  });

  it("quotes the sentence each value came from", () => {
    for (const f of facts) expect(f.relevance).toContain(f.value);
  });
});

describe("extractTakeaways", () => {
  it("returns sentences copied word for word from the story", () => {
    const sentences = splitSentences(BN_BODY);
    const t = extractTakeaways(BN_TITLE, "", BN_BODY);
    expect(t.length).toBeGreaterThan(0);
    expect(t.length).toBeLessThanOrEqual(3);
    for (const x of t) expect(sentences).toContain(x);
  });
});

describe("buildExtractiveQuiz", () => {
  const quiz = buildExtractiveQuiz(BN_TITLE, BN_BODY)!;

  it("builds a fill-in-the-blank from a real sentence", () => {
    expect(quiz).not.toBeNull();
    expect(BN_BODY).toContain(quiz.sourceSentence);
    expect(quiz.question).toContain("_____");
  });

  it("has one correct answer that is in the source sentence, and 4 distinct options", () => {
    expect(quiz.options).toHaveLength(4);
    expect(new Set(quiz.options).size).toBe(4);
    expect(quiz.sourceSentence).toContain(quiz.options[quiz.correctOption]);
  });

  it("never offers an impossible day of the month as a distractor", () => {
    const q = buildExtractiveQuiz(
      "এইচএসসির পুনর্নিরীক্ষণ",
      "শিক্ষার্থীরা আজ ২৮ অক্টোবর থেকে ফল পুনর্নিরীক্ষণের আবেদন করতে পারবেন বলে বোর্ড জানিয়েছে। আবেদন চলবে আরও এক সপ্তাহ ধরে, জানিয়েছে শিক্ষা বোর্ড।"
    );
    expect(q).not.toBeNull();
    const days = q!.options.map((o) => Number(o.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).match(/\d+/)![0]));
    for (const d of days) expect(d).toBeGreaterThanOrEqual(1), expect(d).toBeLessThanOrEqual(31);
  });

  it("returns null when no sentence supports a question", () => {
    expect(buildExtractiveQuiz("শিরোনাম", "এখানে কোনো সংখ্যা বা তারিখ নেই, শুধু সাধারণ একটি বাক্য লেখা আছে।")).toBeNull();
  });
});

describe("pickSummary", () => {
  const paras = [
    "রাজধানীর মিরপুর এলাকায় পুলিশের সঙ্গে তৈরি পোশাক কারখানার শ্রমিকদের সংঘর্ষের ঘটনা ঘটেছে।",
    "দ্বিতীয় অনুচ্ছেদ, যা সারাংশে আসার কথা নয়।",
  ];

  it("never uses a 'read more' link block as the summary", () => {
    const s = pickSummary(" আরও পড়ুনখোঁজ দ্য দরিদ্র২৮ অক্টোবর ২০২৬ ...", paras);
    expect(s).toBe(paras[0]);
  });

  it("keeps a real teaser", () => {
    const teaser = "শ্রমিকেরা ন্যূনতম মাসিক বেতন ৩০ হাজার টাকা করার দাবিতে সড়ক অবরোধ করেন।";
    expect(pickSummary(teaser, paras)).toBe(teaser);
  });

  it("cuts long text at a sentence end, not mid-word", () => {
    const long = Array.from({ length: 6 }, (_, i) => `এটি একটি দীর্ঘ বাক্য, যার ক্রমিক নম্বর ${i + 1} এবং এটি সারাংশ পরীক্ষার জন্য লেখা।`).join(" ");
    const s = pickSummary(long, []);
    expect(s.length).toBeLessThanOrEqual(220);
    expect(s.endsWith("।")).toBe(true);
  });

  it("returns empty rather than inventing text", () => {
    expect(pickSummary("আরও পড়ুন", [])).toBe("");
  });
});
