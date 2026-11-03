"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "@/lib/auth-crypto";

const ADMIN_SECRET_PASSCODE = process.env.ADMIN_PASSCODE || "072429";

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

  const sessionRole: SessionRole = student.role === "admin" ? "admin" : "student";

  try {
    const cookieStore = await cookies();
    cookieStore.set("khobor_session_role", sessionRole, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    cookieStore.set("khobor_student_id", student.id, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });

    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath("/desk");
    revalidatePath("/admin");
  } catch {
    // Graceful fallback when executed in test runner / background script
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

  const sessionRole: SessionRole = student.role === "admin" ? "admin" : "student";

  try {
    const cookieStore = await cookies();
    cookieStore.set("khobor_session_role", sessionRole, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    cookieStore.set("khobor_student_id", student.id, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });

    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath("/desk");
    revalidatePath("/admin");
  } catch {
    // Graceful fallback when executed in test runner / background script
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

/**
 * Log in as System Administrator with strictly confidential passcode
 */
export async function adminLoginAction(passcode: string) {
  if (passcode.trim() !== ADMIN_SECRET_PASSCODE) {
    return {
      success: false,
      error: "ভুল পাসকোড! সঠিক অ্যাডমিন সিক্রেট পাসকোড প্রদান করুন।",
    };
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set("khobor_session_role", "admin", {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });

    revalidatePath("/");
    revalidatePath("/admin");
  } catch {
    // Graceful fallback for test runner
  }

  return { success: true };
}

/**
 * End current session
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("khobor_session_role");
    cookieStore.delete("khobor_student_id");

    revalidatePath("/");
    revalidatePath("/saved");
    revalidatePath("/admin");
  } catch {
    // Graceful fallback for test runner
  }

  return { success: true };
}

/**
 * Get current session state (server-side)
 */
export async function getCurrentSession(): Promise<UserSession> {
  try {
    const cookieStore = await cookies();
    const roleCookie = cookieStore.get("khobor_session_role")?.value as SessionRole;
    const studentId = cookieStore.get("khobor_student_id")?.value;

    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (student) {
        // Effective role: if student.role is admin in database or roleCookie is admin
        const effectiveRole: SessionRole =
          student.role === "admin" || roleCookie === "admin" ? "admin" : "student";

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
    }

    if (roleCookie === "admin" || (!roleCookie && process.env.TEST_ROLE === "admin")) {
      return {
        role: "admin",
        student: null,
      };
    }
  } catch {
    // If called in testing script without request context
    if (process.env.TEST_ROLE === "admin") {
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
  try {
    const targetEmail = (email || "student.founding@gmail.com").trim().toLowerCase();
    const targetName = name || "ফাউন্ডিং প্রো লার্নার";

    let student = await prisma.student.findUnique({
      where: { email: targetEmail },
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          name: targetName,
          email: targetEmail,
          passwordHash: hashPassword("khobor_pro_trial_2026"),
          role: "student",
          status: "active",
          targetTrack: "BCS_GOVT",
          streakDays: 1,
          lastActive: new Date(),
        },
      });
    } else {
      await prisma.student.update({
        where: { id: student.id },
        data: { lastActive: new Date() },
      });
    }

    const sessionRole: SessionRole = student.role === "admin" ? "admin" : "student";

    try {
      const cookieStore = await cookies();
      cookieStore.set("khobor_session_role", sessionRole, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
      });
      cookieStore.set("khobor_student_id", student.id, {
        path: "/",
        sameSite: "lax",
        httpOnly: true,
      });
      revalidatePath("/");
      revalidatePath("/saved");
      revalidatePath("/desk");
    } catch {
      // Graceful fallback for CLI/script runs
    }

    return {
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Google সাইন ইন ব্যর্থ হয়েছে।",
    };
  }
}

