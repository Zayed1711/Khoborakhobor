"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { getKeyNotes } from "@/lib/study/daily-feed";
import type { KeyNoteDay } from "@/lib/study/key-notes";
import {
  SECTIONS,
  examPhase,
  examProblems,
  isFriday,
  nextExamFriday,
  questionProblems,
  sectionById,
  type ExamPhase,
  type QuestionKind,
  type SectionId,
} from "@/lib/exam/rules";

export interface AdminExamQuestion {
  id: string;
  section: SectionId;
  kind: QuestionKind;
  position: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  marks: number;
  imagePath: string | null;
  sourceNote: SourceNote | null;
}

export interface SourceNote {
  day: string;
  slug: string;
  title: string;
  point: string;
}

export interface AdminExam {
  id: string;
  day: string;
  title: string;
  status: string;
  phase: ExamPhase;
  passages: Partial<Record<SectionId, string>>;
  questions: AdminExamQuestion[];
  problems: string[];
}

export interface EnglishStory {
  slug: string;
  title: string;
  day: string;
  text: string;
}

const parse = <T,>(json: string | null | undefined, fallback: T): T => {
  try {
    return json ? (JSON.parse(json) as T) : fallback;
  } catch {
    return fallback;
  }
};

const ORDER = Object.fromEntries(SECTIONS.map((s, i) => [s.id, i]));

type Row = Awaited<ReturnType<typeof loadRow>>;
async function loadRow(id: string) {
  return prisma.weeklyExam.findUnique({ where: { id }, include: { questions: true } });
}

function toAdmin(row: NonNullable<Row>): AdminExam {
  const questions: AdminExamQuestion[] = row.questions
    .map((q) => ({
      id: q.id,
      section: q.section as SectionId,
      kind: q.kind as QuestionKind,
      position: q.position,
      question: q.question,
      options: parse<string[]>(q.options, []),
      answer: q.answer,
      explanation: q.explanation || "",
      marks: q.marks,
      imagePath: q.imagePath,
      sourceNote: parse<SourceNote | null>(q.sourceNote, null),
    }))
    .sort((a, b) => ORDER[a.section] - ORDER[b.section] || a.position - b.position);
  const passages = parse<Partial<Record<SectionId, string>>>(row.passages, {});
  return {
    id: row.id,
    day: row.day,
    title: row.title,
    status: row.status,
    phase: examPhase(row.status, row.day),
    passages,
    questions,
    problems: examProblems(questions, passages),
  };
}

/** Questions can only change while the exam has not opened. */
async function editable(examId: string) {
  const row = await prisma.weeklyExam.findUnique({ where: { id: examId }, select: { status: true, day: true } });
  if (!row) throw new Error("Exam not found.");
  const phase = examPhase(row.status, row.day);
  if (phase === "live" || phase === "closed") throw new Error("This exam has already opened; it can no longer be changed.");
  return row;
}

const fmtTitle = (day: string) =>
  `Weekly Exam — ${new Date(day + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`;

// ---------------------------------------------------------------------------

export async function listExamsAction() {
  await requireAdmin();
  const rows = await prisma.weeklyExam.findMany({ orderBy: { day: "desc" }, take: 30, include: { questions: true } });
  return {
    nextFriday: nextExamFriday(),
    exams: rows.map((r) => {
      const a = toAdmin(r);
      return { id: a.id, day: a.day, title: a.title, phase: a.phase, questionCount: a.questions.length, ready: a.problems.length === 0 };
    }),
  };
}

export async function createExamAction(day: string) {
  await requireAdmin();
  if (!isFriday(day)) return { ok: false as const, message: "The exam day must be a Friday." };
  const existing = await prisma.weeklyExam.findUnique({ where: { day } });
  if (existing) return { ok: true as const, id: existing.id };
  const row = await prisma.weeklyExam.create({ data: { day, title: fmtTitle(day) } });
  return { ok: true as const, id: row.id };
}

export async function getExamAction(id: string): Promise<AdminExam | null> {
  await requireAdmin();
  const row = await loadRow(id);
  return row ? toAdmin(row) : null;
}

/** Material to build questions from: the last 7 days of key notes (both modes) and English stories for passages. */
export async function getExamSourcesAction(): Promise<{ bn: KeyNoteDay[]; en: KeyNoteDay[]; stories: EnglishStory[] }> {
  await requireAdmin();
  const [bn, en] = await Promise.all([getKeyNotes("bn"), getKeyNotes("en")]);
  const since = new Date(Date.now() - 8 * 86400_000);
  const rows = await prisma.article.findMany({
    where: { createdAt: { gte: since }, sourceUrl: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { slug: true, title: true, summary: true, keyTakeaways: true, createdAt: true },
  });
  const stories = rows
    .filter((r) => !/[ঀ-৿]/.test(r.title))
    .slice(0, 80)
    .map((r) => {
      const points = parse<string[]>(r.keyTakeaways as unknown as string, []);
      const text = [r.summary, ...(Array.isArray(points) ? points : [])].filter(Boolean).join("\n\n");
      return { slug: r.slug, title: r.title, day: r.createdAt.toISOString().slice(0, 10), text };
    });
  return { bn, en, stories };
}

export async function saveExamMetaAction(id: string, data: { title?: string; passages?: Partial<Record<SectionId, string>> }) {
  await requireAdmin();
  await editable(id);
  const passages = data.passages
    ? JSON.stringify(
        Object.fromEntries(
          Object.entries(data.passages)
            .filter(([k]) => sectionById(k)?.passage !== "none")
            .map(([k, v]) => [k, String(v || "").slice(0, 12000)])
        )
      )
    : undefined;
  await prisma.weeklyExam.update({
    where: { id },
    data: { ...(data.title !== undefined ? { title: data.title.trim().slice(0, 200) || "Weekly Exam" } : {}), ...(passages ? { passages } : {}) },
  });
  return { ok: true as const };
}

export interface QuestionInput {
  id?: string;
  section: SectionId;
  kind: QuestionKind;
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  imagePath?: string | null;
  sourceNote?: SourceNote | null;
}

export async function saveQuestionAction(examId: string, input: QuestionInput) {
  await requireAdmin();
  await editable(examId);
  const sec = sectionById(input.section);
  if (!sec) return { ok: false as const, message: "Unknown section." };

  const q = {
    section: sec.id,
    kind: sec.writing ? "writing" : input.kind,
    question: (input.question || "").trim().slice(0, 4000),
    options: input.kind === "mcq" ? (input.options || []).slice(0, 4).map((o) => String(o).trim().slice(0, 500)) : [],
    answer: sec.writing ? "" : String(input.answer ?? "").trim().slice(0, 200),
    marks: sec.writing ? sec.marks : 1,
    imagePath: sec.image ? input.imagePath || null : null,
  };
  const problems = questionProblems(q);
  if (problems.length) return { ok: false as const, message: problems.join(" ") };

  const siblings = await prisma.examQuestion.findMany({ where: { examId, section: sec.id }, select: { id: true, marks: true, position: true } });
  const others = siblings.filter((s) => s.id !== input.id);
  if (sec.writing && others.length) return { ok: false as const, message: `${sec.label} has one task only; edit the existing one.` };
  if (others.reduce((s, x) => s + x.marks, 0) + q.marks > sec.marks) return { ok: false as const, message: `${sec.label} is already full (${sec.marks} marks).` };

  const data = {
    ...q,
    options: JSON.stringify(q.options),
    explanation: (input.explanation || "").trim().slice(0, 2000) || null,
    sourceNote: input.sourceNote ? JSON.stringify(input.sourceNote) : null,
  };
  if (input.id) {
    const owned = siblings.some((s) => s.id === input.id) || (await prisma.examQuestion.count({ where: { id: input.id, examId } })) > 0;
    if (!owned) return { ok: false as const, message: "Question not found." };
    await prisma.examQuestion.update({ where: { id: input.id }, data });
  } else {
    const position = others.reduce((m, s) => Math.max(m, s.position), -1) + 1;
    await prisma.examQuestion.create({ data: { ...data, examId, position } });
  }
  return { ok: true as const };
}

export async function deleteQuestionAction(examId: string, questionId: string) {
  await requireAdmin();
  await editable(examId);
  await prisma.examQuestion.deleteMany({ where: { id: questionId, examId } });
  return { ok: true as const };
}

/** Move a question up or down within its section. */
export async function moveQuestionAction(examId: string, questionId: string, dir: -1 | 1) {
  await requireAdmin();
  await editable(examId);
  const q = await prisma.examQuestion.findFirst({ where: { id: questionId, examId } });
  if (!q) return { ok: false as const };
  const list = await prisma.examQuestion.findMany({ where: { examId, section: q.section }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  const i = list.findIndex((x) => x.id === q.id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return { ok: true as const };
  [list[i], list[j]] = [list[j], list[i]];
  await prisma.$transaction(list.map((x, pos) => prisma.examQuestion.update({ where: { id: x.id }, data: { position: pos } })));
  return { ok: true as const };
}

/** Schedule (only when complete) or move back to draft (only before it opens). */
export async function setExamScheduledAction(id: string, scheduled: boolean) {
  await requireAdmin();
  await editable(id);
  const row = await loadRow(id);
  if (!row) return { ok: false as const, message: "Exam not found." };
  if (scheduled) {
    const problems = toAdmin(row).problems;
    if (problems.length) return { ok: false as const, message: problems[0] };
  }
  await prisma.weeklyExam.update({ where: { id }, data: { status: scheduled ? "scheduled" : "draft" } });
  return { ok: true as const };
}

export async function deleteExamAction(id: string) {
  await requireAdmin();
  await editable(id);
  await prisma.weeklyExam.delete({ where: { id } });
  return { ok: true as const };
}
