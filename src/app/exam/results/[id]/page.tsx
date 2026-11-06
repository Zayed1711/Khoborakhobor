import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ExamResultsView from "@/components/exam/ExamResultsView";
import { getExamResultsAction } from "@/actions/exam-results";
import { getCurrentSession } from "@/actions/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Weekly Exam Results | খবরাখবর" };

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [results, session] = await Promise.all([getExamResultsAction(id), getCurrentSession().catch(() => null)]);
  if (!results) return notFound();
  const loggedIn = !!(session as { student?: unknown } | null)?.student;
  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans pb-16 md:pb-0">
      <Header session={session as never} />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <ExamResultsView r={results} loggedIn={loggedIn} />
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
