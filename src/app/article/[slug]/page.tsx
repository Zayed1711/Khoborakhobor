import type { Metadata } from "next";
import StoryLoginWall from "@/components/StoryLoginWall";
import { viewerCanReadStories } from "@/lib/story-access";
import { notFound } from "next/navigation";
import { getArticleBySlug, getPublishedArticles } from "@/actions/articles";
import { getArticleStudyNotes, getActiveStudent } from "@/actions/student";
import ArticleStudyView, { type StudyArticle } from "@/components/ArticleStudyView";
import { toFeedCard } from "@/lib/feed-card";
import { forClient } from "@/lib/study/daily-feed";
import { ensureStoryVocabulary } from "@/lib/study/story-vocab-store";
import { isBengaliText } from "@/lib/bilingual";
import { ensurePractice } from "@/lib/study/ielts-store";
import { extractPassage, passageFromJson, passageFromParagraphs } from "@/lib/study/passage";
import { englishTopic } from "@/lib/study/topics";
import { writingTaskFor } from "@/lib/study/writing-prompts";
import { getMyWritingsAction } from "@/actions/writing";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

// Search engines and link previews (Facebook, WhatsApp) get the headline and the
// publisher's one-line summary, even though reading the story needs an account.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticleBySlug(slug);
  if (!a) return {};
  const description = (a.summary || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const image = /^https?:\/\//.test(a.featuredImage || "") ? [a.featuredImage] : undefined;
  return {
    title: `${a.title} | খবরাখবর`,
    description,
    alternates: { canonical: `/article/${a.slug}` },
    openGraph: { title: a.title, description, type: "article", images: image, siteName: "খবরাখবর" },
    twitter: { card: image ? "summary_large_image" : "summary", title: a.title, description, images: image },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return notFound();
  }

  // Login wall: visitors see only the headline and a way to log in
  if (!(await viewerCanReadStories())) {
    return (
      <StoryLoginWall
        slug={article.slug}
        title={article.title}
        sourceName={article.sourceName}
        publishedAt={article.publishedAt}
        category={{ name: article.category.name, slug: article.category.slug }}
        english={!isBengaliText(article.title)}
      />
    );
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
    aiSummary: article.aiSummary,
    factCard: article.factCard,
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
    // Job-mode terms only (story vocabulary rows for English stories are shown in their own table)
    vocabulary: article.vocabulary
      .filter((v) => !v.definition.startsWith('{"v":"story-vocab'))
      .map((v) => ({ id: v.id, term: v.term, definition: v.definition, context: v.context })),
  };

  // English Learning stories: the reading passage (a part of the original article, 80–150
  // words) and IELTS practice built only from it. When the article text is missing, the
  // summary and key points stand in. Only the passage is sent to the browser, not the article.
  const isEnglishStory = !isBengaliText(article.title);
  const keyPoints = Array.isArray(article.keyTakeaways) ? (article.keyTakeaways as string[]) : [];
  // 1. the excerpt saved when the story was crawled, 2. the article text (older stories),
  // 3. the summary and key points, cleaned the same way
  let passage: string[][] = [];
  if (isEnglishStory) {
    passage = passageFromJson(article.passage);
    if (!passage.length) passage = extractPassage(article.content || "");
    if (!passage.length) passage = passageFromParagraphs([article.summary, ...keyPoints], 20);
  }
  const practice = isEnglishStory ? await ensurePractice(article.id, passage.flat(), article.title).catch(() => []) : [];
  // English vocabulary: five less common words from this story's passage, with the sentence they are used in
  const englishVocabRows = isEnglishStory ? await ensureStoryVocabulary(article.id, passage.flat(), article.title).catch(() => []) : [];
  // English Learning stories: a short IELTS Task 2 style writing task, reviewed by hand
  // The task follows the story's core theme (football → popularity of football), found from its own words
  const task = isEnglishStory
    ? writingTaskFor(
        { id: article.id, title: article.title, summary: article.summary, keyTakeaways: Array.isArray(article.keyTakeaways) ? article.keyTakeaways : [] },
        englishTopic(article.title, article.summary)
      )
    : null;
  const writing = task
    ? { topic: task.theme, prompt: task.prompt, previous: student ? await getMyWritingsAction(article.slug).catch(() => []) : [] }
    : null;

  return (
    <ArticleStudyView
      practice={practice}
      passage={passage}
      writing={writing}
      article={view}
      relatedArticles={relatedArticles}
      initialNotes={notes as never}
      student={student as never}
      englishVocabRows={englishVocabRows}
    />
  );
}
