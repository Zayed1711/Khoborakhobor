"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, toPublicStudent } from "@/lib/guards";
import { hashPassword } from "@/lib/auth-crypto";
import { revalidatePath } from "next/cache";

function safeRevalidateAdmin() {
  try {
    revalidatePath("/admin");
  } catch {
    // Graceful fallback for test runner / background execution
  }
}

export interface AdminUserFilters {
  search?: string;
  track?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
}

/**
 * Fetch all user accounts with filtering, search and study activity counts
 */
export async function getAdminUsersAction(filters: AdminUserFilters = {}) {
  try {
    await requireAdmin();

    const {
      search = "",
      track = "all",
      status = "all",
      role = "all",
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {};

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { institution: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    if (track && track !== "all") {
      where.targetTrack = track;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (role && role !== "all") {
      where.role = role;
    }

    const [totalUsers, users] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          bio: true,
          avatar: true,
          targetTrack: true,
          institution: true,
          streakDays: true,
          lastActive: true,
          createdAt: true,
          _count: {
            select: {
              notes: true,
              savedArticles: true,
              quizAttempts: true,
              wordBank: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      success: true,
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
    };
  } catch (err: any) {
    return { success: false, error: err.message, users: [], totalUsers: 0 };
  }
}

/**
 * Fetch complete details of a single user including recent activity
 */
export async function getAdminUserDetailAction(studentId: string) {
  try {
    await requireAdmin();

    const user = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        notes: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            article: { select: { title: true, slug: true } },
          },
        },
        savedArticles: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            article: { select: { title: true, slug: true } },
          },
        },
        quizAttempts: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            question: { select: { question: true } },
          },
        },
        wordBank: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            term: { select: { term: true, definition: true } },
          },
        },
        _count: {
          select: {
            notes: true,
            savedArticles: true,
            quizAttempts: true,
            wordBank: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "ব্যবহারকারী অ্যাকাউন্ট পাওয়া যায়নি।" };
    }

    return { success: true, user: toPublicStudent(user) };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update user status (active / suspended / pending)
 */
export async function updateUserStatusAction(studentId: string, status: "active" | "suspended" | "pending") {
  try {
    await requireAdmin();

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { status },
    });

    safeRevalidateAdmin();
    return {
      success: true,
      message: `অ্যাকাউন্টের স্ট্যাটাস পরিবর্তিত হয়ে "${status}" হয়েছে।`,
      user: toPublicStudent(updated),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "স্ট্যাটাস পরিবর্তন করা যায়নি।" };
  }
}

/**
 * Update user role (student / admin / moderator)
 */
export async function updateUserRoleAction(studentId: string, role: "student" | "admin" | "moderator") {
  try {
    await requireAdmin();

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { role },
    });

    safeRevalidateAdmin();
    return {
      success: true,
      message: `ব্যবহারকারীর রোল "${role}" হিসেবে হালনাগাদ করা হয়েছে।`,
      user: toPublicStudent(updated),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "রোল পরিবর্তন করা যায়নি।" };
  }
}

/**
 * Update user profile details from admin console
 */
export async function updateUserDetailsAction(
  studentId: string,
  data: {
    name: string;
    phone?: string;
    institution?: string;
    targetTrack?: string;
    bio?: string;
    streakDays?: number;
    role?: "student" | "moderator" | "admin";
    status?: "active" | "suspended" | "pending";
    newPassword?: string;
  }
) {
  try {
    await requireAdmin();

    const updatePayload: any = {
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      institution: data.institution?.trim() || null,
      targetTrack: data.targetTrack || "BCS_GOVT",
      bio: data.bio?.trim() || null,
      streakDays: data.streakDays !== undefined ? Number(data.streakDays) : undefined,
    };

    if (data.role) {
      updatePayload.role = data.role;
    }
    if (data.status) {
      updatePayload.status = data.status;
    }
    if (data.newPassword && data.newPassword.trim().length >= 6) {
      updatePayload.passwordHash = hashPassword(data.newPassword.trim());
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: updatePayload,
    });

    safeRevalidateAdmin();
    return {
      success: true,
      message: "ব্যবহারকারীর তথ্য সফলভাবে হালনাগাদ করা হয়েছে।",
      user: toPublicStudent(updated),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "তথ্য হালনাগাদ ব্যর্থ হয়েছে।" };
  }
}

/**
 * Create a new user account directly from Admin Panel
 */
export async function adminCreateUserAction(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  institution?: string;
  targetTrack?: string;
  role?: string;
  status?: string;
  bio?: string;
}) {
  try {
    await requireAdmin();

    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();

    if (!name || name.length < 2) {
      return { success: false, error: "অনুগ্রহ করে সঠিক নাম লিখুন।" };
    }

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

    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।" };
    }

    const passwordHash = hashPassword(password);

    const newUser = await prisma.student.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: true, // created by the admin, who vouches for the address
        phone: data.phone?.trim() || null,
        institution: data.institution?.trim() || null,
        targetTrack: data.targetTrack || "BCS_GOVT",
        role: data.role || "student",
        status: data.status || "active",
        bio: data.bio?.trim() || null,
        streakDays: 1,
        lastActive: new Date(),
      },
    });

    safeRevalidateAdmin();
    return {
      success: true,
      message: `"${newUser.name}"-এর নতুন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।`,
      user: toPublicStudent(newUser),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "নতুন ব্যবহারকারী তৈরি করা সম্ভব হয়নি।" };
  }
}

/**
 * Safely delete a user account and all cascaded study relations
 */
export async function adminDeleteUserAction(studentId: string) {
  try {
    await requireAdmin();

    // Cascaded cleanup of user-specific study records
    await prisma.quizAttempt.deleteMany({ where: { studentId } });
    await prisma.savedWord.deleteMany({ where: { studentId } });
    await prisma.studyNote.deleteMany({ where: { studentId } });
    await prisma.savedArticle.deleteMany({ where: { studentId } });

    await prisma.student.delete({
      where: { id: studentId },
    });

    safeRevalidateAdmin();
    return { success: true, message: "ব্যবহারকারী অ্যাকাউন্ট এবং সংশ্লিষ্ট ডেটা সফলভাবে অপসারিত হয়েছে।" };
  } catch (err: any) {
    return { success: false, error: err.message || "ব্যবহারকারী মুছে ফেলা সম্ভব হয়নি।" };
  }
}

/**
 * Get aggregate user statistics for admin intelligence overview
 */
export async function getAdminUserStatsAction() {
  try {
    await requireAdmin();

    const [total, active, suspended, bcsCount, admissionCount, researchCount] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: "active" } }),
      prisma.student.count({ where: { status: "suspended" } }),
      prisma.student.count({ where: { targetTrack: "BCS_GOVT" } }),
      prisma.student.count({ where: { targetTrack: "ADMISSION" } }),
      prisma.student.count({ where: { targetTrack: "RESEARCH" } }),
    ]);

    return {
      success: true,
      stats: {
        total,
        active,
        suspended,
        byTrack: {
          bcs: bcsCount,
          admission: admissionCount,
          research: researchCount,
          general: total - (bcsCount + admissionCount + researchCount),
        },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
