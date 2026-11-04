"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireStudent, canReadStudent, getSessionStudent, toPublicStudent } from "@/lib/guards";
import { writeSession } from "@/lib/session";

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

export async function saveWordToBankAction(claimedStudentId: string, termId: string) {
  const studentId = (await requireStudent(claimedStudentId)).id;
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
  const student = await requireStudent();
  await prisma.savedWord.updateMany({
    where: { id: savedWordId, studentId: student.id },
    data: { mastered: Boolean(mastered) },
  });
  revalidatePath("/saved");
  return { success: true };
}

export async function resetWordBankProgressAction(claimedStudentId: string) {
  const studentId = (await requireStudent(claimedStudentId)).id;
  await prisma.savedWord.updateMany({
    where: { studentId },
    data: { mastered: false },
  });
  revalidatePath("/saved");
  return { success: true };
}

export async function getStudentWordBank(studentId: string) {
  if (!(await canReadStudent(studentId))) return [];
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
    studentId = (await requireStudent(studentId)).id;
    await prisma.quizAttempt.create({
      data: {
        studentId,
        questionId,
        chosenOption,
        isCorrect,
      },
    });

    try {
      await prisma.student.update({
        where: { id: studentId },
        data: { quizzesTaken: { increment: 1 } },
      });
      await syncTelemetryIncrement(studentId, "quizzesCompletedCount");
    } catch {
      // safe fallback
    }

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
  if (!(await canReadStudent(studentId))) {
    throw new Error("অননুমোদিত অ্যাক্সেস।");
  }
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
  if (!(await canReadStudent(studentId))) return [];
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
  claimedStudentId: string,
  articleSlug: string,
  quoteText: string,
  memo?: string
) {
  const studentId = (await requireStudent(claimedStudentId)).id;
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

  try {
    await prisma.student.update({
      where: { id: studentId },
      data: { notesSaved: { increment: 1 } },
    });
    await syncTelemetryIncrement(studentId, "highlightsSavedCount");
  } catch {
    // safe fallback
  }

  revalidatePath(`/article/${articleSlug}`);
  revalidatePath("/saved");
  return note;
}

export async function deleteStudyNoteAction(noteId: string, articleSlug?: string) {
  const student = await requireStudent();
  await prisma.studyNote.deleteMany({
    where: { id: noteId, studentId: student.id },
  });

  if (articleSlug) {
    revalidatePath(`/article/${articleSlug}`);
  }
  revalidatePath("/saved");
  return { success: true };
}

export async function saveCustomDictionaryTermAction(
  claimedStudentId: string,
  articleSlug: string,
  term: string,
  definition: string,
  context?: string
) {
  const studentId = (await requireStudent(claimedStudentId)).id;
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
  claimedStudentId: string,
  articleSlug: string,
  summaryText: string
) {
  const studentId = (await requireStudent(claimedStudentId)).id;
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
  claimedStudentId: string,
  articleSlug: string,
  quoteText: string,
  colorName: "হলুদ মার্কার" | "সবুজ মার্কার" | "বেগুনি মার্কার",
  memo?: string
) {
  const studentId = (await requireStudent(claimedStudentId)).id;
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

  try {
    await prisma.student.update({
      where: { id: studentId },
      data: { notesSaved: { increment: 1 } },
    });
    await syncTelemetryIncrement(studentId, "highlightsSavedCount");
  } catch {
    // safe fallback
  }

  revalidatePath(`/article/${articleSlug}`);
  revalidatePath("/saved");
  return note;
}

// -------------------------------------------------------------
// 5. Daily 5-Minute Current Affairs Capsule Engine
// -------------------------------------------------------------
export async function getDailyCapsuleArticles() {
  let articles = await prisma.article.findMany({
    where: { isCapsule: true, sourceUrl: { not: null } },
    include: {
      category: true,
      vocabulary: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  if (articles.length < 4) {
    articles = await prisma.article.findMany({
      where: { sourceUrl: { not: null } },
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
    content: "", // link-out model
    keyTakeaways: safeParseJson<string[]>(a.keyTakeaways, []),
  }));
}

// -------------------------------------------------------------
// 6. Student Identity, Profiles & Track Switcher
// -------------------------------------------------------------
export async function getAllStudentsAction() {
  await requireAdmin();
  const students = await prisma.student.findMany({
    orderBy: { name: "asc" },
  });
  return students.map((s) => toPublicStudent(s));
}

/** Admin-only: impersonate a student (replaces the admin's own session). */
export async function switchActiveStudentAction(studentId: string) {
  await requireAdmin();
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true, role: true } });
  if (!student) throw new Error("ব্যবহারকারী পাওয়া যায়নি।");
  await writeSession(student.id, student.role === "admin" ? "admin" : "student");

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath("/capsule");
  return { success: true };
}

export async function updateStudentProfileAction(
  claimedStudentId: string,
  data: {
    name: string;
    targetTrack: string;
    institution: string;
  }
) {
  const studentId = (await requireStudent(claimedStudentId)).id;
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
  return toPublicStudent(updated);
}

/** The logged-in student for this request (without the password hash), or null. */
export async function getActiveStudent() {
  return getSessionStudent();
}

// -------------------------------------------------------------
// 7. User Activity Counter & Marketing Analytics Engine
// -------------------------------------------------------------
async function syncTelemetryIncrement(
  studentId: string,
  field: "articlesReadCount" | "dictionaryLookupsCount" | "quizzesCompletedCount" | "highlightsSavedCount"
) {
  try {
    await prisma.studyTelemetry.upsert({
      where: { userId: studentId },
      create: {
        userId: studentId,
        articlesReadCount: field === "articlesReadCount" ? 1 : 0,
        dictionaryLookupsCount: field === "dictionaryLookupsCount" ? 1 : 0,
        quizzesCompletedCount: field === "quizzesCompletedCount" ? 1 : 0,
        highlightsSavedCount: field === "highlightsSavedCount" ? 1 : 0,
      },
      update: {
        [field]: { increment: 1 },
      },
    });
  } catch {
    // Non-blocking telemetry sync
  }
}

export async function trackArticleReadAction(articleSlug: string) {
  const student = await getActiveStudent();
  if (!student) return { tracked: false };

  const article = await prisma.article.findUnique({
    where: { slug: articleSlug },
    select: { id: true },
  });
  if (!article) return { tracked: false };

  try {
    const existing = await prisma.articleRead.findUnique({
      where: {
        studentId_articleId: {
          studentId: student.id,
          articleId: article.id,
        },
      },
    });

    if (!existing) {
      await prisma.articleRead.create({
        data: {
          studentId: student.id,
          articleId: article.id,
        },
      });

      await prisma.student.update({
        where: { id: student.id },
        data: { articlesRead: { increment: 1 } },
      });
      await syncTelemetryIncrement(student.id, "articlesReadCount");
      return { tracked: true, isNew: true };
    }
  } catch {
    // safe fallback
  }

  return { tracked: true, isNew: false };
}

export async function trackWordLookupAction(word: string) {
  const student = await getActiveStudent();
  if (!student) return { tracked: false };

  try {
    await prisma.student.update({
      where: { id: student.id },
      data: { wordsLookedUp: { increment: 1 } },
    });
    await syncTelemetryIncrement(student.id, "dictionaryLookupsCount");
    return { tracked: true };
  } catch {
    return { tracked: false };
  }
}

export async function getStudentActivityStatsAction(studentId?: string) {
  let targetId = studentId;
  if (!targetId) {
    const active = await getActiveStudent();
    targetId = active?.id;
  }
  if (!targetId) return null;
  if (!(await canReadStudent(targetId))) return null;

  const student = await prisma.student.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      name: true,
      email: true,
      articlesRead: true,
      wordsLookedUp: true,
      quizzesTaken: true,
      notesSaved: true,
      streakDays: true,
    },
  });

  if (!student) return null;

  const [actualNotes, actualWords, actualAttempts, actualReads] = await Promise.all([
    prisma.studyNote.count({ where: { studentId: targetId } }),
    prisma.savedWord.count({ where: { studentId: targetId } }),
    prisma.quizAttempt.count({ where: { studentId: targetId } }),
    prisma.articleRead.count({ where: { studentId: targetId } }),
  ]);

  const effectiveArticlesRead = Math.max(student.articlesRead, actualReads);
  const effectiveWordsLookedUp = Math.max(student.wordsLookedUp, actualWords);
  const effectiveQuizzesTaken = Math.max(student.quizzesTaken, actualAttempts);
  const effectiveNotesSaved = Math.max(student.notesSaved, actualNotes);

  const totalMinutesSaved =
    effectiveArticlesRead * 15 +
    effectiveWordsLookedUp * 2 +
    effectiveQuizzesTaken * 3 +
    effectiveNotesSaved * 5;
  const hoursSavedEstimate = Math.max(1, Math.round(totalMinutesSaved / 60));

  const now = new Date();
  const trialEnd = new Date("2026-12-02T23:59:59+06:00");
  const nov28EarlyBird = new Date("2026-11-28T00:00:00+06:00");

  const diffTrialMs = trialEnd.getTime() - now.getTime();
  const trialDaysRemaining = Math.max(0, Math.ceil(diffTrialMs / (1000 * 60 * 60 * 24)));

  const diffNov28Ms = nov28EarlyBird.getTime() - now.getTime();
  const nov28DaysRemaining = Math.max(0, Math.ceil(diffNov28Ms / (1000 * 60 * 60 * 24)));

  return {
    studentId: student.id,
    name: student.name,
    email: student.email,
    articlesRead: effectiveArticlesRead,
    wordsLookedUp: effectiveWordsLookedUp,
    quizzesTaken: effectiveQuizzesTaken,
    notesSaved: effectiveNotesSaved,
    streakDays: student.streakDays,
    hoursSavedEstimate,
    trialEndDate: "২ ডিসেম্বর ২০২৬",
    trialDaysRemaining,
    nov28EarlyBirdDate: "২৮ নভেম্বর ২০২৬",
    nov28DaysRemaining,
  };
}

/**
 * 8. User Study Wrapped Telemetry Tracker (December 2 Wrap Campaign)
 */
export async function getStudentStudyWrappedAction(studentId?: string) {
  let targetId = studentId;
  if (!targetId) {
    const active = await getActiveStudent();
    targetId = active?.id;
  }
  if (!targetId) return null;
  if (!(await canReadStudent(targetId))) return null;

  let telemetry = await prisma.studyTelemetry.findUnique({
    where: { userId: targetId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          targetTrack: true,
          streakDays: true,
          createdAt: true,
        },
      },
    },
  });

  if (!telemetry) {
    const student = await prisma.student.findUnique({ where: { id: targetId } });
    if (!student) return null;

    telemetry = await prisma.studyTelemetry.create({
      data: {
        userId: targetId,
        signupDate: student.createdAt,
        articlesReadCount: student.articlesRead,
        dictionaryLookupsCount: student.wordsLookedUp,
        quizzesCompletedCount: student.quizzesTaken,
        highlightsSavedCount: student.notesSaved,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            targetTrack: true,
            streakDays: true,
            createdAt: true,
          },
        },
      },
    });
  }

  return telemetry;
}
