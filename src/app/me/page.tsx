import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import MeView from "@/components/MeView";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/actions/auth";
import { getTodayProgressAction } from "@/actions/progress";
import { badgesFor } from "@/lib/study/badges";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "আমি | খবরাখবর", robots: { index: false } };

// "Me": level, badges, reminder settings and the app install button.
export default async function MePage() {
  const session = await getCurrentSession();
  const student = session.student;
  if (!student) redirect("/login?redirect=/me");

  const [today, me, goalDays, words] = await Promise.all([
    getTodayProgressAction(),
    prisma.student.findUnique({ where: { id: student.id }, select: { articlesRead: true, quizzesTaken: true, streakDays: true } }),
    prisma.dailyProgress.count({ where: { studentId: student.id, goalDone: true } }),
    prisma.savedWord.count({ where: { studentId: student.id } }),
  ]);
  const stats = {
    streak: today.loggedIn ? today.streak : me?.streakDays ?? 0,
    goalDays,
    stories: me?.articlesRead ?? 0,
    mcqs: me?.quizzesTaken ?? 0,
    words,
    level: today.level.level,
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans pb-16 md:pb-0">
      <Header session={session} />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <MeView
          name={student.name}
          email={student.email}
          targetTrack={student.targetTrack}
          today={today}
          stats={stats}
          badges={badgesFor(stats)}
        />
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
