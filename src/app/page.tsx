import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeftNavSidebar from "@/components/LeftNavSidebar";
import RightStudyRail from "@/components/RightStudyRail";
import SocialFeedStream from "@/components/SocialFeedStream";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getPublishedArticles, getDateArchiveStatsAction } from "@/actions/articles";
import { getCurrentSession } from "@/actions/auth";
import { getTrendingHashtagsAction } from "@/actions/search";
import { prisma } from "@/lib/prisma";
import { pickDailyQuiz } from "@/lib/study/daily";
import { toFeedCard } from "@/lib/feed-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  let session = { role: null, student: null } as any;
  try {
    session = await getCurrentSession();
  } catch (e) {
    console.error("[HOME] Session error:", e);
  }

  let articles: any[] = [];
  try {
    articles = await getPublishedArticles();
  } catch (e) {
    console.error("[HOME] Articles error:", e);
  }

  let archiveStats: any = null;
  try {
    archiveStats = await getDateArchiveStatsAction();
  } catch (e) {
    console.error("[HOME] Archive stats error:", e);
  }

  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
    });
  } catch (e) {
    console.error("[HOME] Categories error:", e);
  }

  // The daily challenge is one of today's real (extracted) quizzes; the client otherwise
  // receives slim feed cards with no bodies, vocabulary or quiz answers.
  const dailyBnQuiz = pickDailyQuiz(articles, "bn");
  const dailyEnQuiz = pickDailyQuiz(articles, "en");
  const feedCards = articles.map(toFeedCard);
  const capsuleArticles = feedCards.filter((a) => a.isCapsule);
  const trendingHashtags = await getTrendingHashtagsAction();

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans pb-16 md:pb-0">
      {/* Header bar with Extended Search and Theme toggle */}
      <Header categories={categories} session={session} />

      {/* 3-Column Social Architecture */}
      <main className="flex-1 max-w-7xl mx-auto px-2 sm:px-3 min-[1280px]:px-6 py-5 w-full flex gap-3 min-[1280px]:gap-5 items-start justify-center">
        {/* Left Column: Navigation & Profile Rail */}
        <LeftNavSidebar session={session} />

        {/* Center Column: Social Media Newsfeed Stream */}
        <div className="flex-1 max-w-2xl min-w-0 w-full">
          <SocialFeedStream
            articles={feedCards}
            capsuleArticles={capsuleArticles}
            categories={categories}
            studentId={session.student?.id}
            streakDays={session.student?.streakDays || 0}
            featuredQuiz={dailyBnQuiz}
            featuredEnglishQuiz={dailyEnQuiz}
            archiveStats={archiveStats}
          />
        </div>

        {/* Right Column: Study Widgets, Streaks & Trends */}
        <RightStudyRail
          streakDays={session.student?.streakDays || 0}
          featuredQuiz={dailyBnQuiz}
          featuredEnglishQuiz={dailyEnQuiz}
          initialTrending={trendingHashtags}
        />
      </main>

      {/* Mobile Sticky Bottom Bar for 1-Thumb Social Navigation */}
      <MobileBottomNav />

      <Footer />
    </div>
  );
}
