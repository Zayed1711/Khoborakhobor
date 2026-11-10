/**
 * Slim article shape for feed lists (homepage, date archive, related links).
 *
 * Feed cards never render the article body or vocabulary, so those are dropped,
 * and quiz answers are withheld: the card checks an answer through
 * submitQuizAnswerAction instead of shipping `correctOption` to every browser.
 */

import { tidyQuotes } from "@/lib/study/extractive";

/** The newspaper's name without a feed label: "প্রথম আলো (শীর্ষ সংবাদ ও জাতীয়)" -> "প্রথম আলো" */
export function publisherName(name: string): string {
  return (name || "").replace(/s*[(（][^)）]*[)）]s*$/, "").trim() || name;
}

export interface FeedQuizQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface FeedCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  /** Checked AI summary (src/lib/study/ai-facts-view.ts); shown instead of the summary when present */
  aiSummary?: string | null;
  /** Real Bengali translation of an English story (only from an approved draft) */
  titleBn: string | null;
  summaryBn: string | null;
  keyTakeaways: string[];
  factTable: { parameter: string; value: string; relevance: string }[];
  sourceName: string | null;
  sourceUrl: string | null;
  examTags: string | null;
  featuredImage: string;
  imageCaption: string | null;
  publishedAt: string;
  readTime: string;
  isCapsule: boolean;
  isLead: boolean;
  createdAtIso: string;
  category: { name: string; slug: string };
  quizQuestions: FeedQuizQuestion[];
  /** English Learning stories: IELTS/syllabus topic label (see lib/study/topics.ts) */
  topic?: string;
  /** Visitor without an account: headline only (see guestCard) */
  locked?: boolean;
}

const STOPWORDS = new Set([
  "ও", "এবং", "বা", "এর", "ের", "থেকে", "জন্য", "সঙ্গে", "সাথে", "করে", "হয়", "হয়েছে", "একটি", "এই", "সেই",
  "the", "and", "for", "with", "from", "that", "this", "are", "was",
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;:।()\[\]/"'“”‘’\-–—|.]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/**
 * The fact table is produced by keyword templates, so it often attaches the same
 * generic facts (e.g. "অর্থ মন্ত্রণালয়, NBR, বাংলাদেশ ব্যাংক") to unrelated stories.
 * Keep a row only if most of its value's words actually occur in the article.
 */
export function isFactGrounded(value: string, articleText: string): boolean {
  const words = tokens(value);
  if (words.length === 0) return false;
  const haystack = articleText.toLowerCase();
  const hits = words.filter((w) => haystack.includes(w)).length;
  return hits / words.length >= 0.6;
}

function plainText(html: string | null | undefined): string {
  return (html || "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFeedCard(a: any): FeedCard {
  const firstQuiz = Array.isArray(a.quizQuestions) ? a.quizQuestions[0] : undefined;
  let options: string[] = [];
  if (firstQuiz) {
    if (Array.isArray(firstQuiz.options)) options = firstQuiz.options;
    else if (typeof firstQuiz.options === "string") {
      try {
        options = JSON.parse(firstQuiz.options);
      } catch {
        options = [];
      }
    }
  }

  const tidy = tidyQuotes<FeedCard["factTable"][number]>(Array.isArray(a.keyTakeaways) ? a.keyTakeaways : [], Array.isArray(a.factTable) ? a.factTable : []);

  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    aiSummary: a.aiSummary ?? null,
    titleBn: a.titleBn ?? null,
    summaryBn: a.summaryBn ?? null,
    keyTakeaways: tidy.keyTakeaways,
    // Rows are quoted from the story when it is scraped (src/lib/study/extractive.ts)
    factTable: tidy.factTable.filter(
      (row: { value?: string; relevance?: string }) => typeof row?.value === "string" && Boolean(row.relevance)
    ),
    sourceName: a.sourceName ? publisherName(a.sourceName) : null,
    sourceUrl: a.sourceUrl ?? null,
    examTags: a.examTags ?? null,
    featuredImage: a.featuredImage,
    imageCaption: a.imageCaption ?? null,
    publishedAt: a.publishedAt,
    readTime: a.readTime,
    isCapsule: Boolean(a.isCapsule),
    isLead: Boolean(a.isLead),
    createdAtIso:
      a.createdAtIso || (a.createdAt instanceof Date ? a.createdAt.toISOString() : new Date(a.createdAt).toISOString()),
    category: { name: a.category?.name || "", slug: a.category?.slug || "" },
    quizQuestions: firstQuiz && options.length > 0 ? [{ id: firstQuiz.id, question: firstQuiz.question, options }] : [],
    ...(a.topic ? { topic: a.topic } : {}),
  };
}

/**
 * What a visitor without an account may see of a story: the headline, source, section
 * and date only. Summary, picture, facts, key points and the publisher link are removed
 * on the server, so they never reach the browser. `locked` makes the card show a
 * "log in to read" prompt instead.
 */
export function guestCard<T extends Partial<FeedCard>>(c: T): T & { locked: true } {
  return {
    ...c,
    summary: "",
    aiSummary: null,
    summaryBn: null,
    keyTakeaways: [],
    factTable: [],
    featuredImage: "",
    sourceUrl: null,
    examTags: null,
    quizQuestions: [],
    locked: true,
  };
}
