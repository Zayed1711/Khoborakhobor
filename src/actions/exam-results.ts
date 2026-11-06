"use server";

import { prisma } from "@/lib/prisma";
import { getSessionStudent, isAdminRequest, requireAdmin } from "@/lib/guards";
import { SECTIONS, examPhase, type SectionId } from "@/lib/exam/rules";
import { isRight, rankMerit, type MeritRow } from "@/lib/exam/scoring";
import { finalizeExpiredAttempts } from "@/lib/exam/attempts";
import { imageUrl } from "@/lib/exam/uploads";

const parse = <T,>(json: string | null | undefined, fallback: T): T => {
  try {
    return json ? (JSON.parse(json) as T) : fallback;
  } catch {
    return fallback;
  }
};

export interface PublicMeritRow {
  rank: number;
  name: string;
  total: number;
  objective: number;
  writing: number;
  writingPending: boolean;
  timeTakenSec: number;
  isMe: boolean;
}

export interface ReviewItem {
  n: number;
  section: SectionId;
  kind: string;
  question: string;
  options: string[];
  imageUrl: string | null;
  myAnswer: string;
  correctAnswer: string;
  result: "right" | "wrong" | "blank" | "writing";
  explanation: string;
  /** writing only */
  marks: number;
  given: number | null;
  feedback: string | null;
}

export interface ExamResults {
  exam: { id: string; title: string; day: string };
  merit: PublicMeritRow[];
  takers: number;
  pendingWritings: number;
  me: null | {
    rank: number;
    total: number;
    objective: number;
    correct: number;
    wrong: number;
    negative: number;
    writing: number;
    writingPending: boolean;
    timeTakenSec: number;
    review: ReviewItem[];
    passages: Partial<Record<SectionId, string>>;
  };
}

/** Rank everyone who sat the exam (finishing attempts whose time ran out first). */
async function meritFor(examId: string) {
  await finalizeExpiredAttempts(examId);
  const [attempts, writings] = await Promise.all([
    prisma.examAttempt.findMany({ where: { examId, submittedAt: { not: null } }, include: { student: { select: { name: true } } } }),
    prisma.writingSubmission.findMany({ where: { examId }, select: { studentId: true, marks: true, status: true } }),
  ]);
  const marksBy = new Map<string, { marks: number; pending: boolean }>();
  for (const w of writings) {
    const m = marksBy.get(w.studentId) || { marks: 0, pending: false };
    if (w.status === "reviewed" && w.marks !== null) m.marks += w.marks;
    else m.pending = true;
    marksBy.set(w.studentId, m);
  }
  const ranked = rankMerit(
    attempts.map((a) => ({
      studentId: a.studentId,
      name: a.student.name || "Student",
      objectiveScore: a.objectiveScore,
      writingMarks: marksBy.get(a.studentId)?.marks || 0,
      negative: a.negative,
      timeTakenSec: a.timeTakenSec ?? 0,
    }))
  );
  return { ranked, attempts, marksBy, pendingWritings: writings.filter((w) => w.status !== "reviewed").length };
}

const toPublic = (r: MeritRow, meId: string | null, pending: boolean): PublicMeritRow => ({
  rank: r.rank,
  name: r.name,
  total: r.total,
  objective: Math.round(r.objectiveScore * 100) / 100,
  writing: r.writingMarks,
  writingPending: pending,
  timeTakenSec: r.timeTakenSec,
  isMe: r.studentId === meId,
});

/** Results of a closed exam: the public merit list, and the logged-in student's own paper with answers. */
export async function getExamResultsAction(examId: string): Promise<ExamResults | null> {
  const exam = await prisma.weeklyExam.findUnique({ where: { id: examId }, include: { questions: true } });
  if (!exam) return null;
  const closed = examPhase(exam.status, exam.day) === "closed";
  if (!closed && !(await isAdminRequest())) return null;

  const student = await getSessionStudent();
  const { ranked, attempts, marksBy, pendingWritings } = await meritFor(examId);
  const meId = student?.id ?? null;
  // Top 100 for everyone, plus the student's own row if lower down
  const shown = ranked.filter((r, i) => i < 100 || r.studentId === meId);

  let me: ExamResults["me"] = null;
  const mine = meId ? ranked.find((r) => r.studentId === meId) : undefined;
  const attempt = meId ? attempts.find((a) => a.studentId === meId) : undefined;
  if (mine && attempt) {
    const [answers, writings] = await Promise.all([
      prisma.examAnswer.findMany({ where: { attemptId: attempt.id } }),
      prisma.writingSubmission.findMany({ where: { examId, studentId: meId! } }),
    ]);
    const given = Object.fromEntries(answers.map((a) => [a.questionId, a.answer]));
    const order = Object.fromEntries(SECTIONS.map((s, i) => [s.id, i]));
    const qs = [...exam.questions].sort((a, b) => order[a.section] - order[b.section] || a.position - b.position);
    const review: ReviewItem[] = qs.map((q, i) => {
      const options = parse<string[]>(q.options, []);
      const my = given[q.id] || "";
      const w = writings.find((x) => x.examQuestionId === q.id);
      const r = q.kind === "writing" ? null : isRight(q, my);
      const show = (v: string) => (q.kind === "mcq" ? (options[Number(v)] !== undefined && v !== "" ? `${String.fromCharCode(65 + Number(v))}. ${options[Number(v)]}` : "") : v);
      return {
        n: i + 1,
        section: q.section as SectionId,
        kind: q.kind,
        question: q.question,
        options,
        imageUrl: q.imagePath ? imageUrl(q.imagePath) : null,
        myAnswer: show(my),
        correctAnswer: q.kind === "writing" ? "" : show(q.answer),
        result: q.kind === "writing" ? "writing" : r === null ? "blank" : r ? "right" : "wrong",
        explanation: q.explanation || "",
        marks: q.marks,
        given: w && w.status === "reviewed" ? w.marks : null,
        feedback: w && w.status === "reviewed" ? w.feedback : null,
      };
    });
    const wm = marksBy.get(meId!);
    me = {
      rank: mine.rank,
      total: mine.total,
      objective: attempt.objectiveScore,
      correct: attempt.correct,
      wrong: attempt.wrong,
      negative: attempt.negative,
      writing: wm?.marks || 0,
      writingPending: !!wm?.pending,
      timeTakenSec: attempt.timeTakenSec ?? 0,
      review,
      passages: parse(exam.passages, {}),
    };
  }

  return {
    exam: { id: exam.id, title: exam.title, day: exam.day },
    merit: shown.map((r) => toPublic(r, meId, !!marksBy.get(r.studentId)?.pending)),
    takers: ranked.length,
    pendingWritings,
    me,
  };
}

/** Closed exams, newest first, for "past results". */
export async function listPastExamsAction() {
  const rows = await prisma.weeklyExam.findMany({ where: { status: "scheduled" }, orderBy: { day: "desc" }, take: 20, select: { id: true, title: true, day: true, status: true } });
  return rows.filter((r) => examPhase(r.status, r.day) === "closed").slice(0, 10).map(({ id, title, day }) => ({ id, title, day }));
}

// ---------------------------------------------------------------------------
// Admin marking of the two writing tasks
// ---------------------------------------------------------------------------

export async function listExamWritingsAction(examId: string) {
  await requireAdmin();
  await finalizeExpiredAttempts(examId);
  const [rows, questions] = await Promise.all([
    prisma.writingSubmission.findMany({ where: { examId }, orderBy: [{ status: "asc" }, { createdAt: "asc" }], include: { student: { select: { name: true, email: true } } } }),
    prisma.examQuestion.findMany({ where: { examId, kind: "writing" }, select: { id: true, marks: true, imagePath: true } }),
  ]);
  const q = new Map(questions.map((x) => [x.id, x]));
  return rows.map((w) => ({
    id: w.id,
    studentName: w.student.name || w.student.email || "Student",
    task: w.topic,
    prompt: w.prompt,
    imageUrl: w.examQuestionId && q.get(w.examQuestionId)?.imagePath ? imageUrl(q.get(w.examQuestionId)!.imagePath!) : null,
    text: w.text,
    wordCount: w.wordCount,
    maxMarks: (w.examQuestionId && q.get(w.examQuestionId)?.marks) || 5,
    marks: w.marks,
    feedback: w.feedback,
    status: w.status,
  }));
}

export async function markExamWritingAction(id: string, marks: number, feedback: string) {
  await requireAdmin();
  const w = await prisma.writingSubmission.findUnique({ where: { id } });
  if (!w || !w.examQuestionId) return { ok: false as const, message: "Not found." };
  const q = await prisma.examQuestion.findUnique({ where: { id: w.examQuestionId }, select: { marks: true } });
  const max = q?.marks ?? 5;
  const m = Math.round(Number(marks) * 2) / 2;
  if (!Number.isFinite(m) || m < 0 || m > max) return { ok: false as const, message: `Marks must be between 0 and ${max}.` };
  await prisma.writingSubmission.update({
    where: { id },
    data: { marks: m, feedback: (feedback || "").trim().slice(0, 4000) || null, status: "reviewed", reviewedAt: new Date() },
  });
  return { ok: true as const };
}

/** The merit list for the admin (also while the exam is live). */
export async function adminMeritAction(examId: string) {
  await requireAdmin();
  const { ranked, marksBy } = await meritFor(examId);
  return ranked.map((r) => ({ ...toPublic(r, null, !!marksBy.get(r.studentId)?.pending) }));
}
