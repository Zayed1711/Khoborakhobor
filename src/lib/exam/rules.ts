/**
 * The weekly exam's fixed shape and rules (written by the admin every Thursday,
 * held on Friday 7 am – 12 pm Bangladesh time).
 *
 *   GK 10 · English Grammar 10 · English 1st paper 10 · IELTS Reading 10   (objective, 1 mark each)
 *   Argumentative writing 5 · IELTS bar chart description 5                 (marked by hand)
 */

export type SectionId = "gk" | "grammar" | "english1" | "ielts" | "writing" | "chart";
export type QuestionKind = "mcq" | "tfng" | "blank" | "writing";

export interface SectionDef {
  id: SectionId;
  label: string;
  marks: number;
  kinds: QuestionKind[];
  /** A reading passage shown above the questions */
  passage: "none" | "optional" | "required";
  /** Writing sections hold exactly one task worth all the marks */
  writing?: boolean;
  /** The task needs an uploaded image */
  image?: boolean;
}

export const SECTIONS: SectionDef[] = [
  { id: "gk", label: "General Knowledge", marks: 10, kinds: ["mcq"], passage: "none" },
  { id: "grammar", label: "English Grammar", marks: 10, kinds: ["mcq", "blank"], passage: "none" },
  { id: "english1", label: "English 1st Paper", marks: 10, kinds: ["mcq", "blank"], passage: "optional" },
  { id: "ielts", label: "IELTS Reading", marks: 10, kinds: ["mcq", "tfng", "blank"], passage: "required" },
  { id: "writing", label: "Argumentative Writing", marks: 5, kinds: ["writing"], passage: "none", writing: true },
  { id: "chart", label: "IELTS Bar Chart Description", marks: 5, kinds: ["writing"], passage: "none", writing: true, image: true },
];

export const TOTAL_MARKS = SECTIONS.reduce((s, x) => s + x.marks, 0); // 50
export const EXAM_MINUTES = 40;
export const NEGATIVE_MARK = 0.5;
export const OPEN_HOUR = 7; // 7 am, Dhaka
export const CLOSE_HOUR = 12; // 12 pm, Dhaka
export const TFNG = ["TRUE", "FALSE", "NOT GIVEN"] as const;

export const sectionById = (id: string) => SECTIONS.find((s) => s.id === id);

/** Dhaka is UTC+6 all year (no daylight saving). */
const DHAKA_OFFSET_H = 6;

/** The exam window for a day (YYYY-MM-DD, Dhaka): 7:00 to 12:00 local time. */
export function examWindow(day: string): { opensAt: Date; closesAt: Date } {
  const [y, m, d] = day.split("-").map(Number);
  return {
    opensAt: new Date(Date.UTC(y, m - 1, d, OPEN_HOUR - DHAKA_OFFSET_H, 0, 0)),
    closesAt: new Date(Date.UTC(y, m - 1, d, CLOSE_HOUR - DHAKA_OFFSET_H, 0, 0)),
  };
}

/** Today's date in Dhaka, YYYY-MM-DD. */
export function dhakaToday(now: number = Date.now()): string {
  return new Date(now + DHAKA_OFFSET_H * 3600_000).toISOString().slice(0, 10);
}

/** The next Friday (Dhaka) whose exam has not opened yet. */
export function nextExamFriday(now: number = Date.now()): string {
  const today = dhakaToday(now);
  const base = new Date(today + "T00:00:00Z");
  for (let i = 0; i < 8; i++) {
    const d = new Date(base.getTime() + i * 86400_000);
    const day = d.toISOString().slice(0, 10);
    if (d.getUTCDay() === 5 && examWindow(day).opensAt.getTime() > now) return day;
  }
  return today; // unreachable
}

export const isFriday = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && new Date(day + "T00:00:00Z").getUTCDay() === 5;

export type ExamPhase = "draft" | "scheduled" | "live" | "closed";

/** Draft until scheduled; then live during the window and closed after it. */
export function examPhase(status: string, day: string, now: number = Date.now()): ExamPhase {
  if (status !== "scheduled") return "draft";
  const { opensAt, closesAt } = examWindow(day);
  if (now < opensAt.getTime()) return "scheduled";
  if (now < closesAt.getTime()) return "live";
  return "closed";
}

export interface QuestionLike {
  section: string;
  kind: string;
  question: string;
  options: string[];
  answer: string;
  marks: number;
  imagePath?: string | null;
}

/** Marks filled per section. */
export function sectionMarks(questions: QuestionLike[]): Record<SectionId, number> {
  const out = Object.fromEntries(SECTIONS.map((s) => [s.id, 0])) as Record<SectionId, number>;
  for (const q of questions) if (q.section in out) out[q.section as SectionId] += q.marks;
  return out;
}

/** Problems with one question, in plain words (empty when it is fine). */
export function questionProblems(q: QuestionLike): string[] {
  const sec = sectionById(q.section);
  const p: string[] = [];
  if (!sec) return ["Unknown section."];
  if (!sec.kinds.includes(q.kind as QuestionKind)) p.push(`${sec.label} cannot have this question type.`);
  if (!q.question.trim()) p.push("The question is empty.");
  if (q.kind === "mcq") {
    if (q.options.length !== 4 || q.options.some((o) => !o.trim())) p.push("Give all 4 options.");
    else if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== 4) p.push("Two options are the same.");
    if (!/^[0-3]$/.test(q.answer)) p.push("Mark the correct option.");
  }
  if (q.kind === "tfng" && !TFNG.includes(q.answer as (typeof TFNG)[number])) p.push("Choose TRUE, FALSE or NOT GIVEN.");
  if (q.kind === "blank") {
    if (!q.question.includes("_____")) p.push("Put _____ where the answer goes.");
    if (!acceptedAnswers(q.answer).length) p.push("Give the accepted answer.");
  }
  if (sec.image && !q.imagePath) p.push("Upload the chart image.");
  return p;
}

/** Accepted answers for a fill-in question, stored as "word / other form". */
export function acceptedAnswers(answer: string): string[] {
  return (answer || "")
    .split(/[\/|,]/)
    .map((a) => a.trim())
    .filter(Boolean);
}

/**
 * Everything that stops an exam from being scheduled. An exam can only go out
 * complete: every section filled to exactly its marks, passages present, no bad question.
 */
export function examProblems(questions: QuestionLike[], passages: Partial<Record<SectionId, string>>): string[] {
  const p: string[] = [];
  const filled = sectionMarks(questions);
  for (const s of SECTIONS) {
    const have = filled[s.id];
    if (have !== s.marks) p.push(`${s.label}: ${have} of ${s.marks} marks filled.`);
    if (s.passage === "required" && !(passages[s.id] || "").trim()) p.push(`${s.label}: add the reading passage.`);
    if (s.writing && questions.filter((q) => q.section === s.id).length > 1) p.push(`${s.label}: only one task.`);
  }
  const seen: Record<string, number> = {};
  for (const q of questions) {
    const n = (seen[q.section] = (seen[q.section] || 0) + 1);
    for (const msg of questionProblems(q)) p.push(`${sectionById(q.section)?.label ?? q.section} Q${n}: ${msg}`);
  }
  return [...new Set(p)];
}
