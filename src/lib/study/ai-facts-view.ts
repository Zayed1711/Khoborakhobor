/**
 * What the site may show from ArticleFacts. Only checked answers (status "ok"), and only
 * when AI_FACTS=on. The publisher's own summary stays in Article.summary untouched: story
 * ranking and the "quoted from the report" key notes keep using it.
 */
import { aiMode } from "@/lib/study/ai-facts-store";

export type FactRow = {
  status: string;
  summary: string | null;
  who: string | null;
  what: string | null;
  whenText: string | null;
  whereText: string | null;
  numbers: string | null;
  keyQuotes?: string | null;
  gkCategory: string | null;
  examScore: number | null;
} | null | undefined;

/** Prisma include for the fields the site shows */
export const AI_FACTS_SELECT = {
  select: { status: true, summary: true, who: true, what: true, whenText: true, whereText: true, numbers: true, keyQuotes: true, gkCategory: true, examScore: true },
} as const;

const showing = (f: FactRow): f is NonNullable<FactRow> => aiMode() === "on" && !!f && f.status === "ok";

export function aiSummaryOf(f: FactRow): string | null {
  return showing(f) && f.summary ? f.summary : null;
}

/**
 * Key points the AI picked (by number) from the article's own sentences, as ones that
 * make sense on their own. Used for "মূল কথা" when at least two were picked; the
 * text is still the article's, word for word.
 */
export function aiKeyQuotesOf(f: FactRow): string[] | null {
  if (!showing(f)) return null;
  const q = parseList<string>(f.keyQuotes ?? null).filter((s) => typeof s === "string" && s.trim());
  return q.length >= 2 ? q : null;
}

export type FactCard = {
  who: string[];
  what: string;
  when: string;
  where: string;
  numbers: { label: string; value: string }[];
  gkCategory: string | null;
  examScore: number | null;
};

function parseList<T>(s: string | null): T[] {
  try {
    const v = JSON.parse(s || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function factCardOf(f: FactRow): FactCard | null {
  if (!showing(f)) return null;
  const card: FactCard = {
    who: parseList<string>(f.who).filter((x) => typeof x === "string" && x.trim()),
    what: f.what || "",
    when: f.whenText || "",
    where: f.whereText || "",
    numbers: parseList<{ label: string; value: string }>(f.numbers).filter((n) => n?.label && n?.value),
    gkCategory: f.gkCategory,
    examScore: f.examScore,
  };
  const empty = !card.who.length && !card.what && !card.when && !card.where && !card.numbers.length;
  return empty ? null : card;
}
