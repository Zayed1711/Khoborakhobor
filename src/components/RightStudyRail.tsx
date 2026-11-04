"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Flame, Sparkles, TrendingUp, HelpCircle, 
  CheckCircle2, XCircle, ArrowRight, ShieldCheck, BookOpen, GraduationCap 
} from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import ProAuthGateModal from "./ProAuthGateModal";
import { getCurrentSession } from "@/actions/auth";
import { useAppMode } from "@/context/LanguageContext";
import { 
  TrendingHashtagsData, 
  TrendingHashtagItem, 
  getTrendingHashtagsAction 
} from "@/actions/search";

export interface DailyFeaturedQuizItem {
  id?: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation?: string | null;
  topicTag?: string;
  sourceName?: string | null;
  articleTitle?: string | null;
  articleSlug?: string | null;
  contextQuote?: string | null;
  paragraphRef?: string | null;
}

interface RightStudyRailProps {
  streakDays?: number;
  featuredQuiz?: DailyFeaturedQuizItem;
  featuredEnglishQuiz?: DailyFeaturedQuizItem;
  initialTrending?: TrendingHashtagsData;
}

const DEFAULT_GK_QUIZ: DailyFeaturedQuizItem = {
  sourceName: "প্রথম আলো",
  articleTitle: "মূল্যস্ফীতি নিয়ন্ত্রণে কেন্দ্রীয় ব্যাংকের সংকোচনমূলক মুদ্রানীতি পর্যালোচনা",
  articleSlug: "bangladesh-bank-new-repo-rate-inflation-policy-202",
  paragraphRef: "অনুচ্ছেদ ২ • বাক্য ১",
  contextQuote: "উচ্চ মূল্যস্ফীতি নিয়ন্ত্রণে কেন্দ্রীয় ব্যাংক নীতি সুদহার বৃদ্ধির মাধ্যমে বাজারে অর্থ ও নগদ টাকার প্রবাহ সংকুচিত করার নীতি গ্রহণ করেছে।",
  question: "উদ্ধৃত প্রেক্ষাপটের আলোকে কেন্দ্রীয় ব্যাংকের সংকোচনমূলক মুদ্রানীতির প্রাথমিক লক্ষ্য কোনটি?",
  options: [
    "অর্থ সরবরাহ নিয়ন্ত্রণ ও মূল্যস্ফীতি হ্রাস করা",
    "ব্যাংকিং সুদের হার শূন্যে নামিয়ে আনা",
    "নিত্যপ্রয়োজনীয় পণ্যের আমদানি সম্পূর্ণ বন্ধ করা",
    "সরকারি বৈদেশিক রিজার্ভ দ্রুত হ্রাস করা",
  ],
  correctOption: 0,
  explanation: "সংকোচনমূলক মুদ্রানীতি (Contractionary Monetary Policy) বাজারে নগদ টাকার সরবরাহ কমিয়ে মূল্যস্ফীতি সংবরণ করতে সাহায্য করে।",
};

const DEFAULT_ENGLISH_QUIZ: DailyFeaturedQuizItem = {
  sourceName: "The Daily Star",
  articleTitle: "Monetary policy stance: Central bank tightens credit to curb consumer inflation",
  articleSlug: "central-bank-tightens-credit-to-curb-consumer-inflation-101",
  paragraphRef: "অনুচ্ছেদ ২ • বাক্য ৩",
  contextQuote: "The governor emphasized that coordinated fiscal policy is essential to rein in stubborn consumer price inflation over the coming quarters.",
  question: 'উদ্ধৃত অনুচ্ছেদে "rein in" শব্দবন্ধ দিয়ে কী বোঝানো হয়েছে?',
  options: [
    "Control or restrain strictly (কঠোরভাবে নিয়ন্ত্রণ করা বা লাগাম টানা)",
    "Accelerate without any limits (সীমাহীন গতিতে বৃদ্ধি করা)",
    "Postpone indefinitely (অনির্দিষ্টকালের জন্য পিছিয়ে দেওয়া)",
    "Ignore completely (পুরোপুরি এড়িয়ে চলা)",
  ],
  correctOption: 0,
  explanation: '"Rein in" একটি অত্যন্ত গুরুত্বপূর্ণ ইংরেজি phrasal verb, যার অর্থ লাগাম টেনে ধরা বা কোনো কিছুকে নিয়ন্ত্রণে রাখা।',
};

const DEFAULT_GK_HASHTAGS: TrendingHashtagItem[] = [
  { tag: "বিসিএস", query: "বিসিএস", count: 1182, countLabel: "১,১৮২টি বিশ্লেষণ" },
  { tag: "অর্থনীতি", query: "অর্থনীতি", count: 274, countLabel: "২৭৪টি প্রতিবেদন" },
  { tag: "আন্তর্জাতিক", query: "আন্তর্জাতিক", count: 376, countLabel: "৩৭৬টি আপডেট" },
  { tag: "সুশাসন", query: "সুশাসন", count: 336, countLabel: "৩৩৬টি নিবন্ধ" },
  { tag: "বাণিজ্য", query: "বাণিজ্য", count: 116, countLabel: "১১৬টি সংবাদ" },
];

const DEFAULT_EN_HASHTAGS: TrendingHashtagItem[] = [
  { tag: "Bangladesh", query: "Bangladesh", count: 100, countLabel: "100 articles" },
  { tag: "National", query: "National", count: 46, countLabel: "46 briefs" },
  { tag: "Education", query: "Education", count: 14, countLabel: "14 readings" },
  { tag: "Business", query: "Business", count: 9, countLabel: "9 reports" },
  { tag: "Trade", query: "Trade", count: 8, countLabel: "8 analyses" },
];

export default function RightStudyRail({
  streakDays = 14,
  featuredQuiz,
  featuredEnglishQuiz,
  initialTrending,
}: RightStudyRailProps) {
  const { isEnglishMode } = useAppMode();
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isProGateOpen, setIsProGateOpen] = useState(false);
  const [trending, setTrending] = useState<TrendingHashtagsData>(
    initialTrending || { bn: DEFAULT_GK_HASHTAGS, en: DEFAULT_EN_HASHTAGS }
  );

  const activeQuiz =
    (isEnglishMode ? featuredEnglishQuiz : featuredQuiz) ||
    (isEnglishMode ? DEFAULT_ENGLISH_QUIZ : DEFAULT_GK_QUIZ);
  const activeHashtags = isEnglishMode ? trending.en : trending.bn;

  useEffect(() => {
    if (!initialTrending) {
      getTrendingHashtagsAction()
        .then((data) => {
          if (data && data.bn && data.bn.length > 0) {
            setTrending(data);
          }
        })
        .catch(() => {});
    }
  }, [initialTrending]);

  useEffect(() => {
    setSelectedOpt(null);
    setAnswered(false);
  }, [isEnglishMode, activeQuiz?.question]);

  // Anyone can answer the daily quiz; a login wall before the first answer scared
  // new visitors away. Saving progress is offered on the article pages instead.
  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOpt(idx);
    setAnswered(true);
  };

  const cleanSourceName =
    activeQuiz.sourceName?.split("(")[0]?.trim() ||
    (isEnglishMode ? "Editorial Desk" : "উৎস সংবাদ");

  // Extract topic tag if present in [Topic] format for clean presentation
  const rawQ = activeQuiz.question || "";
  const topicMatch = rawQ.match(/^\[(.*?)\]\s*(.*)$/);
  const topicBadge = topicMatch ? topicMatch[1] : (activeQuiz.topicTag || null);
  const questionBody = topicMatch ? topicMatch[2] : rawQ;

  const OPTION_PREFIX_BN = ["(ক)", "(খ)", "(গ)", "(ঘ)"];
  const OPTION_PREFIX_EN = ["(A)", "(B)", "(C)", "(D)"];

  return (
    <aside className="w-72 xl:w-80 shrink-0 hidden min-[1140px]:flex flex-col gap-4 sticky top-[185px] h-[calc(100vh-12.5rem)] overflow-y-auto overflow-x-hidden py-2 pr-1 pl-0.5 select-none">
      {/* 1. Daily Study Streak Card */}
      <div className={`shrink-0 p-3 sm:p-3.5 rounded-2xl shadow-2xs space-y-1.5 border transition-all ${
        isEnglishMode
          ? "bg-gradient-to-br from-blue-50 to-indigo-50/40 border-blue-200/80"
          : "bg-gradient-to-br from-amber-50 to-orange-50/40 border-amber-200/80"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Flame className={`w-4 h-4 ${isEnglishMode ? "text-blue-600 fill-blue-600" : "text-orange-500 fill-orange-500"}`} />
            <span className={isEnglishMode ? "text-blue-900" : "text-amber-900"}>
              {isEnglishMode ? "Daily English Streak" : "ডেইলি স্টাডি স্ট্রিক"}
            </span>
          </div>
          <span className={`text-xs font-black font-mono bg-white px-2 py-0.5 rounded-full border ${
            isEnglishMode
              ? "text-blue-700 border-blue-200"
              : "text-orange-600 border-orange-200"
          }`}>
            {streakDays} {isEnglishMode ? "Days!" : "দিন!"}
          </span>
        </div>
        <p className={`text-xs leading-relaxed font-sans ${
          isEnglishMode ? "text-blue-800/80" : "text-amber-800/80"
        }`}>
          {isEnglishMode
            ? "ধারাবাহিক রিডিংই শব্দভাণ্ডার ও ফ্লুয়েন্সির মূল চাবিকাঠি। প্রতিদিন অন্তত ২টি ইংরেজি সম্পাদকীয় পাঠ করুন।"
            : "ধারাবাহিকতা সাফল্যের মূল চাবিকাঠি। প্রতিদিন অন্তত ৩টি বিশ্লেষণ পাঠ সম্পন্ন করুন।"}
        </p>
      </div>

      {/* 2. Micro-Quiz of the Day Challenge */}
      <div id="tutorial-daily-quiz" className="shrink-0 p-3 sm:p-3.5 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-2.5 transition-all">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#f4efe4]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#842323]">
            {isEnglishMode ? (
              <>
                <BookOpen className="w-4 h-4 text-[#1e40af]" />
                <span className="text-[#1e40af]">ডেইলি ইংলিশ চ্যালেঞ্জ</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4 text-[#842323]" />
                <span>আজকের কুইজ চ্যালেঞ্জ</span>
              </>
            )}
          </div>
        </div>

        {/* Source Citation & Context Sentence Box */}
        {(activeQuiz.sourceName || activeQuiz.articleTitle || activeQuiz.contextQuote) && (
          <div className="p-2 bg-[#fbf9f5] border border-[#e2dcd0] rounded-xl space-y-1.5">
            {/* Source Newspaper Badge & Article Link */}
            <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-[#842323] uppercase tracking-wide text-xs bg-[#f0eae1] px-1.5 py-0.5 rounded border border-[#ded8cb] shrink-0 font-serif">
                  {cleanSourceName}
                </span>
                {activeQuiz.paragraphRef && (
                  <span className="text-xs text-[#717887] font-mono shrink-0">
                    {activeQuiz.paragraphRef}
                  </span>
                )}
              </div>
              {activeQuiz.articleSlug && (
                <Link
                  href={`/article/${activeQuiz.articleSlug}`}
                  className="text-xs text-[#1e40af] hover:text-[#1e3a8a] hover:underline font-semibold flex items-center gap-0.5 shrink-0 ml-auto group"
                  title="মূল প্রতিবেদনটি বিস্তারিত পড়ুন"
                >
                  <span>মূল প্রতিবেদন পড়ুন</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>

            {/* Context Line / Excerpt Quote */}
            {/* Shown only after answering, so a quoted sentence can never give the answer away */}
            {answered && activeQuiz.contextQuote && (
              <div className="text-xs text-[#404652] italic leading-relaxed border-l-2 border-[#842323]/60 pl-2 py-0.5 bg-white/70 rounded-r font-serif">
                <span className="text-[#717887] not-italic block text-xs font-semibold uppercase tracking-wider mb-0.5 font-sans">
                  সংশ্লিষ্ট বাক্য / অনুচ্ছেদ উদ্ধৃতি:
                </span>
                “{activeQuiz.contextQuote}”
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          {topicBadge && (
            <span className="inline-block px-1.5 py-0.5 rounded bg-[#f4efe4] text-[#842323] text-xs font-semibold border border-[#ded8cb]/80 uppercase tracking-wide">
              {topicBadge}
            </span>
          )}
          <p className="text-xs font-bold text-[#1c1d21] leading-relaxed break-words">
            {questionBody}
          </p>
        </div>

        <div className="space-y-1.5">
          {activeQuiz.options.map((opt, idx) => {
            let btnStyle = "bg-[#fbf9f5] border-[#ded8cb] hover:bg-[#f6f2e8] text-[#343a46]";
            if (answered) {
              if (idx === activeQuiz.correctOption) {
                btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold";
              } else if (selectedOpt === idx) {
                btnStyle = "bg-rose-50 border-rose-300 text-rose-900";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={answered}
                onClick={() => handleSelect(idx)}
                className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-start justify-between gap-2 overflow-hidden ${btnStyle}`}
              >
                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                  <span className="font-mono font-semibold text-[#717887] text-xs shrink-0 mt-0.5">
                    {isEnglishMode ? OPTION_PREFIX_EN[idx] || `(${idx + 1})` : OPTION_PREFIX_BN[idx] || `(${idx + 1})`}
                  </span>
                  <span className="flex-1 min-w-0 break-words leading-relaxed text-xs">{opt}</span>
                </div>
                {answered && idx === activeQuiz.correctOption && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {answered && selectedOpt === idx && idx !== activeQuiz.correctOption && (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="p-2.5 bg-[#faf8f4] border border-[#ded8cb] rounded-lg text-xs text-[#404652] leading-relaxed animate-fade-in">
            <span className="font-bold text-[#1c1d21]">ব্যাখ্যা: </span>
            {activeQuiz.explanation}
          </div>
        )}
      </div>

      {/* 3. Trending Topics & Hashtags (Interactive Search Filter) */}
      <div className="shrink-0 p-4 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1c1d21] pb-2 border-b border-[#f4efe4]">
          <TrendingUp className={`w-4 h-4 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
          <span>{isEnglishMode ? "Trending English Topics" : "আজকের ট্রেন্ডিং বিষয়বস্তু"}</span>
        </div>

        <div className="space-y-1">
          {activeHashtags.map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("khobor_open_search", {
                      detail: { query: h.query || h.tag.replace(/_/g, " ") },
                    })
                  );
                }
              }}
              className="w-full flex items-center justify-between text-xs hover:bg-[#faf8f4] hover:text-[#842323] p-1.5 rounded-lg transition text-left cursor-pointer group"
              title={`${h.tag} সম্পর্কিত প্রতিবেদন অনুসন্ধান করুন`}
            >
              <span className="font-semibold text-[#343a46] group-hover:text-[#842323] transition-colors">
                #{h.tag}
              </span>
              <span className="text-xs text-[#788191] font-mono group-hover:text-[#842323] transition-colors">
                {h.countLabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Eye-Care Reading Themes */}
      <div className="shrink-0 p-4 bg-white border border-[#ded8cb] rounded-2xl shadow-2xs space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#737b88] block">
          কাগজের আভা ও চোখের প্রশান্তি:
        </span>
        <ThemeSwitcher />
      </div>

      {/* 5. Copyright Notice */}
      <div 
        data-digital-signature="KK-RAIL-AUTH-2026"
        className="shrink-0 p-3 text-xs text-[#8e95a2] space-y-1 leading-relaxed font-sans"
      >
        <p>&copy; ২০২৬ খবরাখবর (KhoboraKhobor)</p>
        <p className="text-xs text-[#a0a8b5]">
          {isEnglishMode ? "Dual-Track Academic Edition" : "সর্বস্বত্ব সংরক্ষিত।"}
        </p>
      </div>

      {/* Pro Auth Gate Modal for Daily Quiz */}
      <ProAuthGateModal
        isOpen={isProGateOpen}
        onClose={() => setIsProGateOpen(false)}
        feature="quiz"
      />
    </aside>
  );
}
