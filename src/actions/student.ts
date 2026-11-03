"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

function safeParseJson<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  if (typeof value !== "string") return value;
  try {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    return JSON.parse(trimmed);
  } catch {
    return fallback;
  }
}


// -------------------------------------------------------------
// 1. Vocabulary & Word Bank Service
// -------------------------------------------------------------
export async function getArticleVocabulary(articleSlug: string) {
  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });

  if (!article) return [];

  return await prisma.vocabularyTerm.findMany({
    where: { articleId: article.id },
  });
}

export async function saveWordToBankAction(studentId: string, termId: string) {
  const existing = await prisma.savedWord.findUnique({
    where: {
      studentId_termId: {
        studentId,
        termId,
      },
    },
  });

  if (existing) {
    // Toggle remove if already saved
    await prisma.savedWord.delete({
      where: { id: existing.id },
    });
    revalidatePath("/saved");
    return { saved: false };
  }

  await prisma.savedWord.create({
    data: {
      studentId,
      termId,
      mastered: false,
    },
  });

  revalidatePath("/saved");
  return { saved: true };
}

export async function toggleWordMasteredAction(savedWordId: string, mastered: boolean) {
  await prisma.savedWord.update({
    where: { id: savedWordId },
    data: { mastered },
  });
  revalidatePath("/saved");
  return { success: true };
}

export async function resetWordBankProgressAction(studentId: string) {
  await prisma.savedWord.updateMany({
    where: { studentId },
    data: { mastered: false },
  });
  revalidatePath("/saved");
  return { success: true };
}

export async function getStudentWordBank(studentId: string) {
  const words = await prisma.savedWord.findMany({
    where: { studentId },
    include: {
      term: {
        include: {
          article: {
            select: { slug: true, title: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return words;
}

// -------------------------------------------------------------
// 2. Active Recall Micro-Quiz Service
// -------------------------------------------------------------
export async function getArticleQuiz(articleSlug: string) {
  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });

  if (!article) return [];

  const questions = await prisma.quizQuestion.findMany({
    where: { articleId: article.id },
  });

  return questions.map((q) => ({
    ...q,
    options: safeParseJson<string[]>(q.options, []),
  }));
}

export async function submitQuizAnswerAction(
  studentId: string,
  questionId: string,
  chosenOption: number
) {
  const question = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("প্রশ্নটি পাওয়া যায়নি।");
  }

  const isCorrect = question.correctOption === chosenOption;

  if (studentId) {
    await prisma.quizAttempt.create({
      data: {
        studentId,
        questionId,
        chosenOption,
        isCorrect,
      },
    });
    revalidatePath("/saved");
  }

  return {
    isCorrect,
    correctOption: question.correctOption,
    explanation: question.explanation,
  };
}

// -------------------------------------------------------------
// 3. Quiz Performance & Weakness Analytics Service
// -------------------------------------------------------------
export async function getStudentQuizAnalytics(studentId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { studentId },
    include: {
      question: {
        include: {
          article: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const total = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Category breakdown
  const categoryMap = new Map<string, { name: string; total: number; correct: number }>();

  for (const att of attempts) {
    const catName = att.question.article.category.name || "সাধারণ";
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, { name: catName, total: 0, correct: 0 });
    }
    const catStats = categoryMap.get(catName)!;
    catStats.total++;
    if (att.isCorrect) catStats.correct++;
  }

  const categoryBreakdown = Array.from(categoryMap.values()).map((c) => ({
    ...c,
    percent: Math.round((c.correct / c.total) * 100),
  }));

  // Mistake Review: unique list of questions answered incorrectly
  const mistakeMap = new Map<string, any>();
  for (const att of attempts) {
    if (!att.isCorrect && !mistakeMap.has(att.questionId)) {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(att.question.options);
      } catch {
        parsedOptions = [];
      }

      mistakeMap.set(att.questionId, {
        attemptId: att.id,
        questionId: att.questionId,
        questionText: att.question.question,
        options: parsedOptions,
        chosenOption: att.chosenOption,
        chosenOptionText: parsedOptions[att.chosenOption] || `বিকল্প ${att.chosenOption + 1}`,
        correctOption: att.question.correctOption,
        correctOptionText: parsedOptions[att.question.correctOption] || `বিকল্প ${att.question.correctOption + 1}`,
        explanation: att.question.explanation,
        articleTitle: att.question.article.title,
        articleSlug: att.question.article.slug,
        categoryName: att.question.article.category.name,
        date: att.createdAt.toISOString(),
      });
    }
  }

  return {
    totalAttempts: total,
    correctAttempts: correct,
    accuracyPercent: accuracy,
    categoryBreakdown,
    mistakes: Array.from(mistakeMap.values()),
  };
}

// -------------------------------------------------------------
// 4. Cloud Study Notebook & Personal Highlighting
// -------------------------------------------------------------
export async function getArticleStudyNotes(studentId: string, articleSlug: string) {
  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });

  if (!article) return [];

  return await prisma.studyNote.findMany({
    where: {
      studentId,
      articleId: article.id,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createStudyNoteAction(
  studentId: string,
  articleSlug: string,
  quoteText: string,
  memo?: string
) {
  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });

  if (!article) {
    throw new Error("নিবন্ধটি পাওয়া যায়নি।");
  }

  const note = await prisma.studyNote.create({
    data: {
      studentId,
      articleId: article.id,
      quoteText,
      memo: memo || null,
    },
  });

  revalidatePath(`/article/${articleSlug}`);
  revalidatePath("/saved");
  return note;
}

export async function deleteStudyNoteAction(noteId: string, articleSlug?: string) {
  await prisma.studyNote.delete({
    where: { id: noteId },
  });

  if (articleSlug) {
    revalidatePath(`/article/${articleSlug}`);
  }
  revalidatePath("/saved");
  return { success: true };
}

export async function saveCustomDictionaryTermAction(
  studentId: string,
  articleSlug: string,
  term: string,
  definition: string,
  context?: string
) {
  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });

  if (!article) {
    throw new Error("নিবন্ধটি পাওয়া যায়নি।");
  }

  // Find or create VocabularyTerm
  let vocabTerm = await prisma.vocabularyTerm.findFirst({
    where: {
      articleId: article.id,
      term: term.trim(),
    },
  });

  if (!vocabTerm) {
    vocabTerm = await prisma.vocabularyTerm.create({
      data: {
        articleId: article.id,
        term: term.trim(),
        definition: definition.trim(),
        context: context ? context.trim() : null,
      },
    });
  }

  // Save into SavedWord for student
  const existingSaved = await prisma.savedWord.findUnique({
    where: {
      studentId_termId: {
        studentId,
        termId: vocabTerm.id,
      },
    },
  });

  if (!existingSaved) {
    await prisma.savedWord.create({
      data: {
        studentId,
        termId: vocabTerm.id,
        mastered: false,
      },
    });
  }

  revalidatePath("/saved");
  revalidatePath(`/article/${articleSlug}`);
  return { success: true, termId: vocabTerm.id };
}

export async function saveArticleSummaryReflectionAction(
  studentId: string,
  articleSlug: string,
  summaryText: string
) {
  if (!summaryText.trim()) {
    throw new Error("সারসংক্ষেপ খালি হতে পারে না।");
  }

  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });

  if (!article) {
    throw new Error("নিবন্ধটি পাওয়া যায়নি।");
  }

  const note = await prisma.studyNote.create({
    data: {
      studentId,
      articleId: article.id,
      quoteText: summaryText.trim(),
      memo: "[সারসংক্ষেপ অনুশীলন]",
    },
  });

  revalidatePath(`/article/${articleSlug}`);
  revalidatePath("/saved");
  return note;
}

export async function saveMarkerHighlightAction(
  studentId: string,
  articleSlug: string,
  quoteText: string,
  colorName: "হলুদ মার্কার" | "সবুজ মার্কার" | "বেগুনি মার্কার",
  memo?: string
) {
  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });

  if (!article) {
    throw new Error("নিবন্ধটি পাওয়া যায়নি।");
  }

  const tag = `[${colorName}]`;
  const finalMemo = memo ? `${tag} ${memo.trim()}` : tag;

  const note = await prisma.studyNote.create({
    data: {
      studentId,
      articleId: article.id,
      quoteText: quoteText.trim(),
      memo: finalMemo,
    },
  });

  revalidatePath(`/article/${articleSlug}`);
  revalidatePath("/saved");
  return note;
}

// -------------------------------------------------------------
// 5. Daily 5-Minute Current Affairs Capsule Engine
// -------------------------------------------------------------
export async function getDailyCapsuleArticles() {
  let articles = await prisma.article.findMany({
    where: { isCapsule: true },
    include: {
      category: true,
      vocabulary: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  if (articles.length < 4) {
    articles = await prisma.article.findMany({
      include: {
        category: true,
        vocabulary: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  }

  return articles.map((a) => ({
    ...a,
    keyTakeaways: safeParseJson<string[]>(a.keyTakeaways, []),
  }));
}

// -------------------------------------------------------------
// 6. Student Identity, Profiles & Track Switcher
// -------------------------------------------------------------
export async function getAllStudentsAction() {
  return await prisma.student.findMany({
    orderBy: { name: "asc" },
  });
}

export async function switchActiveStudentAction(studentId: string) {
  const cookieStore = await cookies();
  cookieStore.set("khobor_student_id", studentId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/capsule");
  return { success: true };
}

export async function updateStudentProfileAction(
  studentId: string,
  data: {
    name: string;
    targetTrack: string;
    institution: string;
  }
) {
  const updated = await prisma.student.update({
    where: { id: studentId },
    data: {
      name: data.name.trim(),
      targetTrack: data.targetTrack.trim(),
      institution: data.institution.trim(),
    },
  });

  revalidatePath("/");
  revalidatePath("/saved");
  return updated;
}

export async function getActiveStudent() {
  const cookieStore = await cookies();
  const cookieId = cookieStore.get("khobor_student_id")?.value;

  if (cookieId) {
    const student = await prisma.student.findUnique({
      where: { id: cookieId },
    });
    if (student) return student;
  }

  return null;
}
