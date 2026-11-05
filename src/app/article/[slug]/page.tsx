import { notFound } from "next/navigation";
import { getArticleBySlug, getPublishedArticles } from "@/actions/articles";
import { getArticleStudyNotes, getActiveStudent } from "@/actions/student";
import ArticleStudyView, { type StudyArticle } from "@/components/ArticleStudyView";
import { toFeedCard } from "@/lib/feed-card";
import { forClient } from "@/lib/study/daily-feed";
import { extractVocabularyTableRows } from "@/lib/vocabulary-table-engine";
import { isBengaliText } from "@/lib/bilingual";

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

  const [recent, student] = await Promise.all([getPublishedArticles(4), getActiveStudent()]);
  // Related-story cards carry no quizzes (the quiz is only at the end of this story)
  const relatedArticles = forClient(recent.filter((a) => a.id !== article.id).slice(0, 3).map(toFeedCard));
  const notes = student ? await getArticleStudyNotes(student.id, article.slug) : [];

  // Only what the page shows goes to the browser: no publisher body, no quiz answers
  // (MicroQuiz checks answers on the server when correctOption is absent).
  const view: StudyArticle = {
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    sourceName: article.sourceName,
    sourceUrl: article.sourceUrl,
    publishedAt: article.publishedAt,
    readTime: article.readTime,
    contentOrigin: article.contentOrigin,
    category: { name: article.category.name, slug: article.category.slug },
    keyTakeaways: Array.isArray(article.keyTakeaways) ? article.keyTakeaways : [],
    factTable: Array.isArray(article.factTable) ? article.factTable : [],
    examTags: article.examTags,
    // The quiz belongs to job/BCS preparation (Bengali stories); English-learning
    // stories have no quiz
    quizQuestions: (isBengaliText(article.title) ? article.quizQuestions : []).map((q) => ({
      id: q.id,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
    })),
    vocabulary: article.vocabulary.map((v) => ({ id: v.id, term: v.term, definition: v.definition, context: v.context })),
  };

  // English vocabulary rows come from the saved terms and the curated word bank only
  const englishVocabRows = isBengaliText(article.title)
    ? []
    : extractVocabularyTableRows(article.title, "", article.vocabulary).map((row, i) => ({ ...row, id: `vocab-${i}` }));

  return (
    <ArticleStudyView
      article={view}
      relatedArticles={relatedArticles}
      initialNotes={notes as never}
      student={student as never}
      englishVocabRows={englishVocabRows}
    />
  );
}
