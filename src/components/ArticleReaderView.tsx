"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReaderToolbar from "@/components/ReaderToolbar";
import ShareStudyModal from "@/components/ShareStudyModal";
import VocabularyModal from "@/components/VocabularyModal";
import MicroQuiz from "@/components/MicroQuiz";
import SideNotePanel from "@/components/SideNotePanel";
import HighlighterTooltip from "@/components/HighlighterTooltip";
import ArticleSummaryReflection from "@/components/ArticleSummaryReflection";
import FactSheetTable from "@/components/FactSheetTable";
import VocabularyTable from "@/components/VocabularyTable";
import InterlinearArticleBody from "@/components/InterlinearArticleBody";
import FocusDictionaryModal from "@/components/FocusDictionaryModal";
import ProAuthGateModal, { ProGateFeature } from "@/components/ProAuthGateModal";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Article, StudyNote, Student } from "@/types";
import { createStudyNoteAction, saveMarkerHighlightAction, trackArticleReadAction } from "@/actions/student";
import { applyHighlightsToHtml } from "@/lib/highlighter";
import { extractVocabularyTableRows } from "@/lib/vocabulary-table-engine";
import { generateScaffoldedEnglishQuiz } from "@/lib/quiz/scaffolded-english-quiz";
import { generateContextualMicroQuiz } from "@/lib/quiz/generator";
import Link from "next/link";
import { Clock, ArrowLeft, Lightbulb, Highlighter, Check, Edit3, X, Globe, ExternalLink, BookOpen, Volume2, Share2 } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { isBengaliText, translateTitleToBengali, translateSummaryToBengali, translateContentToBengaliHtml } from "@/lib/bilingual";
import { getNewspaperSourceInfo } from "@/lib/sources";

interface ArticleReaderViewProps {
  article: Article;
  relatedArticles: Article[];
  initialNotes: StudyNote[];
  student: Student | null;
}

export default function ArticleReaderView({
  article,
  relatedArticles,
  initialNotes,
  student,
}: ArticleReaderViewProps) {
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [notes, setNotes] = useState<StudyNote[]>(initialNotes);
  const [selectedSnippet, setSelectedSnippet] = useState("");
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [showMemoInput, setShowMemoInput] = useState(false);
  const [personalMemo, setPersonalMemo] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Focus Mode & Quick Dictionary State
  const [isDictModalOpen, setIsDictModalOpen] = useState(false);
  const [dictLookupWord, setDictLookupWord] = useState("");

  // Pro Feature Auth Gate State
  const [proGateOpen, setProGateOpen] = useState(false);
  const [proGateFeature, setProGateFeature] = useState<ProGateFeature>("dictionary");

  const requireAuthFor = (feature: ProGateFeature): boolean => {
    if (!student) {
      setProGateFeature(feature);
      setProGateOpen(true);
      return false;
    }
    return true;
  };

  // Track article read for logged-in students (marketing activity counter)
  useEffect(() => {
    if (student && article?.slug) {
      trackArticleReadAction(article.slug).catch(() => {});
    }
  }, [student, article?.slug]);

  const { mode, isEnglishMode } = useAppMode();
  const isEnglish = !isBengaliText(article.title);
  const [readerTranslation, setReaderTranslation] = useState(isEnglish && !isEnglishMode);

  useEffect(() => {
    if (isEnglish) {
      setReaderTranslation(!isEnglishMode);
    }
  }, [isEnglishMode, isEnglish]);

  // Determine if we should present the English Learning experience
  // Determine if we should present the English Learning experience:
  // Strictly requires an English article, and user is in English mode or untranslated view
  const useEnglishLearningExperience = isEnglish && (!readerTranslation || isEnglishMode);

  // Generate 3-column vocabulary rows
  const vocabRows = useMemo(() => {
    return extractVocabularyTableRows(article.title, article.content, article.vocabulary);
  }, [article.title, article.content, article.vocabulary]);

  // Generate Job Prep GK Micro-Quiz for Bengali news / Job mode
  const jobPrepQuizzes = useMemo(() => {
    if (article.quizQuestions && article.quizQuestions.length > 0) {
      return article.quizQuestions.map((q) => {
        let quote = (q as any).contextQuote;
        let pRef = (q as any).paragraphRef;
        if (!quote) {
          const cleanText = (article.content || article.summary || "").replace(/<[^>]+>/g, " ");
          const sentences = cleanText.split(/(?<=[.?!।])\s+/).filter((s) => s.trim().length > 15);
          quote = sentences[0] ? (sentences[0].length > 200 ? sentences[0].slice(0, 197) + "..." : sentences[0]) : article.title;
          pRef = "অনুচ্ছেদ ১ • মূল প্রেক্ষাপট";
        }
        return {
          ...q,
          contextQuote: quote,
          paragraphRef: pRef,
        };
      });
    }

    let takeaways: string[] = [];
    if (article.keyTakeaways) {
      if (Array.isArray(article.keyTakeaways)) {
        takeaways = article.keyTakeaways;
      } else if (typeof article.keyTakeaways === "string") {
        try {
          takeaways = JSON.parse(article.keyTakeaways);
        } catch {
          takeaways = [];
        }
      }
    }

    const microQuiz = generateContextualMicroQuiz(
      article.title,
      article.content || article.summary || "",
      article.category?.name || "জাতীয় পরিক্রমা",
      takeaways
    );

    return [
      {
        id: `dynamic-${article.id}`,
        question: microQuiz.question,
        options: microQuiz.options,
        correctOption: microQuiz.correctOption,
        explanation: microQuiz.explanation,
        topicTag: microQuiz.topicTag,
        contextQuote: microQuiz.contextQuote || article.title,
        paragraphRef: microQuiz.paragraphRef || "অনুচ্ছেদ ১ • মূল প্রেক্ষাপট",
      },
    ];
  }, [article]);

  // Generate Scaffolded English Micro-Quiz
  const englishQuizzes = useMemo(() => {
    return generateScaffoldedEnglishQuiz(article.title, article.content);
  }, [article.title, article.content]);

  // Audio speech on word click with error safety
  const handlePlayWordAudio = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "en-US";
        utterance.rate = 0.88;
        utterance.onerror = (e) => {
          console.warn("[SPEECH] Speech utterance error:", e);
        };
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("[SPEECH] Speech synthesis unavailable:", err);
      }
    }
  };

  // Open Dictionary Modal with word (Auth-gated for Pro conversion)
  const handleOpenDictionary = (term?: string) => {
    if (!requireAuthFor("dictionary")) return;
    if (term) {
      setDictLookupWord(term);
    }
    setIsDictModalOpen(true);
  };

  const displayTitle = (isEnglish && readerTranslation)
    ? translateTitleToBengali(article.title)
    : article.title;

  const displaySummary = (isEnglish && readerTranslation)
    ? translateSummaryToBengali(article.title, article.summary, article.category?.name)
    : article.summary;

  const renderedArticleHtml = useMemo(() => {
    let baseHtml = article.content;
    if (isEnglish && readerTranslation) {
      baseHtml = translateContentToBengaliHtml(article.content, article.title, article.category?.name);
    }
    return applyHighlightsToHtml(baseHtml, notes);
  }, [article.content, article.title, article.category?.name, isEnglish, readerTranslation, notes]);

  const sourceInfo = getNewspaperSourceInfo(article.imageCaption, article.title);

  const handleArticleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "MARK" && target.hasAttribute("data-note-id")) {
      const noteId = target.getAttribute("data-note-id");
      const matchedNote = notes.find((n) => n.id === noteId);
      if (matchedNote) {
        setIsNotebookOpen(true);
      }
    }
  };

  const handleMouseUp = () => {
    if (typeof window !== "undefined") {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";
      if (text.length >= 2 && text.length <= 600) {
        setSelectedSnippet(text);
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          const screenWidth = typeof window !== "undefined" ? window.innerWidth : 800;
          setTooltipPos({
            top: rect.top,
            left: Math.max(12, Math.min(screenWidth - 290, rect.left + rect.width / 2 - 140)),
          });
        }
      } else {
        if (!showMemoInput) {
          setTooltipPos(null);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      handleMouseUp();
    }, 150);
  };

  const handleApplyHighlight = async (colorName: "হলুদ মার্কার" | "সবুজ মার্কার" | "বেগুনি মার্কার") => {
    if (!selectedSnippet) return;
    if (!requireAuthFor("notebook")) return;

    try {
      const newNote = await saveMarkerHighlightAction(
        student!.id,
        article.slug,
        selectedSnippet,
        colorName
      );
      setNotes([newNote as any, ...notes]);
      setTooltipPos(null);
      setSelectedSnippet("");
      setToastMessage(`${colorName} দিয়ে নিবন্ধে ও নোটবুকে হাইলাইট সংরক্ষিত হয়েছে`);
      setTimeout(() => setToastMessage(""), 2800);
    } catch (err) {
      console.error(err);
      alert("হাইলাইট সংরক্ষণ করতে সমস্যা হয়েছে।");
    }
  };

  const handleAddMemoNote = async () => {
    if (!selectedSnippet) return;
    if (!requireAuthFor("notebook")) return;

    setIsSavingNote(true);
    try {
      const newNote = await createStudyNoteAction(
        student!.id,
        article.slug,
        selectedSnippet,
        personalMemo || undefined
      );
      setNotes([newNote as any, ...notes]);
      setSelectedSnippet("");
      setPersonalMemo("");
      setShowMemoInput(false);
      setTooltipPos(null);
      setToastMessage("ব্যক্তিগত নোটসহ ক্লাউড নোটবুকে সংরক্ষিত হয়েছে");
      setTimeout(() => setToastMessage(""), 2800);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleToggleFocusMode = () => {
    const next = !isFocusMode;
    setIsFocusMode(next);
    if (next) {
      setIsNotebookOpen(true);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const fontClass =
    fontSize === "xlarge"
      ? "text-xl sm:text-2xl leading-[2.1]"
      : fontSize === "large"
      ? "text-lg sm:text-xl leading-[1.95]"
      : "text-base sm:text-[1.125rem] leading-[1.8]";

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans transition-all duration-300 pb-16 md:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#17191d] text-white text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-[#374151] animate-in fade-in slide-in-from-top-4">
          <Check className="w-3.5 h-3.5 text-[#86efac]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Marker Tooltip with Instant 1-Click Dictionary Lookup */}
      <HighlighterTooltip
        position={tooltipPos}
        selectedText={selectedSnippet}
        onApplyHighlight={handleApplyHighlight}
        onOpenMemo={() => {
          setShowMemoInput(true);
          setTooltipPos(null);
        }}
        onDismiss={() => {
          setTooltipPos(null);
          setSelectedSnippet("");
        }}
        onLookupDictionary={(text) => {
          setTooltipPos(null);
          setSelectedSnippet("");
          handleOpenDictionary(text);
        }}
      />

      {!isFocusMode && (
        <Header
          session={
            student
              ? { role: "student", student: student as any }
              : { role: null, student: null }
          }
        />
      )}

      <div
        className={`flex-1 mx-auto px-4 sm:px-6 py-8 w-full transition-all duration-300 ${
          isFocusMode
            ? isNotebookOpen
              ? "max-w-6xl py-10"
              : "max-w-3xl py-12"
            : isNotebookOpen
            ? "max-w-6xl"
            : "max-w-3xl"
        }`}
      >
        {/* Navigation Breadcrumb */}
        {!isFocusMode && (
          <div className="flex items-center gap-2 text-xs text-[#68707f] mb-6">
            <Link href="/" className="hover:text-[#842323] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> {isEnglishMode ? "Feed" : "প্রচ্ছদ"}
            </Link>
            <span>/</span>
            <Link href={`/category/${article.category.slug}`} className="hover:text-[#842323] font-medium">
              {article.category.name}
            </Link>
            {article.examTags && (
              <>
                <span>/</span>
                <span className="text-[#842323] font-semibold">{article.examTags.split(",")[0]}</span>
              </>
            )}
          </div>
        )}

        {/* Reader Ergonomics Toolbar */}
        <ReaderToolbar
          articleTitle={article.title}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          isFocusMode={isFocusMode}
          onToggleFocusMode={handleToggleFocusMode}
          isNotebookOpen={isNotebookOpen}
          onToggleNotebook={() => setIsNotebookOpen(!isNotebookOpen)}
          noteCount={notes.length}
          copied={copied}
          onCopyLink={handleCopyLink}
          onOpenShare={() => setIsShareModalOpen(true)}
          isEnglishArticle={isEnglish && useEnglishLearningExperience && !readerTranslation}
          onOpenDictionary={handleOpenDictionary}
        />

        {/* Main Content & Side Note Panel Wrapper */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Reading Column */}
          <main className="flex-1 min-w-0 w-full" onMouseUp={handleMouseUp} onTouchEnd={handleTouchEnd}>
            {/* Article Header */}
            <header className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded inline-block ${
                  useEnglishLearningExperience ? "text-blue-900 bg-blue-50" : "text-[#842323] bg-[#f5ebeb]"
                }`}>
                  {article.category.name}
                </span>
                {article.examTags && (
                  <span className="text-xs text-[#525a68] bg-[#eee9df] px-2.5 py-1 rounded">
                    লক্ষ্য: {article.examTags}
                  </span>
                )}
                {useEnglishLearningExperience && (
                  <span className="text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded font-sans">
                    English Audio Reader
                  </span>
                )}
              </div>

              {/* Bilingual Reader Switcher for English Articles (Only in Job Prep mode) */}
              {isEnglish && !isEnglishMode && (
                <div className="mb-4 p-3 bg-gradient-to-r from-amber-50/80 to-[#fdfbf7] border border-amber-200/90 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#842323]" />
                    <div>
                      <span className="text-xs font-bold text-[#1c1d21] block">
                        খবরাখবর দ্বিভাষিক পাঠক (Bilingual Reader View)
                      </span>
                      <span className="text-[11px] text-[#6b7280]">
                        মূল ইংরেজি সম্পাদকীয় ও বিসিএস পাঠোপযোগী প্রাতিষ্ঠানিক বাংলা ভাবানুবাদ
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex rounded-lg border border-[#ded8cb] bg-white p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setReaderTranslation(true)}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        readerTranslation
                          ? "bg-[#842323] text-white shadow-2xs font-bold"
                          : "text-[#404652] hover:bg-[#f6f2e9]"
                      }`}
                    >
                      বাংলা ভাবানুবাদ
                    </button>
                    <button
                      type="button"
                      onClick={() => setReaderTranslation(false)}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        !readerTranslation
                          ? "bg-[#842323] text-white shadow-2xs font-bold"
                          : "text-[#404652] hover:bg-[#f6f2e9]"
                      }`}
                    >
                      English Original
                    </button>
                  </div>
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17191d] leading-snug font-serif">
                {displayTitle}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-[#3b414d] leading-relaxed font-sans border-l-3 border-[#842323] pl-4 py-0.5">
                {displaySummary}
              </p>

              {/* Timestamp Bar */}
              <div className="mt-6 pt-3 border-t border-b border-[#e5dfd4] flex items-center justify-between gap-4 py-2 text-xs text-[#68707f]">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full ${sourceInfo.bgColor} ${sourceInfo.borderColor} border shrink-0 flex items-center justify-center select-none shadow-2xs`}
                    title={`উৎস: ${sourceInfo.name}`}
                  >
                    <span className={`${sourceInfo.textColor} font-bold text-[10px]`}>
                      {sourceInfo.monogram}
                    </span>
                  </div>
                  <span className="font-semibold text-[#1c1d21]">{article.sourceName || sourceInfo.name}</span>
                  <span>•</span>
                  <span>{article.publishedAt}</span>
                  {article.sourceUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#842323] hover:text-[#5e1919] hover:underline"
                        title="সংবাদপত্রের বিস্তারিত প্রতিবেদন দেখুন"
                      >
                        <span>বিস্তারিত প্রতিবেদন</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex items-center gap-1 text-[#788191]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{article.readTime} পাঠ</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#faf8f4] hover:bg-[#ede7da] text-[#842323] border border-[#ded8cb] text-xs font-semibold transition shadow-2xs hover:shadow-xs active:scale-95 shrink-0"
                    title="সহপাঠীদের সাথে শেয়ার করুন"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#842323]" />
                    <span>শেয়ার</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Key Takeaways Box for Fast Revision */}
            {article.keyTakeaways && article.keyTakeaways.length > 0 && (
              <div className="mb-6 p-4 bg-[#f6f2e8] border border-[#e2dcd0] rounded-md">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e7e1d5]">
                  <Lightbulb className="w-4 h-4 text-[#842323]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1c1d21]">
                    {useEnglishLearningExperience ? "Key Learning Takeaways" : "শিক্ষণীয় মূল বিষয়বস্তু (Exam Key Takeaways)"}
                  </h3>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-[#3b414d] font-sans list-disc list-inside">
                  {article.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CONDITIONAL TABLE:
                In English Learning Mode -> Render 3-Column Vocabulary Matrix with fresh practical examples!
                In Job Prep Mode / Bengali -> Render FactSheetTable
            */}
            {useEnglishLearningExperience ? (
              <VocabularyTable
                rows={vocabRows}
                articleSlug={article.slug}
                articleTitle={article.title}
                student={student}
                onSaveFeedback={(msg) => {
                  setToastMessage(msg);
                  setTimeout(() => setToastMessage(""), 2800);
                }}
              />
            ) : (
              <FactSheetTable
                factTable={article.factTable}
                articleSlug={article.slug}
                articleTitle={article.title}
                sourceName={article.sourceName || sourceInfo.name}
                sourceUrl={article.sourceUrl}
                student={student}
                onSaveToNotebook={(quote, memo) => {
                  setNotes((prev) => [
                    {
                      id: `note-${Date.now()}`,
                      studentId: student?.id || "",
                      articleId: article.id,
                      quoteText: quote,
                      memo,
                      createdAt: new Date(),
                    },
                    ...prev,
                  ]);
                  setToastMessage("পরীক্ষা তথ্য ছকটি আপনার স্টাডি নোটবুকে যুক্ত হয়েছে!");
                  setTimeout(() => setToastMessage(""), 2800);
                }}
              />
            )}

            {/* Featured Image (Hidden in Focus Mode) */}
            {!isFocusMode && (
              <figure className="mb-8 rounded-md overflow-hidden bg-[#eee9df] border border-[#e4ded3]">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full max-h-[460px] object-cover brightness-[0.98]"
                />
                {article.imageCaption && (
                  <figcaption className="p-2.5 text-xs text-[#68707f] bg-[#f7f4ed] italic text-center border-t border-[#ebe5da]">
                    {article.imageCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Main Article Body:
                In English Learning Experience without translation -> Render Interlinear Scaffolding
                Otherwise -> Standard Highlighting Article View
            */}
            {useEnglishLearningExperience && !readerTranslation ? (
              <div className="mb-8 p-4 sm:p-6 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#f1f5f9]">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono">
                      ইংরেজি মূল পাঠ ও অডিও উচ্চারণ
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748b]">
                    যেকোনো শব্দের ওপর ক্লিক করে সঠিক ইংরেজি উচ্চারণ শুনুন
                  </span>
                </div>
                <InterlinearArticleBody
                  htmlContent={renderedArticleHtml}
                  fontSize={fontSize}
                  onWordClick={handlePlayWordAudio}
                />
              </div>
            ) : (
              <article
                className={`prose prose-neutral max-w-none text-[#23272e] space-y-5 font-serif transition-all duration-200 select-text ${fontClass}`}
                dangerouslySetInnerHTML={{ __html: renderedArticleHtml }}
                onClick={handleArticleClick}
              />
            )}

            {/* Optional Memo Input Drawer when triggered */}
            {showMemoInput && selectedSnippet && (
              <div className="mt-6 p-4 bg-[#ffffff] border border-[#ded8cb] rounded-xl shadow-lg animate-in fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#842323] flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>হাইলাইটে ব্যক্তিগত নোট যুক্ত করুন</span>
                  </span>
                  <button
                    onClick={() => {
                      setShowMemoInput(false);
                      setSelectedSnippet("");
                    }}
                    className="p-1 text-[#8e95a2] hover:text-[#1c1d21]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs italic text-[#4e5564] bg-[#faf8f4] p-2.5 rounded border border-[#ece7dc] mb-2.5 line-clamp-3">
                  "{selectedSnippet}"
                </p>
                <input
                  type="text"
                  placeholder="আপনার নিজস্ব ব্যাখ্যা বা পরীক্ষার গুরুত্বপূর্ণ পয়েন্ট লিখুন..."
                  value={personalMemo}
                  onChange={(e) => setPersonalMemo(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#fdfcf9] border border-[#dcd7cb] rounded-md mb-2.5 outline-none focus:border-[#842323]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setShowMemoInput(false);
                      setSelectedSnippet("");
                    }}
                    className="px-3 py-1.5 text-xs text-[#6c7482] hover:bg-[#f6f2e8] rounded"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={handleAddMemoNote}
                    disabled={isSavingNote}
                    className="px-4 py-1.5 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-semibold rounded transition"
                  >
                    {isSavingNote ? "সংরক্ষণ হচ্ছে..." : "নোটবুকে সংরক্ষণ করুন"}
                  </button>
                </div>
              </div>
            )}

            {/* Post-Reading Reflection & Active Recall Summary Section */}
            <ArticleSummaryReflection
              articleSlug={article.slug}
              articleTitle={article.title}
              student={student}
              notes={notes}
              onNotesChange={setNotes}
            />

            {/* ACTIVE RECALL MICRO-QUIZ:
                In English Learning Mode -> Render Scaffolded English Active Recall (Bangla questions + English options with Bangla brackets)
                In Job Prep Mode -> Render factual GK Quiz
            */}
            {useEnglishLearningExperience ? (
              <MicroQuiz
                questions={englishQuizzes}
                studentId={student?.id || ""}
                isEnglishMode
                onAuthRequired={() => requireAuthFor("quiz")}
              />
            ) : (
              jobPrepQuizzes.length > 0 && (
                <MicroQuiz
                  questions={jobPrepQuizzes}
                  studentId={student?.id || ""}
                  onAuthRequired={() => requireAuthFor("quiz")}
                />
              )
            )}

            {/* Related Articles Section */}
            {!isFocusMode && relatedArticles.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[#e2dcd0]">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1c1d21] mb-4">
                  {useEnglishLearningExperience ? "Related English Studies & Editorial Readings" : "সম্পর্কিত অন্যান্য সংবাদ ও পাঠ"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/article/${rel.slug}`}
                      className="p-3.5 bg-white border border-[#e2dcd0] rounded-lg hover:border-[#842323] transition flex flex-col justify-between group"
                    >
                      <h4 className="text-xs font-bold text-[#1c1d21] group-hover:text-[#842323] line-clamp-2">
                        {rel.title}
                      </h4>
                      <span className="text-[10px] text-[#788191] mt-2 block">
                        {rel.readTime} পাঠ &bull; {rel.publishedAt}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Active Side Note & SLM Dictionary Panel */}
          <SideNotePanel
            articleSlug={article.slug}
            articleTitle={article.title}
            student={student}
            notes={notes}
            onNotesChange={setNotes}
            isOpen={isNotebookOpen}
            onClose={() => setIsNotebookOpen(false)}
          />
        </div>

        {/* Study Group Sharing Modal */}
        <ShareStudyModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          article={article}
        />
      </div>

      {/* Focus Mode & In-Reader Quick Dictionary Modal */}
      <FocusDictionaryModal
        isOpen={isDictModalOpen}
        onClose={() => setIsDictModalOpen(false)}
        initialWord={dictLookupWord}
        articleSlug={article.slug}
        student={student}
        onSaveFeedback={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(""), 2800);
        }}
      />

      {/* Founding Pro Feature Auth Gate Modal */}
      <ProAuthGateModal
        isOpen={proGateOpen}
        onClose={() => setProGateOpen(false)}
        feature={proGateFeature}
      />

      {/* Floating Action Bubble Toggle (STRICTLY MOBILE ONLY: md:hidden) */}
      <button
        onClick={() => setIsNotebookOpen(!isNotebookOpen)}
        className={`md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border hover:scale-110 active:scale-95 group ${
          isNotebookOpen
            ? "bg-[#1f2733] hover:bg-[#121720] text-white border-[#384152]"
            : useEnglishLearningExperience
            ? "bg-[#1e40af] hover:bg-[#1d4ed8] text-white border-[#1d4ed8]"
            : "bg-[#842323] hover:bg-[#6e1c1c] text-white border-[#9c2b2b]"
        }`}
        title={isNotebookOpen ? "নোটবুক মিনিমাইজ করুন" : "নোটবুক ও অভিধান খুলুন"}
        aria-label={isNotebookOpen ? "নোটবুক বন্ধ করুন" : "নোটবুক খুলুন"}
      >
        {isNotebookOpen ? (
          <X className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-white" />
            {notes.length > 0 && (
              <span className="absolute -top-2.5 -right-2.5 min-w-[20px] h-5 px-1 bg-amber-400 text-neutral-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-white">
                {notes.length}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Mobile Sticky Bottom Bar */}
      <MobileBottomNav />

      {!isFocusMode && <Footer />}
    </div>
  );
}
