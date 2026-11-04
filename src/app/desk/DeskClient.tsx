"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ingestArticleAction } from "@/actions/articles";
import { triggerSpiderCrawlAction } from "@/actions/scraper";
import { PlusCircle, FileText, CheckCircle2, Sparkles, HelpCircle, Bot, Loader2, Calendar, Database, Shield } from "lucide-react";

const CATEGORIES = [
  { name: "জাতীয় পরিক্রমা", slug: "national" },
  { name: "আন্তর্জাতিক সম্পর্ক", slug: "world" },
  { name: "অর্থনীতি ও ব্যাংকিং", slug: "economy" },
  { name: "বিজ্ঞান ও প্রযুক্তি", slug: "tech" },
  { name: "বিসিএস ও সাধারণ জ্ঞান", slug: "exam-prep" },
  { name: "সম্পাদকীয় ও কলাম", slug: "opinion" },
  { name: "রাজনীতি ও সুশাসন", slug: "politics" },
  { name: "খেলাধুলা", slug: "sports" },
  { name: "জীবনযাপন ও শিক্ষা", slug: "lifestyle" },
];

export default function DeskClient() {
  const todayStr = new Date().toISOString().split("T")[0];

  // Spider Crawl Controls
  const [crawlDate, setCrawlDate] = useState(todayStr);
  const [crawlLang, setCrawlLang] = useState<"all" | "bn" | "en">("all");
  const [spiderLoading, setSpiderLoading] = useState(false);

  // Manual Inputs
  const [title, setTitle] = useState("");
  const [categorySlug, setCategorySlug] = useState(CATEGORIES[0].slug);
  const [summary, setSummary] = useState("");
  const [keyTakeaways, setKeyTakeaways] = useState("");
  const [examTags, setExamTags] = useState("বিসিএস, বিশ্ববিদ্যালয় ভর্তি, অর্থনীতি");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sourceName, setSourceName] = useState("প্রথম আলো");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isCapsule, setIsCapsule] = useState(true);
  const [isLead, setIsLead] = useState(false);

  // Vocabulary Inputs
  const [vocabTerm, setVocabTerm] = useState("");
  const [vocabDef, setVocabDef] = useState("");

  // Quiz Inputs
  const [quizQuestion, setQuizQuestion] = useState("");
  const [opt0, setOpt0] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [correctOption, setCorrectOption] = useState("0");
  const [quizExplanation, setQuizExplanation] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleTriggerSpider = async () => {
    setSpiderLoading(true);
    try {
      const res = await triggerSpiderCrawlAction({
        targetDate: crawlDate,
        language: crawlLang,
      });
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setSuccessMsg(res.message); setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err: any) {
      setSuccessMsg(err.message || "সংবাদ সংকলনে সমস্যা দেখা দিয়েছে।"); setTimeout(() => setSuccessMsg(""), 5000);
    } finally {
      setSpiderLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("categorySlug", categorySlug);
      formData.append("summary", summary);
      formData.append("keyTakeaways", keyTakeaways);
      formData.append("examTags", examTags);
      formData.append("content", content);
      formData.append("imageUrl", imageUrl);
      formData.append("sourceName", sourceName);
      formData.append("sourceUrl", sourceUrl);
      formData.append("isCapsule", String(isCapsule));
      formData.append("isLead", String(isLead));

      formData.append("vocabTerm", vocabTerm);
      formData.append("vocabDef", vocabDef);

      formData.append("quizQuestion", quizQuestion);
      formData.append("opt0", opt0);
      formData.append("opt1", opt1);
      formData.append("opt2", opt2);
      formData.append("opt3", opt3);
      formData.append("correctOption", correctOption);
      formData.append("quizExplanation", quizExplanation);

      await ingestArticleAction(formData);

      setTitle("");
      setSummary("");
      setKeyTakeaways("");
      setContent("");
      setImageUrl("");
      setVocabTerm("");
      setVocabDef("");
      setQuizQuestion("");
      setOpt0("");
      setOpt1("");
      setOpt2("");
      setOpt3("");
      setQuizExplanation("");
      setSuccessMsg("শিক্ষামূলক প্রতিবেদন ও কুইজ সফলভাবে ডেটাবেজে সংরক্ষিত হয়েছে।");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setSuccessMsg(err.message || "সংরক্ষণ করতে সমস্যা হয়েছে।"); setTimeout(() => setSuccessMsg(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-8 w-full">
        {/* Header Title */}
        <div className="pb-6 border-b border-[#ded8cb] mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#17191d] font-serif">
              সম্পাদকীয় ডেস্ক ও সংবাদ সংকলন
            </h1>
            <p className="text-xs sm:text-sm text-[#646c7a] mt-1">
              সংযুক্ত সংবাদ মাধ্যম থেকে নির্দিষ্ট তারিখের সমসাময়িক সংবাদ সংগ্রহ করুন অথবা সরাসরি প্রতিবেদন তৈরি করুন
            </p>
          </div>
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-[#17191d] hover:bg-[#282d37] text-white text-xs font-semibold rounded-lg transition shadow-2xs flex items-center gap-2"
          >
            <Shield className="w-3.5 h-3.5 text-[#f5c66b]" />
            <span>স্পাইডার অ্যাডমিন প্যানেল</span>
          </Link>
        </div>

        {/* Section: Automated News Curation Panel */}
        <div className="p-6 bg-white border border-[#ded8cb] rounded-xl shadow-2xs mb-8 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ece7dc] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#842323]" />
              <h2 className="text-base font-bold text-[#1c1d21] font-serif">
                স্বয়ংক্রিয় সংবাদ সংকলন ও বিশ্লেষণ (Automated News Curation)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[#842323] bg-[#f5ebeb] px-2.5 py-0.5 rounded border border-[#e5c9c9]">
              সংবাদ মাধ্যম সংযুক্ত (Active Sources)
            </span>
          </div>

          <p className="text-xs text-[#525964] leading-relaxed">
            সংযুক্ত শীর্ষস্থানীয় জাতীয় ও আন্তর্জাতিক সংবাদমাধ্যম থেকে নির্বাচিত তারিখ অনুযায়ী গুরুত্বপূর্ণ সংবাদ সংকলন করে শিক্ষার্থীদের জন্য মূল শিক্ষণীয় বিষয়, পারিভাষিক শব্দ ও মূল্যায়ন কুইজ প্রস্তুত করুন।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-[#454c59] mb-1">
                সংবাদের তারিখ (Target Date)
              </label>
              <input
                type="date"
                value={crawlDate}
                onChange={(e) => setCrawlDate(e.target.value)}
                className="w-full text-xs p-2 bg-[#faf8f4] border border-[#dcd7cb] rounded font-mono font-bold outline-none focus:border-[#842323]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#454c59] mb-1">
                সংবাদ মাধ্যমের ভাষা
              </label>
              <select
                value={crawlLang}
                onChange={(e) => setCrawlLang(e.target.value as any)}
                className="w-full text-xs p-2 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
              >
                <option value="all">উভয় মাধ্যম (বাংলা ও ইংরেজি)</option>
                <option value="bn">শুধুমাত্র বাংলা সংবাদমাধ্যম</option>
                <option value="en">শুধুমাত্র ইংরেজি সংবাদমাধ্যম</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleTriggerSpider}
                disabled={spiderLoading}
                className="w-full py-2 px-3 bg-[#1f2733] hover:bg-[#151a22] text-white text-xs font-bold rounded transition shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {spiderLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f5c66b]" />
                    <span>সংবাদ সংকলন ও বিশ্লেষণ চলছে...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#f5c66b]" />
                    <span>সংবাদ সংকলন শুরু করুন (Fetch News)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-3.5 bg-[#edf7ed] border border-[#c8e6c9] text-[#1e4620] rounded-md text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2e744a] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section: Manual Ingestion Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 bg-white border border-[#e3ded4] rounded-lg shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-[#1c1d21] flex items-center gap-2 font-serif border-b border-[#eee9df] pb-3">
              <FileText className="w-4 h-4 text-[#842323]" />
              ম্যানুয়াল প্রতিবেদন রচনা ও সম্পাদন
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#454c59] mb-1">
                শিরোনাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: বৈদেশিক মুদ্রার রিজার্ভ ও কেন্দ্রীয় ব্যাংকের নতুন সিদ্ধান্ত..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#454c59] mb-1">
                  বিভাগ
                </label>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#454c59] mb-1">
                  পরীক্ষা ট্র্যাক ট্যাগ
                </label>
                <input
                  type="text"
                  placeholder="বিসিএস, বিশ্ববিদ্যালয় ভর্তি, অর্থনীতি"
                  value={examTags}
                  onChange={(e) => setExamTags(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#454c59] mb-1">
                  সংবাদ উৎস / পত্রিকার নাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: প্রথম আলো, The Daily Star"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#454c59] mb-1">
                  সংবাদপত্রের বিস্তারিত প্রতিবেদন লিংক (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://www.prothomalo.com/bangladesh/..."
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#454c59] mb-1">
                সারসংক্ষেপ *
              </label>
              <textarea
                required
                rows={2}
                placeholder="প্রতিবেদনের মূল সারসংক্ষেপ..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#454c59] mb-1">
                শিক্ষার্থীদের জন্য শিক্ষণীয় মূলবিন্দু (প্রতি লাইনে একটি)
              </label>
              <textarea
                rows={3}
                placeholder="রিজার্ভের লক্ষ্যমাত্রা ও রেপো রেটের প্রভাব&#10;আমদানি নীতিমালায় নতুন শুল্ক ছাড়"
                value={keyTakeaways}
                onChange={(e) => setKeyTakeaways(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#454c59] mb-1">
                বিস্তারিত প্রতিবেদন (প্যারাগ্রাফ)
              </label>
              <textarea
                rows={5}
                placeholder="প্রতিবেদনের সম্পূর্ণ বিবরণ..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#454c59] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCapsule}
                  onChange={(e) => setIsCapsule(e.target.checked)}
                  className="w-4 h-4 text-[#842323] rounded"
                />
                <span>দৈনিক ৫-মিনিট ক্যাপসুলে অন্তর্ভুক্ত করুন</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-[#454c59] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLead}
                  onChange={(e) => setIsLead(e.target.checked)}
                  className="w-4 h-4 text-[#842323] rounded"
                />
                <span>প্রধান লিড প্রতিবেদন হিসেবে রাখুন</span>
              </label>
            </div>
          </div>

          {/* Section 2: Vocabulary Term (Optional) */}
          <div className="p-6 bg-white border border-[#e3ded4] rounded-lg shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-[#1c1d21] flex items-center gap-2 font-serif border-b border-[#eee9df] pb-3">
              <Sparkles className="w-4 h-4 text-[#c29547]" />
              শিক্ষণীয় পারিভাষিক শব্দ (ঐচ্ছিক)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#454c59] mb-1">
                  পারিভাষিক শব্দ
                </label>
                <input
                  type="text"
                  placeholder="যেমন: সার্বভৌম ঋণ (Sovereign Debt)"
                  value={vocabTerm}
                  onChange={(e) => setVocabTerm(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#454c59] mb-1">
                  সহজ ভাষায় সংজ্ঞা বা ব্যাখ্যা
                </label>
                <input
                  type="text"
                  placeholder="কোনো দেশের সরকার কর্তৃক আন্তর্জাতিক বাজার থেকে গৃহীত ঋণ..."
                  value={vocabDef}
                  onChange={(e) => setVocabDef(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Comprehension Micro-Quiz (Optional) */}
          <div className="p-6 bg-white border border-[#e3ded4] rounded-lg shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-[#1c1d21] flex items-center gap-2 font-serif border-b border-[#eee9df] pb-3">
              <HelpCircle className="w-4 h-4 text-[#842323]" />
              পঠন মূল্যায়ন কুইজ (ঐচ্ছিক)
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#454c59] mb-1">
                কুইজ প্রশ্ন
              </label>
              <input
                type="text"
                placeholder="যেমন: কোন সংস্থা সম্প্রতি অর্থনৈতিক প্রবৃদ্ধির পূর্বাভাস প্রকাশ করেছে?"
                value={quizQuestion}
                onChange={(e) => setQuizQuestion(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-[#faf8f4] border border-[#dcd7cb] rounded outline-none focus:border-[#842323]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#68707f] mb-1">
                  অপশন ১
                </label>
                <input
                  type="text"
                  placeholder="বিকল্প ক"
                  value={opt0}
                  onChange={(e) => setOpt0(e.target.value)}
                  className="w-full text-xs p-2 bg-[#faf8f4] border border-[#dcd7cb] rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#68707f] mb-1">
                  অপশন ২
                </label>
                <input
                  type="text"
                  placeholder="বিকল্প খ"
                  value={opt1}
                  onChange={(e) => setOpt1(e.target.value)}
                  className="w-full text-xs p-2 bg-[#faf8f4] border border-[#dcd7cb] rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#68707f] mb-1">
                  অপশন ৩
                </label>
                <input
                  type="text"
                  placeholder="বিকল্প গ"
                  value={opt2}
                  onChange={(e) => setOpt2(e.target.value)}
                  className="w-full text-xs p-2 bg-[#faf8f4] border border-[#dcd7cb] rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#68707f] mb-1">
                  অপশন ৪
                </label>
                <input
                  type="text"
                  placeholder="বিকল্প ঘ"
                  value={opt3}
                  onChange={(e) => setOpt3(e.target.value)}
                  className="w-full text-xs p-2 bg-[#faf8f4] border border-[#dcd7cb] rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#454c59] mb-1">
                  সঠিক অপশন নির্বাচন করুন
                </label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 bg-[#faf8f4] border border-[#dcd7cb] rounded"
                >
                  <option value="0">অপশন ১ (ক)</option>
                  <option value="1">অপশন ২ (খ)</option>
                  <option value="2">অপশন ৩ (গ)</option>
                  <option value="3">অপশন ৪ (ঘ)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#454c59] mb-1">
                  সংক্ষিপ্ত ব্যাখ্যা
                </label>
                <input
                  type="text"
                  placeholder="কেন এটি সঠিক উত্তর..."
                  value={quizExplanation}
                  onChange={(e) => setQuizExplanation(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2 bg-[#faf8f4] border border-[#dcd7cb] rounded"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#842323] hover:bg-[#6e1c1c] text-white font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>
              {loading ? "সংরক্ষণ হচ্ছে..." : "স্টুডেন্ট প্ল্যাটফর্মে প্রকাশ করুন"}
            </span>
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
