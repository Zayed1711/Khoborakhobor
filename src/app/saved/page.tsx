import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import StudentHubView from "@/components/StudentHubView";
import { getActiveStudent, getStudentQuizAnalytics, getStudentActivityStatsAction } from "@/actions/student";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getMyWritingsAction } from "@/actions/writing";

export const dynamic = "force-dynamic";

export default async function SavedNotebookPage() {
  const student = await getActiveStudent();

  if (!student) {
    redirect("/login?redirect=/saved");
  }

  const [notes, savedWords, quizAnalytics, activityStats, writings] = await Promise.all([
    prisma.studyNote.findMany({
      where: { studentId: student.id },
      include: {
        article: {
          select: {
            slug: true,
            title: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedWord.findMany({
      where: { studentId: student.id },
      include: {
        term: {
          include: {
            article: {
              select: {
                slug: true,
                title: true,
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getStudentQuizAnalytics(student.id),
    getStudentActivityStatsAction(student.id),
    getMyWritingsAction(),
  ]);

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans print:bg-white pb-16 md:pb-0">
      <div className="no-print">
        <Header session={{ role: "student", student: student as any }} />
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-8 py-8 w-full print:p-0 print:max-w-none">
        <StudentHubView
          student={student}
          notes={notes}
          savedWords={savedWords}
          quizAnalytics={quizAnalytics}
          activityStats={activityStats}
          writings={writings}
        />
      </main>

      <div className="no-print">
        <MobileBottomNav />
        <Footer />
      </div>
    </div>
  );
}
