"use server";

import { prisma } from "@/lib/prisma";
import { getSessionStudent } from "@/lib/guards";
import { EXAM_MINUTES, SECTIONS, dhakaToday, examPhase, examWindow, type ExamPhase, type SectionId } from "@/lib/exam/rules";
import { GRACE_MS, finalizeAttempt } from "@/lib/exam/attempts";
import { imageUrl } from "@/lib/exam/uploads";

const MAX_OBJECTIVE = 200;
const MAX_WRITING = 6000;

export interface ExamSummary {
  id: string;
  title: string;
  day: string;
  phase: ExamPhase;
  opensAt: string;
  closesAt: string;
  serverNow: string;
  /** none = not started; started = in progress; submitted = finished */
  myState: "guest" | "none" | "started" | "submitted";
  /** Minutes a student starting now would get */
  minutesIfStartNow: number;
}

export interface PaperQuestion {
  id: string;
  kind: string;
  question: string;
  options: string[];
  imageUrl: string | null;
  marks: number;
  passageNo: number;
}

export interface Paper {
  examId: string;
  title: string;
  deadline: string;
  serverNow: string;
  sections: { id: SectionId; label: string; marks: number; passage: string; passage2: string; questions: PaperQuestion[] }[];
  answers: Record<string, string>;
}

const parse = <T,>(json: string | null | undefined, fallback: T): T => {
  try {
    return json ? (JSON.parse(json) as T) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * The exam to show students: the earliest scheduled exam from today on; if today's has
 * closed, it is still shown today (for its result).
 */
async function currentExam() {
  return prisma.weeklyExam.findFirst({ where: { status: "scheduled", day: { gte: dhakaToday() } }, orderBy: { day: "asc" } });
}

// ---------------------------------------------------------------------------

export async function getExamSummaryAction(): Promise<ExamSummary | null> {
  const exam = await currentExam();
  if (!exam) return null;
  const { opensAt, closesAt } = examWindow(exam.day);
  const student = await getSessionStudent();
  let myState: ExamSummary["myState"] = student ? "none" : "guest";
  if (student) {
    let attempt = await prisma.examAttempt.findUnique({ where: { examId_studentId: { examId: exam.id, studentId: student.id } } });
    if (attempt && !attempt.submittedAt && attempt.deadline.getTime() + GRACE_MS < Date.now()) {
      await finalizeAttempt(attempt.id);
      attempt = await prisma.examAttempt.findUnique({ where: { id: attempt.id } });
    }
    if (attempt) myState = attempt.submittedAt ? "submitted" : "started";
  }
  const now = Date.now();
  return {
    id: exam.id,
    title: exam.title,
    day: exam.day,
    phase: examPhase(exam.status, exam.day, now),
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
    serverNow: new Date(now).toISOString(),
    myState,
    minutesIfStartNow: Math.max(0, Math.min(EXAM_MINUTES, Math.floor((closesAt.getTime() - now) / 60000))),
  };
}

async function liveAttempt(examId: string) {
  const student = await getSessionStudent();
  if (!student) return { error: "Please log in to sit the exam." as const };
  const exam = await prisma.weeklyExam.findUnique({ where: { id: examId }, include: { questions: true } });
  if (!exam || examPhase(exam.status, exam.day) !== "live") return { error: "The exam is not open now." as const };
  return { student, exam };
}

/** Start (or resume) the exam: returns the paper without any answers or explanations. */
export async function startExamAction(examId: string): Promise<{ ok: true; paper: Paper } | { ok: false; message: string }> {
  const r = await liveAttempt(examId);
  if ("error" in r) return { ok: false, message: r.error! };
  const { student, exam } = r;
  const { closesAt } = examWindow(exam.day);

  let attempt = await prisma.examAttempt.findUnique({ where: { examId_studentId: { examId, studentId: student.id } }, include: { answers: true } });
  if (attempt?.submittedAt) return { ok: false, message: "You have already submitted this exam. Results appear at 12:00 pm." };
  if (attempt && attempt.deadline.getTime() + GRACE_MS < Date.now()) {
    await finalizeAttempt(attempt.id);
    return { ok: false, message: "Your time is over; your answers were submitted." };
  }
  if (!attempt) {
    const deadline = new Date(Math.min(Date.now() + EXAM_MINUTES * 60_000, closesAt.getTime()));
    try {
      attempt = await prisma.examAttempt.create({ data: { examId, studentId: student.id, deadline }, include: { answers: true } });
    } catch {
      // Started twice at the same moment (two tabs): use the one that won
      attempt = await prisma.examAttempt.findUnique({ where: { examId_studentId: { examId, studentId: student.id } }, include: { answers: true } });
      if (!attempt) return { ok: false, message: "Could not start the exam. Please try again." };
    }
  }

  const passages = parse<Partial<Record<string, string>>>(exam.passages, {});
  const sections = SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    marks: s.marks,
    passage: passages[s.id] || "",
    passage2: s.id === "ielts" ? passages.ielts2 || "" : "",
    questions: exam.questions
      .filter((q) => q.section === s.id)
      .sort((a, b) => a.passageNo - b.passageNo || a.position - b.position)
      .map((q) => ({
        id: q.id,
        kind: q.kind,
        question: q.question,
        options: parse<string[]>(q.options, []),
        imageUrl: q.imagePath ? imageUrl(q.imagePath) : null,
        marks: q.marks,
        passageNo: q.passageNo,
      })),
  })).filter((s) => s.questions.length);

  return {
    ok: true,
    paper: {
      examId,
      title: exam.title,
      deadline: attempt.deadline.toISOString(),
      serverNow: new Date().toISOString(),
      sections,
      answers: Object.fromEntries(attempt.answers.map((a) => [a.questionId, a.answer])),
    },
  };
}

/** Save one answer as the student goes (an empty answer clears it). */
export async function saveExamAnswerAction(examId: string, questionId: string, answer: string) {
  const r = await liveAttempt(examId);
  if ("error" in r) return { ok: false as const, message: r.error! };
  const q = r.exam.questions.find((x) => x.id === questionId);
  if (!q) return { ok: false as const, message: "Question not found." };
  const attempt = await prisma.examAttempt.findUnique({ where: { examId_studentId: { examId, studentId: r.student.id } } });
  if (!attempt || attempt.submittedAt) return { ok: false as const, message: "This exam is already submitted." };
  if (Date.now() > attempt.deadline.getTime() + GRACE_MS) return { ok: false as const, message: "Time is over." };

  const value = String(answer ?? "").slice(0, q.kind === "writing" ? MAX_WRITING : MAX_OBJECTIVE);
  if (!value.trim()) {
    await prisma.examAnswer.deleteMany({ where: { attemptId: attempt.id, questionId } });
  } else {
    await prisma.examAnswer.upsert({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
      create: { attemptId: attempt.id, questionId, answer: value },
      update: { answer: value },
    });
  }
  return { ok: true as const };
}

/** Hand in the exam (also called by the timer when time runs out). */
export async function submitExamAction(examId: string) {
  const student = await getSessionStudent();
  if (!student) return { ok: false as const, message: "Please log in." };
  const attempt = await prisma.examAttempt.findUnique({ where: { examId_studentId: { examId, studentId: student.id } } });
  if (!attempt) return { ok: false as const, message: "You have not started this exam." };
  await finalizeAttempt(attempt.id);
  return { ok: true as const };
}
