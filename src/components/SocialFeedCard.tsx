"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, HelpCircle, Bookmark, 
  Share2, Check, ArrowRight, ShieldCheck, Clock, 
  ExternalLink, ChevronDown, CheckCircle2, XCircle, 
  Lightbulb, BookOpen, Layers, Target, Globe
} from "lucide-react";
import ShareStudyModal from "./ShareStudyModal";
import { saveWordToBankAction } from "@/actions/student";
import { useLanguage } from "@/context/LanguageContext";
import { isBengaliText, translateTitleToBengali, translateSummaryToBengali } from "@/lib/bilingual";
import { getNewspaperSourceInfo } from "@/lib/sources";

interface SocialFeedCardProps {
  article: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    content: string;
    keyTakeaways?: string[];
    factTable?: { parameter: string; value: string; relevance: string }[];
    sourceName?: string | null;
    sourceUrl?: string | null;
    examTags?: string | null;
    featuredImage: string;
    imageCaption?: string | null;
    publishedAt: string;
    readTime: string;
    category: {
      name: string;
      slug: string;
    };
    vocabulary?: {
      id: string;
      term: string;
      definition: string;
      context?: string | null;
    }[];
    quizQuestions?: {
      id: string;
      question: string;
      options: string[] | string;
      correctOption: number;
      explanation?: string | null;
    }[];
  };
  studentId?: string;
  isInitiallySaved?: boolean;
}

export default function SocialFeedCard({
  article,
  studentId,
  isInitiallySaved = false,
}: SocialFeedCardProps) {
  const [showTakeaways, setShowTakeaways] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { language } = useLanguage();
  const isEnglish = !isBengaliText(article.title);
  const [showTranslation, setShowTranslation] = useState(isEnglish && language === "bn");

  useEffect(() => {
    if (isEnglish) {
      setShowTranslation(language === "bn");
    }
  }, [language, isEnglish]);

  const displayTitle = (isEnglish && showTranslation) ? translateTitleToBengali(article.title) : article.title;
  const displaySummary = (isEnglish && showTranslation)
    ? translateSummaryToBengali(article.title, article.summary, article.category?.name)
    : article.summary;

  const sourceInfo = getNewspaperSourceInfo(article.imageCaption, article.title);

  // Quiz interactive state
  const firstQuiz = article.quizQuestions?.[0];
  const parsedOptions: string[] = (() => {
    if (!firstQuiz) return [];
    if (Array.isArray(firstQuiz.options)) return firstQuiz.options;
    if (typeof firstQuiz.options === "string") {
      try {
        return JSON.parse(firstQuiz.options);
      } catch {
        return [];
      }
    }
    return [];
  })();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);

  const handleQuizSelect = (idx: number) => {
    if (quizAnswered) return;
    setSelectedOption(idx);
    setQuizAnswered(true);
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
  };

  return (
    <article
      data-digital-signature={`KK-AUTH-SHA256-${article.id}`}
      className="bg-white border border-[#ded8cb] rounded-2xl shadow-2xs hover:shadow-xs transition duration-200 overflow-hidden text-[#1c1d21]"
    >
      {/* 1. Header Post Bar with Official Newspaper Logo */}
      <div className="p-4 sm:p-5 pb-3 flex items-center justify-between border-b border-[#f4efe4]">
        <div className="flex items-center gap-3">
          <div
            className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full ${sourceInfo.bgColor} ${sourceInfo.borderColor} border shadow-2xs shrink-0 flex items-center justify-center select-none transition-transform hover:scale-105`}
            title={`উৎস: ${sourceInfo.name}`}
          >
            <span className={`${sourceInfo.textColor} ${sourceInfo.fontClass || "font-bold text-xs sm:text-sm"}`}>
              {sourceInfo.monogram}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1c1d21]">
                {article.sourceName || sourceInfo.name}
              </span>
              <span className="text-[10px] bg-[#f5ebeb] text-[#842323] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {article.category.name}
              </span>
              {article.sourceUrl && (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#842323] hover:underline inline-flex items-center gap-0.5 font-semibold ml-0.5"
                  title="সংবাদপত্রের বিস্তারিত প্রতিবেদন দেখুন"
                >
                  <span>বিস্তারিত</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#717887] mt-0.5">
              <span>{article.publishedAt}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#9aa4b2]" />
                {article.readTime} পাঠ
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="p-2 text-[#788191] hover:text-[#1c1d21] hover:bg-[#faf8f4] rounded-full transition"
          title="শেয়ার করুন"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Content & Headline Body */}
      <div className="p-4 sm:p-5 pt-3.5 space-y-3">
        {/* Bilingual Translation Toggle for English Articles */}
        {isEnglish && (
          <div className="flex items-center justify-between bg-[#fbf9f5] border border-[#e2dcd0] p-1.5 px-3 rounded-lg text-xs">
            <span className="font-medium text-[#717887] text-[11px] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#842323]" />
              <span className="hidden sm:inline">ইংরেজি সম্পাদকীয় প্রতিবেদন</span>
              <span className="sm:hidden">English Source</span>
            </span>

            <div className="inline-flex rounded-md border border-[#ded8cb] bg-white p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setShowTranslation(true)}
                className={`px-2.5 py-0.5 rounded font-semibold transition ${
                  showTranslation
                    ? "bg-[#842323] text-white shadow-2xs font-bold"
                    : "text-[#404652] hover:bg-[#f6f2e9]"
                }`}
              >
                বাংলা ভাবানুবাদ
              </button>
              <button
                type="button"
                onClick={() => setShowTranslation(false)}
                className={`px-2.5 py-0.5 rounded font-semibold transition ${
                  !showTranslation
                    ? "bg-[#842323] text-white shadow-2xs font-bold"
                    : "text-[#404652] hover:bg-[#f6f2e9]"
                }`}
              >
                English Original
              </button>
            </div>
          </div>
        )}

        <Link href={`/article/${article.slug}`} className="block group">
          <h2 className="text-lg sm:text-xl font-bold font-serif leading-snug text-[#17191d] group-hover:text-[#842323] transition-colors">
            {displayTitle}
          </h2>
        </Link>

        <p className="text-xs sm:text-sm text-[#404652] leading-relaxed line-clamp-3">
          {displaySummary}
        </p>

        {/* High-Yield Data Metric Pill for Exam Aspirants */}
        {article.factTable && article.factTable.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f6f2e9] border border-[#e2dcd0] text-[11px] text-[#2c323f]">
              <span className="font-bold text-[#842323]">{article.factTable[0]?.parameter}:</span>
              <span className="font-medium text-[#17191d]">{article.factTable[0]?.value}</span>
            </div>
            {article.factTable[1] && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#faf8f4] border border-[#e8e2d6] text-[11px] text-[#4b5563] hidden sm:inline-flex">
                <span className="font-semibold text-[#842323]">{article.factTable[1]?.parameter}:</span>
                <span className="font-medium text-[#17191d]">{article.factTable[1]?.value}</span>
              </div>
            )}
          </div>
        )}

        {/* Media Image */}
        {article.featuredImage && (
          <div className="relative aspect-video sm:aspect-21/9 rounded-xl overflow-hidden bg-[#eee9df] border border-[#ded8cb] group">
            <Link href={`/article/${article.slug}`}>
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-102 transition duration-500 brightness-[0.98]"
              />
            </Link>
            {article.examTags && (
              <div className="absolute bottom-2.5 left-2.5 bg-[#17191d]/85 text-white text-[10px] font-medium px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                <Target className="w-3 h-3 text-[#f5c66b]" />
                <span>{article.examTags}</span>
              </div>
            )}
          </div>
        )}

        {/* 3. Inline Expandable: Exam Key Takeaways Drawer */}
        {showTakeaways && article.keyTakeaways && article.keyTakeaways.length > 0 && (
          <div className="p-4 bg-[#f8f5ee] border border-[#ded8cb] rounded-xl animate-fade-in space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#842323]">
              <Lightbulb className="w-4 h-4" />
              <span>শিক্ষণীয় মূল বিষয়বস্তু (Exam Key Takeaways):</span>
            </div>
            <ul className="space-y-1.5 text-xs text-[#343a46] list-disc list-inside">
              {article.keyTakeaways.map((pt, i) => (
                <li key={i} className="leading-relaxed">
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Inline Expandable: 10-Second Recall Micro-Quiz */}
        {showQuiz && firstQuiz && (
          <div className="p-4 bg-[#fdfbf7] border border-[#ded8cb] rounded-xl animate-fade-in space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#842323] uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>১০-সেকেন্ড একটিভ রিকল কুইজ:</span>
              </span>
              <span className="text-[10px] text-[#717887]">তাত্ক্ষণিক ফিডব্যাক</span>
            </div>

            <p className="text-xs font-bold text-[#1c1d21] leading-snug">
              {firstQuiz.question}
            </p>

            <div className="space-y-1.5">
              {parsedOptions.map((opt, oIdx) => {
                let btnStyle = "bg-white border-[#ded8cb] hover:bg-[#faf8f4] text-[#343a46]";
                if (quizAnswered) {
                  if (oIdx === firstQuiz.correctOption) {
                    btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold";
                  } else if (selectedOption === oIdx) {
                    btnStyle = "bg-rose-50 border-rose-400 text-rose-950";
                  }
                } else if (selectedOption === oIdx) {
                  btnStyle = "bg-[#f5ebeb] border-[#842323] text-[#842323] font-semibold";
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    disabled={quizAnswered}
                    onClick={() => handleQuizSelect(oIdx)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {quizAnswered && oIdx === firstQuiz.correctOption && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {quizAnswered && selectedOption === oIdx && oIdx !== firstQuiz.correctOption && (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {quizAnswered && (
              <div className="p-2.5 bg-white border border-[#ded8cb] rounded text-[11px] text-[#404652] leading-relaxed">
                <span className="font-bold text-[#1c1d21]">ব্যাখ্যা: </span>
                {firstQuiz.explanation || "সঠিক উত্তর নির্বাচন সম্পন্ন হয়েছে।"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Social Action Bar (1-row responsive layout on mobile, spacious on desktop) */}
      <div className="px-3 sm:px-5 py-2.5 bg-[#faf8f4] border-t border-[#ece7dc] flex items-center justify-between gap-1 sm:gap-2 text-xs text-[#525964]">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Key Takeaways Toggle */}
          <button
            type="button"
            onClick={() => setShowTakeaways(!showTakeaways)}
            className={`px-2 sm:px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
              showTakeaways
                ? "bg-[#17191d] text-white"
                : "hover:bg-[#ece7dc] text-[#404652]"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#c29547] shrink-0" />
            <span className="text-[11px] sm:text-xs">মূলবিন্দু</span>
          </button>

          {/* Micro Quiz Toggle */}
          {firstQuiz && (
            <button
              type="button"
              onClick={() => setShowQuiz(!showQuiz)}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                showQuiz
                  ? "bg-[#842323] text-white"
                  : "hover:bg-[#ece7dc] text-[#404652]"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#2e744a] shrink-0" />
              <span className="text-[11px] sm:text-xs">কুইজ</span>
            </button>
          )}

          {/* Bookmark Toggle */}
          <button
            type="button"
            onClick={handleToggleSave}
            className={`p-1.5 sm:p-2 rounded-lg transition shrink-0 ${
              isSaved
                ? "text-[#842323] bg-[#f5ebeb]"
                : "text-[#717887] hover:bg-[#ece7dc] hover:text-[#1c1d21]"
            }`}
            title={isSaved ? "সংরক্ষিত হয়েছে" : "নোটবুকে সংরক্ষণ করুন"}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
          </button>

          {/* Social Share Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="p-1.5 sm:p-2 rounded-lg transition shrink-0 text-[#717887] hover:bg-[#ece7dc] hover:text-[#1c1d21]"
            title="সহপাঠীদের সাথে শেয়ার করুন"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center shrink-0">
          {/* Read Detailed Study Note & Fact Sheet */}
          <Link
            href={`/article/${article.slug}`}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#ffffff] hover:bg-[#ece7da] border border-[#ded8cb] text-xs font-semibold text-[#1c1d21] flex items-center gap-1 sm:gap-1.5 transition shadow-2xs group shrink-0 whitespace-nowrap"
          >
            <span className="hidden sm:inline">বিশদ স্টাডি নোট ও উপাত্ত ছক</span>
            <span className="sm:hidden font-bold">পড়ুন</span>
            <ArrowRight className="w-3 h-3 text-[#842323] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        </div>
      </div>

      {/* Social Excerpt Share Modal */}
      <ShareStudyModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        article={article}
      />
    </article>
  );
}

