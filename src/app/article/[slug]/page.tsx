import { notFound } from "next/navigation";
import { getArticleBySlug, getPublishedArticles } from "@/actions/articles";
import { getArticleStudyNotes, getActiveStudent } from "@/actions/student";
import ArticleReaderView from "@/components/ArticleReaderView";
import { toFeedCard } from "@/lib/feed-card";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return notFound();
  }

  const recent = await getPublishedArticles(4);
  const relatedArticles = recent.filter((a) => a.id !== article.id).slice(0, 3).map(toFeedCard);
  const student = await getActiveStudent();
  const notes = student ? await getArticleStudyNotes(student.id, article.slug) : [];

  return (
    <ArticleReaderView
      article={article as any}
      relatedArticles={relatedArticles as any}
      initialNotes={notes as any}
      student={student as any}
    />
  );
}
