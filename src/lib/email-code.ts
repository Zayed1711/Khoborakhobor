import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * One-time email codes (6 digits). Stored only as a hash; valid for 10 minutes and 5
 * tries; a new code replaces older unused ones for the same email and purpose.
 */
export const CODE_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
export type CodePurpose = "verify" | "reset";

export const hashCode = (email: string, code: string) => crypto.createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");

export function newCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Create a code for this email and purpose (older unused ones stop working). Returns the code to send. */
export async function issueCode(email: string, purpose: CodePurpose): Promise<string> {
  const code = newCode();
  await prisma.emailCode.updateMany({ where: { email, purpose, used: false }, data: { used: true } });
  await prisma.emailCode.create({
    data: { email, purpose, codeHash: hashCode(email, code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000) },
  });
  return code;
}

export type CheckResult = "ok" | "wrong" | "expired" | "too_many" | "none";

/** Check a code; a right code is used up, a wrong one counts as an attempt. */
export async function checkCode(email: string, purpose: CodePurpose, code: string): Promise<CheckResult> {
  const row = await prisma.emailCode.findFirst({ where: { email, purpose, used: false }, orderBy: { createdAt: "desc" } });
  if (!row) return "none";
  if (row.expiresAt.getTime() < Date.now()) return "expired";
  if (row.attempts >= MAX_ATTEMPTS) return "too_many";
  const given = (code || "").replace(/\D/g, "");
  const ok = given.length === 6 && crypto.timingSafeEqual(Buffer.from(row.codeHash), Buffer.from(hashCode(email, given)));
  if (!ok) {
    await prisma.emailCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return row.attempts + 1 >= MAX_ATTEMPTS ? "too_many" : "wrong";
  }
  await prisma.emailCode.update({ where: { id: row.id }, data: { used: true } });
  return "ok";
}

export const CHECK_ERRORS: Record<Exclude<CheckResult, "ok">, string> = {
  wrong: "কোডটি সঠিক নয়। আবার দেখে লিখুন।",
  expired: "কোডের মেয়াদ শেষ হয়ে গেছে। নতুন কোড পাঠান।",
  too_many: "অনেকবার ভুল কোড দেওয়া হয়েছে। নতুন কোড পাঠান।",
  none: "কোনো সক্রিয় কোড নেই। নতুন কোড পাঠান।",
};
