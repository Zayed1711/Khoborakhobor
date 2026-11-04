import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

/**
 * Server-only authorization helpers. Kept outside "use server" files so they are
 * never exposed as callable server actions.
 */

export type PublicStudent = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  bio: string | null;
  avatar: string | null;
  targetTrack: string;
  institution: string | null;
  streakDays: number;
  lastActive: Date;
  articlesRead: number;
  wordsLookedUp: number;
  quizzesTaken: number;
  notesSaved: number;
  createdAt: Date;
  updatedAt: Date;
};

/** Remove secret columns before a student record leaves the server. */
export function toPublicStudent<T extends { passwordHash?: unknown }>(student: T): Omit<T, "passwordHash"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = student;
  return rest;
}

/** The logged-in, non-suspended student for this request, or null. */
export async function getSessionStudent(): Promise<PublicStudent | null> {
  const session = await readSession();
  if (!session?.sid) return null;
  const student = await prisma.student.findUnique({ where: { id: session.sid } });
  if (!student || student.status === "suspended") return null;
  return toPublicStudent(student) as PublicStudent;
}

/** True when the request belongs to an administrator. */
export async function isAdminRequest(): Promise<boolean> {
  const session = await readSession();

  if (!session) {
    // Allows local test scripts (scripts/qa_master_test_suite.ts) to run admin actions.
    return process.env.NODE_ENV !== "production" && process.env.TEST_ROLE === "admin";
  }

  if (session.sid) {
    const student = await prisma.student.findUnique({
      where: { id: session.sid },
      select: { role: true, status: true },
    });
    return Boolean(student && student.role === "admin" && student.status !== "suspended");
  }

  // Passcode-only admin session (no student record)
  return session.role === "admin";
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminRequest())) {
    throw new Error("অননুমোদিত অ্যাক্সেস! শুধুমাত্র অ্যাডমিনিস্ট্রেটরদের এই অনুমতি রয়েছে।");
  }
}

/**
 * Require a logged-in student. If the caller passed a studentId, it must match the
 * session (the client-supplied id is never trusted on its own).
 */
export async function requireStudent(claimedStudentId?: string | null): Promise<PublicStudent> {
  const student = await getSessionStudent();
  if (!student) {
    throw new Error("অনুগ্রহ করে প্রথমে লগইন করুন।");
  }
  if (claimedStudentId && claimedStudentId !== student.id) {
    throw new Error("অননুমোদিত অ্যাক্সেস।");
  }
  return student;
}

/** Read access: the student themself, or an admin. */
export async function canReadStudent(studentId: string): Promise<boolean> {
  const student = await getSessionStudent();
  if (student && student.id === studentId) return true;
  return isAdminRequest();
}
