import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeftNavSidebar from "@/components/LeftNavSidebar";
import RightStudyRail from "@/components/RightStudyRail";
import SocialFeedCard from "@/components/SocialFeedCard";
import MobileBottomNav from "@/components/MobileBottomNav";
import { prisma } from "@/lib/prisma";
import { getArticlesByCategory } from "@/actions/articles";
import { getCurrentSession } from "@/actions/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const categories = await prisma.category.findMany();
  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const session = await getCurrentSession();

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    return notFound();
  }

  const categoryArticles = await getArticlesByCategory(slug);
  const allCategories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans pb-16 lg:pb-0">
      <Header categories={allCategories} session={session} />

      <main className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-5 w-full flex gap-6 items-start justify-center">
        {/* Left Column: Nav & Profile Rail */}
        <LeftNavSidebar session={session} />

        {/* Center Column: Category Feed Stream */}
        <div className="flex-1 max-w-2xl w-full space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-[#68707f]">
            <Link href="/" className="hover:text-[#842323] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> প্রচ্ছদ
            </Link>
            <span>/</span>
            <span className="text-[#1c1d21] font-semibold">{category.name}</span>
          </div>

          {/* Category Header Card */}
          <div className="bg-white border border-[#ded8cb] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="w-2.5 h-6 bg-[#842323] inline-block rounded-xs"></span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17191d] font-serif tracking-tight">
                {category.name}
              </h1>
            </div>
            <p className="text-xs text-[#505764] leading-relaxed">
              {category.name}-সম্পর্কিত সর্বশেষ তথ্য, বিশ্লেষণ ও শিক্ষণীয় উপাদান ({categoryArticles.length}টি প্রতিবেদন)।
            </p>
          </div>

          {/* Category Articles Feed */}
          {categoryArticles.length > 0 ? (
            <div className="space-y-4">
              {categoryArticles.map((article) => (
                <SocialFeedCard
                  key={article.id}
                  article={article as any}
                  studentId={session.student?.id}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border border-[#ded8cb] p-8 shadow-2xs">
              <BookOpen className="w-10 h-10 text-[#88909d] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#1c1d21]">
                এই বিভাগে বর্তমানে কোনো নতুন প্রতিবেদন সংগৃহীত নেই
              </h3>
              <p className="text-xs text-[#68707f] mt-1 max-w-md mx-auto">
                খবরাখবর বার্তা কক্ষ থেকে খুব শীঘ্রই এই বিভাগে বস্তুনিষ্ঠ শিক্ষণীয় উপাদান সংযোজন করা হবে।
              </p>
              <div className="mt-4">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#842323] text-white text-xs font-semibold hover:bg-[#6e1c1c] transition shadow-2xs"
                >
                  প্রচ্ছদে ফিরে যান
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Widgets & Trends */}
        <RightStudyRail streakDays={session.student?.streakDays || 0} />
      </main>

      {/* Mobile Sticky Bottom Bar */}
      <MobileBottomNav />

      <Footer />
    </div>
  );
}
