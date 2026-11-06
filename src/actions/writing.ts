"use server";

import { prisma } from "@/lib/prisma";
import { getSessionStudent, requireAdmin } from "@/lib/guards";
import { rateLimit } from "@/lib/session";
import { englishTopic } from "@/lib/study/topics";
import { WRITING_MAX_WORDS, WRITING_MIN_WORDS, wordCount, writingPromptFor } from "@/lib/study/writing-prompts";
import { revalidatePath } from "next/cache";

export interface WritingView {
  id: string;
  articleSlug: string;
  articleTitle: string;
  topic: string;
  prompt: string;
  text: string;
  wordCount: number;
  status: string;
  feedback: string | null;
  band: number | null;
  createdAt: string;
  reviewedAt: string | null;
}

const toView = (w: {
  id: string;
  articleSlug: string;
  articleTitle: string;
  topic: string;
  prompt: string;
  text: string;
  wordCount: number;
  status: string;
  feedback: string | null;
  band: number | null;
  createdAt: Date;
  reviewedAt: Date | null;
}): WritingView => ({ ...w, createdAt: w.createdAt.toISOString(), reviewedAt: w.reviewedAt ? w.reviewedAt.toISOString() : null });

/** A student submits their short writing on an English story; it waits for the admin's review. */
export async function submitWritingAction(articleSlug: string, text: string) {
  const student = await getSessionStudent();
  if (!student) return { ok: false as const, message: "Please log in to submit your writing." };
  if (!rateLimit(`writing:${student.id}`, 20, 60 * 60 * 1000)) {
    return { ok: false as const, message: "Too many submissions in a short time. Please try again later." };
  }

  const clean = (text || "").replace(/\r/g, "").trim().slice(0, 4000);
  const words = wordCount(clean);
  if (words < WRITING_MIN_WORDS) return { ok: false as const, message: `Please write at least ${WRITING_MIN_WORDS} words (you have ${words}).` };
  if (words > WRITING_MAX_WORDS) return { ok: false as const, message: `Please keep it under ${WRITING_MAX_WORDS} words (you have ${words}).` };

  const article = await prisma.article.findUnique({ where: { slug: articleSlug }, select: { id: true, slug: true, title: true, summary: true, sourceUrl: true } });
  if (!article || !article.sourceUrl || /[ঀ-৿]/.test(article.title)) return { ok: false as const, message: "Story not found." };

  // The prompt is decided on the server from the story's topic (not taken from the browser)
  const topic = englishTopic(article.title, article.summary);
  const saved = await prisma.writingSubmission.create({
    data: {
      studentId: student.id,
      articleId: article.id,
      articleSlug: article.slug,
      articleTitle: article.title,
      topic,
      prompt: writingPromptFor(topic, article.id),
      text: clean,
      wordCount: words,
    },
  });
  revalidatePath("/saved");
  return { ok: true as const, writing: toView(saved) };
}

/** The logged-in student's own writings (all stories, or one story). */
export async function getMyWritingsAction(articleSlug?: string): Promise<WritingView[]> {
  const student = await getSessionStudent();
  if (!student) return [];
  const rows = await prisma.writingSubmission.findMany({
    where: { studentId: student.id, examId: null, ...(articleSlug ? { articleSlug } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map(toView);
}

// ---------------------------------------------------------------------------
// Admin review (by hand, until an AI reviewer is added)
// ---------------------------------------------------------------------------

export async function listWritingsForReviewAction(status: "pending" | "reviewed" = "pending") {
  await requireAdmin();
  const rows = await prisma.writingSubmission.findMany({
    where: { status, examId: null }, // weekly exam writing is marked in the exam's own review
    orderBy: { createdAt: status === "pending" ? "asc" : "desc" },
    take: 100,
    include: { student: { select: { name: true, email: true } } },
  });
  const pending = await prisma.writingSubmission.count({ where: { status: "pending", examId: null } });
  return {
    pending,
    items: rows.map((w) => ({ ...toView(w), studentName: w.student.name || w.student.email || "Student" })),
  };
}

export async function reviewWritingAction(id: string, feedback: string, band: number | null) {
  await requireAdmin();
  const text = (feedback || "").trim().slice(0, 4000);
  if (!text) return { ok: false as const, message: "Please write some feedback." };
  const score = band === null || band === undefined || Number.isNaN(Number(band)) ? null : Math.min(9, Math.max(1, Math.round(Number(band) * 2) / 2));
  await prisma.writingSubmission.update({
    where: { id },
    data: { feedback: text, band: score, status: "reviewed", reviewedAt: new Date() },
  });
  revalidatePath("/saved");
  return { ok: true as const };
}
