"use server";

import { prisma } from "@/lib/prisma";

export async function subscribeNewsletterAction(rawEmail: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const email = rawEmail ? rawEmail.trim().toLowerCase() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      return {
        success: false,
        error: "অনুগ্রহ করে একটি সঠিক ও কার্যকর ইমেইল ঠিকানা প্রদান করুন।",
      };
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      return {
        success: true,
        message: "আপনি ইতোমধ্যে আমাদের সাপ্তাহিক সারসংক্ষেপ তালিকায় যুক্ত রয়েছেন।",
      };
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email,
        active: true,
      },
    });

    return {
      success: true,
      message: "ধন্যবাদ! সাপ্তাহিক শিক্ষণীয় সারসংক্ষেপ তালিকায় আপনি সফলভাবে যুক্ত হয়েছেন।",
    };
  } catch (err: any) {
    console.error("[NEWSLETTER] Error subscribing email:", err);
    return {
      success: false,
      error: "সারসংক্ষেপে যুক্ত করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
    };
  }
}

