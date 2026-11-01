import { notFound } from "next/navigation";
import { getArticleBySlug, getPublishedArticles } from "@/actions/articles";
import { getArticleStudyNotes, getActiveStudent } from "@/actions/student";
import ArticleReaderView from "@/components/ArticleReaderView";

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

  const allArticles = await getPublishedArticles();
  const relatedArticles = allArticles.filter((a) => a.id !== article.id).slice(0, 3);
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
