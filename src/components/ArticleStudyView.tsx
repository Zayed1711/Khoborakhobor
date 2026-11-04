"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Quote, Share2, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import FactSheetTable from "@/components/FactSheetTable";
import MicroQuiz from "@/components/MicroQuiz";
import VocabularyTable from "@/components/VocabularyTable";
import ArticleSummaryReflection from "@/components/ArticleSummaryReflection";
import ShareStudyModal from "@/components/ShareStudyModal";
import { trackArticleReadAction } from "@/actions/student";
import { isBengaliText } from "@/lib/bilingual";
import type { FeedCard } from "@/lib/feed-card";
import type { VocabularyTableRow } from "@/lib/vocabulary-table-engine";
import type { FactTableRow, Student, StudyNote } from "@/types";

/**
 * Article page for the link-out model. We show the headline, the publisher's own
 * summary and study material quoted from the story, and send readers to the
 * publisher for the full text. Nothing here is generated: every quoted line comes
 * from the story, every quiz answer is checked on the server.
 */

export interface StudyArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  sourceName: string | null;
  sourceUrl: string | null;
  publishedAt: string;
  readTime: string;
  contentOrigin?: string | null;
  category: { name: string; slug: string };
  keyTakeaways: string[];
  factTable: FactTableRow[];
  examTags?: string | null;
  quizQuestions: { id: string; question: string; options: string[] }[];
  vocabulary: { id: string; term: string; definition: string; context?: string | null }[];
}

interface Props {
  article: StudyArticle;
  relatedArticles: FeedCard[];
  initialNotes: StudyNote[];
  student: Student | null;
  englishVocabRows: VocabularyTableRow[];
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-serif text-xl font-semibold text-[#17191d]">{title}</h2>
        {hint && <p className="text-sm text-[#68707f] mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function ArticleStudyView({ article, relatedArticles, initialNotes, student, englishVocabRows }: Props) {
  const [notes, setNotes] = useState<StudyNote[]>(initialNotes);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const isEnglish = !isBengaliText(article.title);
  const sourceLabel = article.sourceName || "মূল পত্রিকা";

  useEffect(() => {
    if (student) trackArticleReadAction(article.slug).catch(() => {});
  }, [student, article.slug]);

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col pb-16 md:pb-0">
      <Header />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
        {/* Headline and publisher summary */}
        <header className="space-y-4">
          <Link
            href={`/category/${article.category.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#68707f] hover:text-[#842323]"
          >
            <ArrowLeft className="w-4 h-4" />
            {article.category.name}
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-snug text-[#17191d] text-balance">
            {article.title}
          </h1>
          <p className="text-sm text-[#68707f]">
            {sourceLabel} · {article.publishedAt}
          </p>
          <p className="text-[17px] leading-relaxed text-[#2c323f]">{article.summary}</p>

          {/* The one main action: read the full story at the source */}
          {article.sourceUrl ? (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 w-full rounded-xl bg-[#842323] text-white px-5 py-4 hover:bg-[#6e1d1d] transition"
            >
              <span>
                <span className="block text-base font-semibold">পুরো খবরটি পড়ুন</span>
                <span className="block text-sm opacity-90">{sourceLabel}-এর ওয়েবসাইটে খুলবে</span>
              </span>
              <ExternalLink className="w-5 h-5 shrink-0" />
            </a>
          ) : (
            <p className="rounded-xl border border-[#e4ded3] bg-white px-5 py-4 text-sm text-[#525a68]">
              এই খবরের মূল লিংক পাওয়া যায়নি। নিচের তথ্যগুলো প্রতিবেদন থেকে নেওয়া।
            </p>
          )}

          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-1.5 text-[#525a68] hover:text-[#842323]"
            >
              <Share2 className="w-4 h-4" />
              শেয়ার করুন
            </button>
          </div>
        </header>

        {/* Key points, quoted */}
        {article.keyTakeaways.length > 0 && (
          <Section title="মূল কথা" hint={`${sourceLabel}-এর প্রতিবেদন থেকে হুবহু উদ্ধৃত`}>
            <ul className="space-y-3">
              {article.keyTakeaways.map((t, i) => (
                <li key={i} className="flex gap-3 rounded-xl bg-white border border-[#ece6db] p-4">
                  <Quote className="w-4 h-4 text-[#842323] shrink-0 mt-1" />
                  <span className="text-[16px] leading-relaxed text-[#2c323f]">{t}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Facts */}
        {article.factTable.length > 0 && (
          <FactSheetTable
            factTable={article.factTable}
            articleSlug={article.slug}
            articleTitle={article.title}
            sourceName={sourceLabel}
            sourceUrl={article.sourceUrl}
            student={student}
            onSaveToNotebook={(quote, memo) =>
              setNotes((prev) => [
                { id: `local-${Date.now()}`, studentId: student?.id || "", articleId: article.id, quoteText: quote, memo, createdAt: new Date() },
                ...prev,
              ])
            }
          />
        )}

        {/* Quiz: answers are checked on the server */}
        {article.quizQuestions.length > 0 && (
          <Section title="নিজেকে যাচাই করুন" hint="প্রতিবেদনের একটি বাক্য থেকে তৈরি প্রশ্ন">
            {/* Anyone can check an answer; logging in only adds saved progress */}
            <MicroQuiz questions={article.quizQuestions} studentId={student?.id || ""} isEnglishMode={isEnglish} compact />
            {!student && (
              <p className="text-sm text-[#68707f]">
                <Link href={`/login?redirect=/article/${encodeURIComponent(article.slug)}`} className="text-[#842323] font-semibold hover:underline">
                  লগইন করুন
                </Link>{" "}
                যাতে আপনার উত্তর ও অগ্রগতি সংরক্ষিত থাকে।
              </p>
            )}
          </Section>
        )}

        {/* Vocabulary */}
        {isEnglish && englishVocabRows.length > 0 && (
          <VocabularyTable rows={englishVocabRows} articleSlug={article.slug} articleTitle={article.title} student={student} />
        )}
        {!isEnglish && article.vocabulary.length > 0 && (
          <Section title="পরিভাষা" hint="এই খবরে ব্যবহৃত গুরুত্বপূর্ণ শব্দ">
            <dl className="divide-y divide-[#ece6db] rounded-xl bg-white border border-[#ece6db]">
              {article.vocabulary.map((v) => (
                <div key={v.id} className="p-4">
                  <dt className="font-semibold text-[#17191d]">{v.term}</dt>
                  <dd className="text-[15px] leading-relaxed text-[#525a68] mt-1">{v.definition}</dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {/* Summary practice */}
        <ArticleSummaryReflection
          articleSlug={article.slug}
          articleTitle={article.title}
          student={student}
          notes={notes}
          onNotesChange={setNotes}
        />

        {/* Related */}
        {relatedArticles.length > 0 && (
          <Section title="আরও পড়ুন">
            <div className="grid gap-3">
              {relatedArticles.map((r) => (
                <Link
                  key={r.id}
                  href={`/article/${r.slug}`}
                  className="flex items-start gap-3 rounded-xl bg-white border border-[#ece6db] p-4 hover:border-[#842323] transition"
                >
                  <BookOpen className="w-4 h-4 text-[#842323] shrink-0 mt-1" />
                  <span>
                    <span className="block font-serif font-semibold text-[#17191d] leading-snug">{r.title}</span>
                    <span className="block text-sm text-[#68707f] mt-1">
                      {r.sourceName || ""} · {r.publishedAt}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        )}
      </main>

      <ShareStudyModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        article={{
          title: article.title,
          summary: article.summary,
          category: article.category,
          examTags: article.examTags,
          keyTakeaways: article.keyTakeaways,
          slug: article.slug,
        }}
      />
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
