import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeftNavSidebar from "@/components/LeftNavSidebar";
import RightStudyRail from "@/components/RightStudyRail";
import SocialFeedStream from "@/components/SocialFeedStream";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getPublishedArticles } from "@/actions/articles";
import { getCurrentSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { getDailyFeaturedQuiz } from "@/lib/quiz/generator";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getCurrentSession();
  const articles = await getPublishedArticles();
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  const capsuleArticles = articles.filter((a) => a.isCapsule);
  const dailyQuiz = getDailyFeaturedQuiz(undefined, articles);

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans pb-16 lg:pb-0">
      {/* Header bar with Extended Search and Theme toggle */}
      <Header categories={categories} session={session} />

      {/* 3-Column Social Architecture */}
      <main className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-5 w-full flex gap-6 items-start justify-center">
        {/* Left Column: Navigation & Profile Rail */}
        <LeftNavSidebar session={session} />

        {/* Center Column: Social Media Newsfeed Stream */}
        <div className="flex-1 max-w-2xl w-full">
          <SocialFeedStream
            articles={articles}
            capsuleArticles={capsuleArticles}
            categories={categories}
            studentId={session.student?.id}
          />
        </div>

        {/* Right Column: Study Widgets, Streaks & Trends */}
        <RightStudyRail
          streakDays={session.student?.streakDays || 0}
          featuredQuiz={dailyQuiz}
        />
      </main>

      {/* Mobile Sticky Bottom Bar for 1-Thumb Social Navigation */}
      <MobileBottomNav />

      <Footer />
    </div>
  );
}
