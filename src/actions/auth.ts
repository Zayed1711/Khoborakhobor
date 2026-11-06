"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "@/lib/auth-crypto";
import { readSession, writeSession, clearSession, safeEqual, rateLimit, clientKey } from "@/lib/session";
import crypto from "crypto";
import { codeEmail, isEmailReady, sendEmail } from "@/lib/email";
import { CHECK_ERRORS, checkCode, issueCode, type CodePurpose } from "@/lib/email-code";

const SESSION_DISABLED_ERROR =
  "লগইন সেবা সাময়িকভাবে বন্ধ রয়েছে (সার্ভার কনফিগারেশন অসম্পূর্ণ)। অনুগ্রহ করে পরে আবার চেষ্টা করুন।";
const RATE_LIMIT_ERROR = "অনেকবার চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।";

function revalidateSessionPaths() {
  try {
    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath("/desk");
    revalidatePath("/admin");
  } catch {
    // Outside a Next.js request (test runner / background script)
  }
}

/**
 * Issue a signed session cookie for a student. Returns false only when sessions are
 * disabled because SESSION_SECRET is missing in production.
 */
async function startStudentSession(studentId: string, dbRole: string): Promise<boolean> {
  try {
    const ok = await writeSession(studentId, dbRole === "admin" ? "admin" : "student");
    if (!ok) return false;
  } catch {
    // cookies() is unavailable outside a request (test runner / background script)
  }
  revalidateSessionPaths();
  return true;
}

export type SessionRole = "student" | "admin" | null;

export interface UserSession {
  role: SessionRole;
  student: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    status?: string | null;
    userRole?: string | null;
    targetTrack: string;
    institution?: string | null;
    streakDays: number;
    avatar?: string | null;
  } | null;
}

/**
 * Sign up as a new student
 */
export async function studentSignupAction(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  targetTrack?: string;
  institution?: string;
}) {
  const name = data.name ? data.name.trim() : "";
  const email = data.email ? data.email.trim().toLowerCase() : "";
  const password = data.password ? data.password.trim() : "";
  const phone = data.phone ? data.phone.trim() : null;
  const targetTrack = data.targetTrack || "BCS_GOVT";
  const institution = data.institution ? data.institution.trim() : null;

  if (!name || name.length < 2) {
    return { success: false, error: "অনুগ্রহ করে আপনার সঠিক পূর্ণ নাম লিখুন।" };
  }

  // Strict User Credential Standard: Email MUST be @gmail.com
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  if (!email || !gmailRegex.test(email)) {
    return {
      success: false,
      error: "নিবন্ধন করার জন্য অবশ্যই একটি বৈধ @gmail.com ইমেইল ঠিকানা ব্যবহার করতে হবে।",
    };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।" };
  }

  // Check if student email already registered
  const existing = await prisma.student.findUnique({
    where: { email },
  });

  if (existing) {
    return {
      success: false,
      error: "এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে। অনুগ্রহ করে লগইন করুন।",
    };
  }

  const passwordHash = hashPassword(password);

  const student = await prisma.student.create({
    data: {
      name,
      email,
      passwordHash,
      phone,
      role: "student",
      status: "active",
      targetTrack,
      institution,
      streakDays: 1,
      lastActive: new Date(),
    },
  });

  // The account starts once the email is proven with a code (when email sending is set up)
  if (isEmailReady()) {
    const sent = await sendCode(email, "verify");
    return { success: false as const, needsVerification: true as const, email, error: sent ? "" : EMAIL_SEND_ERROR };
  }

  const sessionStarted = await startStudentSession(student.id, student.role);
  if (!sessionStarted) {
    return { success: false as const, error: SESSION_DISABLED_ERROR };
  }

  return {
    success: true,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      targetTrack: student.targetTrack,
      institution: student.institution,
      streakDays: student.streakDays,
      avatar: student.avatar,
    },
  };
}

/**
 * Log in as a student with email and password
 */
export async function studentLoginAction(emailOrInput: string, passwordInput?: string) {
  // Support both object or 2 params
  const email = emailOrInput.trim().toLowerCase();
  const password = passwordInput ? passwordInput.trim() : "";

  if (!email) {
    return { success: false, error: "ইমেইল প্রদান আবশ্যক।" };
  }

  if (!password) {
    return { success: false, error: "পাসওয়ার্ড প্রদান আবশ্যক।" };
  }

  const ip = await clientKey();
  if (!rateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000) || !rateLimit(`login:email:${email}`, 10, 15 * 60 * 1000)) {
    return { success: false, error: RATE_LIMIT_ERROR };
  }

  const student = await prisma.student.findUnique({
    where: { email },
  });

  if (!student) {
    return {
      success: false,
      error: "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সঠিক তথ্য দিন বা সাইন আপ করুন।",
    };
  }

  // Check if account is suspended by admin
  if (student.status === "suspended") {
    return {
      success: false,
      error: "আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Suspended) রয়েছে। অনুগ্রহ করে প্রশাসনের সাথে যোগাযোগ করুন।",
    };
  }

  const isPasswordValid = verifyPassword(password, student.passwordHash);
  if (!isPasswordValid) {
    return {
      success: false,
      error: "ভুল পাসওয়ার্ড! অনুগ্রহ করে পুনরায় যাচাই করে লিখুন।",
    };
  }

  if (!student.emailVerified && isEmailReady()) {
    const sent = await sendCode(email, "verify");
    return { success: false as const, needsVerification: true as const, email, error: sent ? "" : EMAIL_SEND_ERROR };
  }

  // Update streak if active on a new day
  const now = new Date();
  const lastActive = new Date(student.lastActive);
  const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

  let newStreak = student.streakDays;
  if (diffHours >= 20 && diffHours <= 48) {
    newStreak += 1;
  }

  await prisma.student.update({
    where: { id: student.id },
    data: {
      lastActive: now,
      streakDays: newStreak,
    },
  });

  const sessionStarted = await startStudentSession(student.id, student.role);
  if (!sessionStarted) {
    return { success: false as const, error: SESSION_DISABLED_ERROR };
  }

  return {
    success: true,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      userRole: student.role,
      targetTrack: student.targetTrack,
      institution: student.institution,
      streakDays: newStreak,
      avatar: student.avatar,
    },
  };
}

// ---------------------------------------------------------------------------
// Email codes: verification at sign-up and "forgot password"
// ---------------------------------------------------------------------------

const EMAIL_SEND_ERROR = "কোড পাঠানো যায়নি। এক মিনিট পর \"আবার কোড পাঠান\" চাপুন।";
const GENERIC_SENT = "এই ইমেইলে অ্যাকাউন্ট থাকলে একটি ৬ সংখ্যার কোড পাঠানো হয়েছে। ইনবক্স (ও স্প্যাম ফোল্ডার) দেখুন।";

/** Issue and email a code. Rate-limited per email (1 a minute, 5 an hour) and per IP. Not a server action. */
async function sendCode(email: string, purpose: CodePurpose): Promise<boolean> {
  const ip = await clientKey();
  if (!rateLimit(`code:min:${email}`, 1, 60_000) || !rateLimit(`code:hour:${email}`, 5, 3600_000) || !rateLimit(`code:ip:${ip}`, 20, 3600_000)) {
    return false;
  }
  const code = await issueCode(email, purpose);
  const r = await sendEmail(codeEmail(email, code, purpose));
  return r.ok;
}

/** Send a new verification code (the "send again" button). */
export async function resendVerificationCodeAction(rawEmail: string) {
  const email = (rawEmail || "").trim().toLowerCase();
  const student = email ? await prisma.student.findUnique({ where: { email }, select: { emailVerified: true } }) : null;
  if (!student || student.emailVerified) return { success: true as const, message: GENERIC_SENT };
  const sent = await sendCode(email, "verify");
  return sent
    ? { success: true as const, message: "নতুন কোড পাঠানো হয়েছে।" }
    : { success: false as const, error: "একটু পরে আবার চেষ্টা করুন (প্রতি মিনিটে একটি কোড পাঠানো যায়)।" };
}

/** Check the sign-up code; on success the account is verified and the student is logged in. */
export async function verifyEmailCodeAction(rawEmail: string, code: string) {
  const email = (rawEmail || "").trim().toLowerCase();
  const ip = await clientKey();
  if (!rateLimit(`verify:ip:${ip}`, 30, 15 * 60_000)) return { success: false as const, error: RATE_LIMIT_ERROR };
  const student = await prisma.student.findUnique({ where: { email } });
  if (!student) return { success: false as const, error: CHECK_ERRORS.none };
  if (student.status === "suspended") return { success: false as const, error: "আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত রয়েছে।" };
  const result = await checkCode(email, "verify", code);
  if (result !== "ok") return { success: false as const, error: CHECK_ERRORS[result] };
  await prisma.student.update({ where: { id: student.id }, data: { emailVerified: true, lastActive: new Date() } });
  if (!(await startStudentSession(student.id, student.role))) return { success: false as const, error: SESSION_DISABLED_ERROR };
  return { success: true as const };
}

/** "Forgot password": email a reset code. The answer is the same whether or not the account exists. */
export async function requestPasswordResetAction(rawEmail: string) {
  const email = (rawEmail || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false as const, error: "সঠিক ইমেইল ঠিকানা লিখুন।" };
  if (!isEmailReady()) {
    return { success: false as const, error: "পাসওয়ার্ড রিসেট সেবা এখনো চালু হয়নি। সাহায্যের জন্য আমাদের ফেসবুক পেজে যোগাযোগ করুন।" };
  }
  const student = await prisma.student.findUnique({ where: { email }, select: { status: true } });
  if (student && student.status !== "suspended") await sendCode(email, "reset");
  return { success: true as const, message: GENERIC_SENT };
}

/** Set a new password with the reset code; this also proves the email, and logs the student in. */
export async function resetPasswordAction(rawEmail: string, code: string, newPassword: string) {
  const email = (rawEmail || "").trim().toLowerCase();
  const password = (newPassword || "").trim();
  if (password.length < 6) return { success: false as const, error: "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।" };
  const ip = await clientKey();
  if (!rateLimit(`reset:ip:${ip}`, 30, 15 * 60_000)) return { success: false as const, error: RATE_LIMIT_ERROR };
  const student = await prisma.student.findUnique({ where: { email } });
  if (!student || student.status === "suspended") return { success: false as const, error: CHECK_ERRORS.none };
  const result = await checkCode(email, "reset", code);
  if (result !== "ok") return { success: false as const, error: CHECK_ERRORS[result] };
  await prisma.student.update({
    where: { id: student.id },
    data: { passwordHash: hashPassword(password), emailVerified: true, lastActive: new Date() },
  });
  if (!(await startStudentSession(student.id, student.role))) return { success: false as const, error: SESSION_DISABLED_ERROR };
  return { success: true as const };
}

/**
 * Log in as System Administrator with strictly confidential passcode
 */
export async function adminLoginAction(passcode: string) {
  const configured = process.env.ADMIN_PASSCODE?.trim();
  if (!configured || configured.length < 12) {
    console.error("[AUTH] ADMIN_PASSCODE is not set (or shorter than 12 characters); passcode login is disabled.");
    return {
      success: false,
      error: "অ্যাডমিন পাসকোড লগইন সার্ভারে কনফিগার করা নেই।",
    };
  }

  const ip = await clientKey();
  if (!rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)) {
    return { success: false, error: RATE_LIMIT_ERROR };
  }

  if (!safeEqual((passcode || "").trim(), configured)) {
    return {
      success: false,
      error: "ভুল পাসকোড! সঠিক অ্যাডমিন সিক্রেট পাসকোড প্রদান করুন।",
    };
  }

  try {
    const ok = await writeSession(null, "admin");
    if (!ok) return { success: false, error: SESSION_DISABLED_ERROR };
  } catch {
    // Graceful fallback for test runner
  }
  revalidateSessionPaths();

  return { success: true };
}

/**
 * End current session
 */
export async function logoutAction() {
  try {
    await clearSession();
  } catch {
    // Graceful fallback for test runner
  }
  revalidateSessionPaths();

  return { success: true };
}

/**
 * Get current session state (server-side). The role always comes from the signed
 * session plus the student's current database role, never from a plain cookie.
 */
export async function getCurrentSession(): Promise<UserSession> {
  try {
    const session = await readSession();

    if (!session) {
      if (process.env.NODE_ENV !== "production" && process.env.TEST_ROLE === "admin") {
        return { role: "admin", student: null };
      }
      return { role: null, student: null };
    }

    if (session.sid) {
      const student = await prisma.student.findUnique({
        where: { id: session.sid },
      });
      if (student && student.status !== "suspended") {
        const effectiveRole: SessionRole = student.role === "admin" ? "admin" : "student";

        return {
          role: effectiveRole,
          student: {
            id: student.id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            status: student.status,
            userRole: student.role,
            targetTrack: student.targetTrack,
            institution: student.institution,
            streakDays: student.streakDays,
            avatar: student.avatar,
          },
        };
      }
      return { role: null, student: null };
    }

    // Passcode-only admin session
    if (session.role === "admin") {
      return { role: "admin", student: null };
    }
  } catch {
    // If called in testing script without request context
    if (process.env.NODE_ENV !== "production" && process.env.TEST_ROLE === "admin") {
      return { role: "admin", student: null };
    }
  }

  return {
    role: null,
    student: null,
  };
}

/**
 * Instant 1-Click Login / Register for Google Auth & Demo Flow
 */
export async function googleInstantLoginAction(
  email?: string, 
  name?: string
): Promise<{ success: true; student: { id: string; name: string; email: string } } | { success: false; error: string }> {
  return {
    success: false,
    error: "গুগল ওয়ান-ট্যাপ সাইন-ইন সেবা দ্রুত সংহত হচ্ছে। অনুগ্রহ করে আপনার জিমেইল ও পাসওয়ার্ড দিয়ে সরাসরি লগইন বা নিবন্ধন করুন।",
  };
}

export async function requestMagicLinkAction(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return { success: false, error: "সঠিক ইমেইল ঠিকানা প্রদান করুন।" };
  }

  // SECURITY: a magic-link token must only ever be delivered to the mailbox it was
  // requested for. Returning it to the caller (as this action used to) let anyone log
  // in as any email address. No email provider is wired up yet, so the flow is
  // disabled until one is; the token is never sent back to the browser.
  if (!process.env.EMAIL_API_KEY) {
    return {
      success: false,
      error: "ইমেইল ম্যাজিক লিংক সেবা এখনো চালু হয়নি। অনুগ্রহ করে আপনার জিমেইল ও পাসওয়ার্ড দিয়ে লগইন বা নিবন্ধন করুন।",
    };
  }

  const ip = await clientKey();
  if (!rateLimit(`magic:${ip}`, 5, 15 * 60 * 1000) || !rateLimit(`magic:${cleanEmail}`, 3, 15 * 60 * 1000)) {
    return { success: false, error: RATE_LIMIT_ERROR };
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.magicLinkToken.create({
    data: {
      email: cleanEmail,
      token,
      expiresAt,
    },
  });

  // TODO: send `/login?magicToken=${token}` to cleanEmail through the email provider.

  return {
    success: true,
    magicUrl: undefined as string | undefined,
  };
}

export async function verifyMagicLinkAction(token: string) {
  if (!token) {
    return { success: false, error: "অবৈধ বা অনুপস্থিত ম্যাজিক টোকেন।" };
  }

  const record = await prisma.magicLinkToken.findUnique({
    where: { token },
  });

  if (!record || record.used || new Date() > record.expiresAt) {
    return { success: false, error: "ম্যাজিক লিংকের মেয়াদ উত্তীর্ণ হয়েছে বা লিঙ্কটি ইতিমধ্যে ব্যবহৃত হয়েছে।" };
  }

  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { used: true },
  });

  let student = await prisma.student.findUnique({
    where: { email: record.email },
  });

  if (!student) {
    student = await prisma.student.create({
      data: {
        name: record.email.split("@")[0] || "শিক্ষার্থী",
        email: record.email,
        passwordHash: hashPassword(crypto.randomBytes(16).toString("hex")),
        role: "student",
        status: "active",
        targetTrack: "BCS_GOVT",
        streakDays: 1,
        lastActive: new Date(),
      },
    });

    try {
      await prisma.studyTelemetry.create({
        data: {
          userId: student.id,
          signupDate: student.createdAt,
        },
      });
    } catch {}
  } else {
    await prisma.student.update({
      where: { id: student.id },
      data: { lastActive: new Date() },
    });
  }

  const sessionStarted = await startStudentSession(student.id, student.role);
  if (!sessionStarted) {
    return { success: false as const, error: SESSION_DISABLED_ERROR };
  }

  return {
    success: true,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
    },
  };
}

/**
 * In-App Browser & Frictionless Authentication: Phone Number OTP
 */
export async function requestPhoneOtpAction(rawPhone: string) {
  let phone = rawPhone.replace(/\s+/g, "").replace(/-/g, "");
  if (phone.startsWith("+88")) phone = phone.slice(3);
  if (phone.startsWith("88")) phone = phone.slice(2);

  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  if (!bdPhoneRegex.test(phone)) {
    return {
      success: false,
      error: "অনুগ্রহ করে একটি বৈধ ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর (যেমন: 01700000000) দিন।",
    };
  }

  if (!process.env.SMS_API_KEY) {
    return {
      success: false,
      error: "এসএমএস ওটিপি গেটওয়ে সার্ভিস সাময়িক রক্ষণাবেক্ষণে রয়েছে। অনুগ্রহ করে আপনার জিমেইল অ্যাকাউন্ট ও পাসওয়ার্ড দিয়ে নিরাপদে প্রবেশ বা নিবন্ধন করুন।",
    };
  }

  const otpCode = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.authOtp.create({
    data: { phone, otpCode, expiresAt },
  });

  return { success: true, phone };
}

export async function verifyPhoneOtpAction(rawPhone: string, otpCode: string) {
  let phone = rawPhone.replace(/\s+/g, "").replace(/-/g, "");
  if (phone.startsWith("+88")) phone = phone.slice(3);
  if (phone.startsWith("88")) phone = phone.slice(2);

  const cleanOtp = otpCode.trim();
  if (!cleanOtp || cleanOtp.length < 4) {
    return { success: false, error: "সঠিক ওটিপি কোড প্রদান করুন।" };
  }

  if (!rateLimit(`otp-verify:${phone}`, 5, 15 * 60 * 1000)) {
    return { success: false, error: RATE_LIMIT_ERROR };
  }

  // Find latest valid OTP
  const otpRecord = await prisma.authOtp.findFirst({
    where: {
      phone,
      otpCode: cleanOtp,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  // Demo bypass removed per Zayed Market-Readiness QA Handbook
  const isDemoPass = false;

  if (!otpRecord && !isDemoPass) {
    return {
      success: false,
      error: "ভুল ওটিপি কোড অথবা ওটিপির ৫ মিনিটের মেয়াদ শেষ হয়ে গেছে। পুনরায় চেষ্টা করুন।",
    };
  }

  if (otpRecord) {
    await prisma.authOtp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });
  }

  // Find existing student by phone or synthetic email
  const syntheticEmail = `${phone}@phone.kkhobor.student`;
  let student = await prisma.student.findFirst({
    where: {
      OR: [{ phone }, { email: syntheticEmail }],
    },
  });

  if (!student) {
    student = await prisma.student.create({
      data: {
        name: `লার্নার (${phone.slice(-4)})`,
        email: syntheticEmail,
        phone,
        passwordHash: hashPassword(crypto.randomBytes(16).toString("hex")),
        role: "student",
        status: "active",
        targetTrack: "BCS_GOVT",
        streakDays: 1,
        lastActive: new Date(),
      },
    });

    try {
      await prisma.studyTelemetry.create({
        data: {
          userId: student.id,
          signupDate: student.createdAt,
        },
      });
    } catch {}
  } else {
    await prisma.student.update({
      where: { id: student.id },
      data: { lastActive: new Date() },
    });
  }

  const sessionStarted = await startStudentSession(student.id, student.role);
  if (!sessionStarted) {
    return { success: false as const, error: SESSION_DISABLED_ERROR };
  }

  return {
    success: true,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
    },
  };
}

