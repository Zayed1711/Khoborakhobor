import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ExamHub from "@/components/exam/ExamHub";
import { getExamSummaryAction } from "@/actions/exam";
import { getCurrentSession } from "@/actions/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Weekly Exam | খবরাখবর" };

export default async function ExamPage() {
  const [summary, session] = await Promise.all([getExamSummaryAction().catch(() => null), getCurrentSession().catch(() => null)]);
  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans pb-16 md:pb-0">
      <Header session={session as never} />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <ExamHub initial={summary} />
      </main>
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
