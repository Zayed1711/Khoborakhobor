"use client";

import { useState } from "react";
import Link from "next/link";
import {
  toggleWordMasteredAction,
  resetWordBankProgressAction,
  updateStudentProfileAction,
  deleteStudyNoteAction,
} from "@/actions/student";
import { logoutAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useAppMode } from "@/context/LanguageContext";
import { getBanglaPronunciation } from "@/lib/phonetics/en-to-bn";
import {
  Bookmark,
  Highlighter,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  RotateCw,
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  ArrowRight,
  Flame,
  Trash2,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  Edit3,
  Layers,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Award,
  UserCheck,
  Volume2,
} from "lucide-react";

interface StudentHubViewProps {
  student: any;
  notes: any[];
  savedWords: any[];
  quizAnalytics: {
    totalAttempts: number;
    correctAttempts: number;
    accuracyPercent: number;
    categoryBreakdown: { name: string; total: number; correct: number; percent: number }[];
    mistakes: any[];
  };
}

export default function StudentHubView({
  student,
  notes,
  savedWords,
  quizAnalytics,
}: StudentHubViewProps) {
  const router = useRouter();
  const { mode, isEnglishMode } = useAppMode();
  const [activeTab, setActiveTab] = useState<"notes" | "flashcards" | "analytics" | "profile">(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam === "flashcards" || tabParam === "notes" || tabParam === "analytics" || tabParam === "profile") {
        return tabParam;
      }
    }
    return isEnglishMode ? "flashcards" : "notes";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  // Flashcard & Word Bank State
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [localWords, setLocalWords] = useState(savedWords);
  const [wordFilter, setWordFilter] = useState<"all" | "learning" | "mastered">("all");
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  const handleSpeak = (word: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    setSpeakingWord(word);
    utterance.onend = () => setSpeakingWord(null);
    utterance.onerror = () => setSpeakingWord(null);
    window.speechSynthesis.speak(utterance);
  };

  const displayedWords = localWords.filter((w) => {
    if (wordFilter === "learning") return !w.mastered;
    if (wordFilter === "mastered") return w.mastered;
    return true;
  });

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(student.name);
  const [trackInput, setTrackInput] = useState(student.targetTrack);
  const [instInput, setInstInput] = useState(student.institution || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Mastered Words Count
  const masteredCount = localWords.filter((w) => w.mastered).length;

  // Dedicated Category Pipeline Breakdown
  const categoryMap = new Map<string, number>();
  notes.forEach((note) => {
    const name = note.article?.category?.name || "সাধারণ বিষয়";
    categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
  });
  const categoriesWithCounts: [string, number][] = Array.from(categoryMap.entries());

  const filteredNotes =
    selectedCategory === "all"
      ? notes
      : notes.filter((n) => (n.article?.category?.name || "সাধারণ বিষয়") === selectedCategory);

  // 1. Export as Markdown (.md) with Category Pipeline Grouping
  const handleDownloadMarkdown = () => {
    let md = `# খবরাখবর — শিক্ষার্থী স্টাডি নোটবুক ও রিভিশন শিট\n`;
    md += `**শিক্ষার্থী:** ${student.name} | **প্রতিষ্ঠান:** ${student.institution || "সাধারণ শিক্ষার্থী"} | **ট্র্যাক:** ${student.targetTrack}\n`;
    md += `**তারিখ:** ${new Date().toLocaleDateString("bn-BD")} | **স্টাডি স্ট্রিক:** ${student.streakDays} দিন\n\n`;
    md += `---\n\n`;

    // Group notes by Category Pipeline
    const notesByCategory = new Map<string, any[]>();
    notes.forEach((n) => {
      const cat = n.article?.category?.name || "সাধারণ বিষয়";
      if (!notesByCategory.has(cat)) notesByCategory.set(cat, []);
      notesByCategory.get(cat)!.push(n);
    });

    md += `## ১. বিষয়ভিত্তিক গুরুত্বপূর্ণ পঠন নোট ও উদ্ধৃতি (${notes.length} টি)\n\n`;
    if (notes.length === 0) {
      md += `*কোনো নোট সংরক্ষিত নেই।*\n\n`;
    } else {
      notesByCategory.forEach((catNotes, catName) => {
        md += `### ■ বিষয় ক্যাটাগরি: ${catName} (${catNotes.length} টি)\n\n`;
        catNotes.forEach((note, i) => {
          md += `#### ${i + 1}. ${note.article.title}\n`;
          md += `> "${note.quoteText}"\n\n`;
          if (note.memo) {
            md += `**ব্যক্তিগত ব্যাখ্যা/মন্তব্য:** ${note.memo}\n\n`;
          }
          md += `*তারিখ: ${new Date(note.createdAt).toLocaleDateString("bn-BD")}*\n\n`;
        });
      });
    }

    // Group vocabulary by Category Pipeline
    const wordsByCategory = new Map<string, any[]>();
    savedWords.forEach((item) => {
      const cat = item.term?.article?.category?.name || "সাধারণ জ্ঞান";
      if (!wordsByCategory.has(cat)) wordsByCategory.set(cat, []);
      wordsByCategory.get(cat)!.push(item);
    });

    md += `## ২. বিষয়ভিত্তিক পারিভাষিক শব্দকোষ ও ওয়ার্ড ব্যাংক (${savedWords.length} টি)\n\n`;
    if (savedWords.length === 0) {
      md += `*কোনো শব্দ সংরক্ষিত নেই।*\n\n`;
    } else {
      wordsByCategory.forEach((catWords, catName) => {
        md += `### ■ বিষয় ক্যাটাগরি: ${catName} (${catWords.length} টি)\n\n`;
        catWords.forEach((item, i) => {
          md += `#### ${i + 1}. ${item.term.term}\n`;
          md += `**সংজ্ঞা/ব্যাখ্যা:** ${item.term.definition}\n`;
          if (item.term.context) {
            md += `**প্রাসঙ্গিক প্রয়োগ:** ${item.term.context}\n`;
          }
          md += `*উৎস প্রতিবেদন:* ${item.term.article?.title || "সাধারণ"}\n\n`;
        });
      });
    }

    md += `---\n\n`;
    md += `<!-- KK-AUTH-SIGNATURE: ${student.id.slice(0, 8)} -->\n`;
    md += `*কপিরাইট © ২০২৬ খবরাখবর (KhoboraKhobor)*\n`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KhoboraKhobor_StudyNotebook_${student.name.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Browser Print / PDF Sheet
  const handlePrint = () => {
    window.print();
  };

  // 3. Copy summary text
  const handleCopyClipboard = () => {
    let text = `খবরাখবর স্টাডি নোটবুক — ${student.name} (${student.targetTrack})\n\n`;
    notes.forEach((n, i) => {
      text += `${i + 1}. [${n.article.title}]\n"${n.quoteText}"\n${n.memo ? `নোট: ${n.memo}\n` : ""}\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Flashcard Actions
  const handleMasterCard = async (savedWordId: string) => {
    setLocalWords((prev) =>
      prev.map((w) => (w.id === savedWordId ? { ...w, mastered: true } : w))
    );
    await toggleWordMasteredAction(savedWordId, true);
    setIsCardFlipped(false);
    if (currentCardIndex < localWords.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handleReviewAgain = async (savedWordId: string) => {
    setLocalWords((prev) =>
      prev.map((w) => (w.id === savedWordId ? { ...w, mastered: false } : w))
    );
    await toggleWordMasteredAction(savedWordId, false);
    setIsCardFlipped(false);
    if (currentCardIndex < localWords.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handleResetProgress = async () => {
    if (!confirm("আপনি কি সমস্ত শব্দের মুখস্থ স্ট্যাটাস রিসেট করে প্রথম থেকে শুরু করতে চান?")) return;
    setLocalWords((prev) => prev.map((w) => ({ ...w, mastered: false })));
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    await resetWordBankProgressAction(student.id);
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
    router.refresh();
  };

  // Save Profile Edit
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateStudentProfileAction(student.id, {
        name: nameInput,
        targetTrack: trackInput,
        institution: instInput,
      });
      setIsEditingProfile(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "প্রোফাইল আপডেট করতে সমস্যা হয়েছে।");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    if (!confirm("নোটটি মুছে ফেলতে চান?")) return;
    await deleteStudyNoteAction(id);
    window.location.reload();
  };

  const currentFlashcard = localWords[currentCardIndex];

  return (
    <div
      data-digital-signature={`KK-AUTH-SHA256-${student.id}`}
      className="space-y-8"
    >
      {/* Top Banner: Student Identity & Live Streak */}
      <div className="p-6 bg-white border border-[#ded8cb] rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-6 print:border-none print:p-0">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#842323] text-white flex items-center justify-center font-serif text-xl font-black shadow-sm shrink-0">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#17191d] font-serif">
                {student.name}
              </h1>
              {isEnglishMode ? (
                <span className="text-[11px] bg-[#f0f9ff] text-[#0284c7] font-bold px-2.5 py-0.5 rounded-full border border-[#bae6fd] flex items-center gap-1">
                  🇬🇧 English Learning Track (IELTS & Vocabulary)
                </span>
              ) : (
                <span className="text-[11px] bg-[#f5ebeb] text-[#842323] font-bold px-2.5 py-0.5 rounded-full border border-[#e5c9c9]">
                  {student.targetTrack === "BCS_GOVT"
                    ? "বিসিএস ও সরকারি চাকরি প্রস্তুতি"
                    : student.targetTrack === "ADMISSION"
                    ? "বিশ্ববিদ্যালয় ভর্তি পরীক্ষা"
                    : "অর্থনীতি ও আন্তর্জাতিক পলিসি গবেষণা"}
                </span>
              )}
            </div>
            <p className="text-xs text-[#525964] mt-1">
              শিক্ষা প্রতিষ্ঠান: <strong>{student.institution || "সাধারণ শিক্ষার্থী"}</strong> &bull; ইমেইল: {student.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 no-print">
          <div className="bg-[#fbf9f5] border border-[#e5dfd2] px-3.5 py-2 rounded-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#f59e0b] fill-current animate-pulse" />
            <div>
              <span className="text-[10px] text-[#717887] font-semibold block uppercase">
                স্টাডি স্ট্রিক
              </span>
              <span className="text-sm font-bold text-[#1c1d21]">
                {student.streakDays} দিন একনাগাড়ে
              </span>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("profile")}
            className="px-3 py-2 text-xs font-semibold text-[#454c59] bg-[#f5f1e8] hover:bg-[#eae3d5] rounded-lg border border-[#ded5c5] transition flex items-center gap-1.5"
            title="প্রোফাইল পরিবর্তন"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#842323]" />
            <span className="hidden sm:inline">প্রোফাইল সেটিংস</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-b border-[#ded8cb] flex items-center gap-2 overflow-x-auto pb-px text-xs font-semibold no-print">
        <button
          onClick={() => setActiveTab("flashcards")}
          className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 ${
            activeTab === "flashcards"
              ? isEnglishMode
                ? "bg-white text-[#0284c7] border-[#0284c7] shadow-2xs font-bold"
                : "bg-white text-[#842323] border-[#842323] shadow-2xs font-bold"
              : "text-[#646c7a] hover:text-[#17191d] border-transparent"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isEnglishMode ? "text-[#0284c7]" : "text-[#c29547]"}`} />
          <span>{isEnglishMode ? "Word Bank & Flashcards" : "ওয়ার্ড ব্যাংক ও ফ্ল্যাশকার্ড"} ({localWords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 ${
            activeTab === "notes"
              ? isEnglishMode
                ? "bg-white text-[#0284c7] border-[#0284c7] shadow-2xs font-bold"
                : "bg-white text-[#842323] border-[#842323] shadow-2xs font-bold"
              : "text-[#646c7a] hover:text-[#17191d] border-transparent"
          }`}
        >
          <Highlighter className="w-4 h-4" />
          <span>{isEnglishMode ? "সংরক্ষিত স্টাডি নোট ও কোটস" : "সংরক্ষিত উদ্ধৃতি ও স্টাডি নোট"} ({notes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 ${
            activeTab === "analytics"
              ? isEnglishMode
                ? "bg-white text-[#0284c7] border-[#0284c7] shadow-2xs font-bold"
                : "bg-white text-[#842323] border-[#842323] shadow-2xs font-bold"
              : "text-[#646c7a] hover:text-[#17191d] border-transparent"
          }`}
        >
          <Trophy className={`w-4 h-4 ${isEnglishMode ? "text-[#0284c7]" : "text-[#842323]"}`} />
          <span>{isEnglishMode ? "Comprehension & Quiz Analytics" : "কুইজ স্কোরকার্ড ও ভুল বিশ্লেষণ"} ({quizAnalytics.totalAttempts})</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 ${
            activeTab === "profile"
              ? isEnglishMode
                ? "bg-white text-[#0284c7] border-[#0284c7] shadow-2xs font-bold"
                : "bg-white text-[#842323] border-[#842323] shadow-2xs font-bold"
              : "text-[#646c7a] hover:text-[#17191d] border-transparent"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{isEnglishMode ? "লার্নিং ট্র্যাক ও প্রোফাইল" : "পরীক্ষা ট্র্যাক ও প্রোফাইল সুইচার"}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: STUDY NOTES & QUOTES (WITH EXPORT SUITE) */}
      {/* ======================================================== */}
      {activeTab === "notes" && (
        <div className="space-y-6">
          {/* Export Action Suite Bar */}
          <div className="p-4 bg-[#fbf9f5] border border-[#e5dfd2] rounded-xl flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-[#842323]" />
              <span className="text-xs font-bold text-[#1c1d21]">
                রিভিশন এক্সপোর্ট টুলস:
              </span>
              <span className="text-xs text-[#717887] hidden sm:inline">
                পরীক্ষার আগে সহজে পড়ার জন্য আপনার নোটগুলো ডাউনলোড করুন
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadMarkdown}
                className="px-3 py-1.5 bg-white hover:bg-[#f6f2e9] text-[#1c1d21] text-xs font-semibold rounded border border-[#ded8cb] transition flex items-center gap-1.5 shadow-2xs"
                title="Markdown ফাইল হিসেবে সংরক্ষণ করুন"
              >
                <Download className="w-3.5 h-3.5 text-[#842323]" />
                <span>Markdown (.md)</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-bold rounded transition flex items-center gap-1.5 shadow-xs"
                title="প্রিন্ট বা PDF হিসেবে সংরক্ষণ করুন"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট / PDF ডাউনলোড</span>
              </button>

              <button
                onClick={handleCopyClipboard}
                className="px-2.5 py-1.5 bg-white hover:bg-[#f6f2e9] text-[#505764] hover:text-[#1c1d21] text-xs rounded border border-[#ded8cb] transition flex items-center gap-1"
                title="ক্লিপবোর্ডে কপি করুন"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{copied ? "কপি হয়েছে" : "কপি"}</span>
              </button>
            </div>
          </div>

          {/* Category Pipeline Filter Bar */}
          {categoriesWithCounts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs no-print border-b border-[#e5dfd2]">
              <span className="text-[11px] font-bold text-[#717887] shrink-0 mr-1">
                বিষয়ভিত্তিক পাইপলাইন:
              </span>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  selectedCategory === "all"
                    ? "bg-[#842323] text-white shadow-xs font-bold"
                    : "bg-white text-[#525964] border border-[#ded8cb] hover:bg-[#f6f2e9]"
                }`}
              >
                সকল বিষয় ({notes.length})
              </button>
              {categoriesWithCounts.map(([catName, count]) => (
                <button
                  key={catName}
                  onClick={() => setSelectedCategory(catName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                    selectedCategory === catName
                      ? "bg-[#842323] text-white shadow-xs font-bold"
                      : "bg-white text-[#525964] border border-[#ded8cb] hover:bg-[#f6f2e9]"
                  }`}
                >
                  {catName} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Notes List */}
          {filteredNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map((note) => {
                const isSummary = note.memo?.includes("[সারসংক্ষেপ অনুশীলন]");
                const isYellow = note.memo?.includes("[হলুদ মার্কার]");
                const isGreen = note.memo?.includes("[সবুজ মার্কার]");
                const isPurple = note.memo?.includes("[বেগুনি মার্কার]");

                return (
                  <div
                    key={note.id}
                    className="p-5 bg-white border border-[#e4ded3] rounded-xl shadow-2xs flex flex-col justify-between hover:border-[#cfc7b7] transition group"
                  >
                    <div>
                      {/* Note Category & Tag Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-[#842323] bg-[#f5ebeb] px-2 py-0.5 rounded border border-[#ebd0d0]">
                            {note.article?.category?.name || "সাধারণ বিষয়"}
                          </span>
                          {isSummary && (
                            <span className="text-[10px] font-semibold text-[#1f2733] bg-[#ece8dd] px-2 py-0.5 rounded">
                              সারসংক্ষেপ অনুশীলন
                            </span>
                          )}
                          {isYellow && (
                            <span className="text-[10px] font-semibold text-[#854d0e] bg-[#fef08a] px-2 py-0.5 rounded">
                              হলুদ মার্কার
                            </span>
                          )}
                          {isGreen && (
                            <span className="text-[10px] font-semibold text-[#166534] bg-[#bbf7d0] px-2 py-0.5 rounded">
                              সবুজ মার্কার
                            </span>
                          )}
                          {isPurple && (
                            <span className="text-[10px] font-semibold text-[#6b21a8] bg-[#e9d5ff] px-2 py-0.5 rounded">
                              বেগুনি মার্কার
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#a0a8b5] hover:text-red-600 transition no-print"
                          title="নোট মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <Link
                        href={`/article/${note.article.slug}`}
                        className="text-xs font-bold text-[#1c1d21] hover:text-[#842323] hover:underline flex items-center gap-1 line-clamp-1 mb-2.5"
                      >
                        <span>{note.article.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-[#88909d]" />
                      </Link>

                      <blockquote className="text-xs font-serif italic text-[#262930] leading-relaxed bg-[#fbf9f5] p-3 rounded-lg border-l-3 border-[#842323]">
                        &ldquo;{note.quoteText}&rdquo;
                      </blockquote>

                      {note.memo && !isSummary && !isYellow && !isGreen && !isPurple && (
                        <div className="mt-2.5 p-2 bg-[#f6f2e9] rounded text-xs text-[#404652] flex items-start gap-1.5">
                          <Edit3 className="w-3 h-3 text-[#842323] shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-[#1c1d21] block text-[11px]">শিক্ষার্থীর নিজস্ব নোট:</strong>
                            <span>{note.memo}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-[#f2ede4] flex items-center justify-between text-[11px] text-[#8e95a2]">
                      <span>সংরক্ষণ: {new Date(note.createdAt).toLocaleDateString("bn-BD")}</span>
                      <Link
                        href={`/article/${note.article.slug}`}
                        className="text-[#842323] font-semibold hover:underline no-print"
                      >
                        মূল প্রতিবেদন →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-[#e4ded3] text-xs text-[#717887] space-y-2">
              <Highlighter className="w-8 h-8 text-[#d5cfc4] mx-auto" />
              <p className="font-bold text-[#2a2d34] text-sm">আপনার নোটবুকে এখনও কোনো উদ্ধৃতি বা নোট নেই</p>
              <p className="text-[11px] text-[#8e95a2] max-w-md mx-auto">
                যেকোনো সংবাদ পড়ার সময় গুরুত্বপূর্ণ প্যারাগ্রাফ বা বাক্য মাউস দিয়ে হাইলাইট করলে স্বয়ংক্রিয়ভাবে ক্লাউড নোটবুকে সেভ করার অপশন আসবে।
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#842323] text-white font-bold rounded-lg text-xs"
                >
                  <span>আজকের সংবাদ পড়ুন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: VOCABULARY WORD BANK & 3D FLASHCARDS */}
      {/* ======================================================== */}
      {activeTab === "flashcards" && (
        <div className="space-y-6">
          {/* Header Controls for Flashcards */}
          <div className="p-4 bg-white border border-[#ded8cb] rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1c1d21] font-serif">
                  পারিভাষিক শব্দকোষ ও ফ্ল্যাশকার্ড ডেক
                </h2>
                <span className="text-xs bg-[#fdf5e6] text-[#b45309] font-bold px-2 py-0.5 rounded border border-[#fde68a]">
                  {masteredCount} / {localWords.length} টি মুখস্থ হয়েছে
                </span>
              </div>
              <p className="text-xs text-[#646c7a] mt-0.5">
                বিসিএস, ব্যাংক ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার প্রস্তুতিতে অ্যাক্টিভ রিকল দিয়ে শব্দ মুখস্থ করুন
              </p>
            </div>

            <div className="flex items-center gap-2">
              {localWords.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      setIsFlashcardMode(!isFlashcardMode);
                      setIsCardFlipped(false);
                    }}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 shadow-xs ${
                      isFlashcardMode
                        ? "bg-[#17191d] text-white"
                        : "bg-[#842323] hover:bg-[#6e1c1c] text-white"
                    }`}
                  >
                    <Layers className="w-4 h-4 text-[#f5c66b]" />
                    <span>{isFlashcardMode ? "তালিকা ভিউতে ফিরুন" : "ফ্ল্যাশকার্ড প্র্যাকটিস শুরু করুন"}</span>
                  </button>

                  <button
                    onClick={handleResetProgress}
                    className="p-2 text-[#788191] hover:text-[#842323] bg-[#fbf9f5] hover:bg-[#f6f2e9] border border-[#ded8cb] rounded-lg transition"
                    title="প্রোগ্রেস রিসেট করুন"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Interactive Flashcard Card Mode */}
          {isFlashcardMode && localWords.length > 0 && (
            <div className="max-w-xl mx-auto space-y-4">
              {/* Progress bar */}
              <div className="flex items-center justify-between text-xs text-[#717887]">
                <span>শব্দ নং: {currentCardIndex + 1} / {localWords.length}</span>
                <span>অগ্রগতি: {Math.round((masteredCount / localWords.length) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-[#e5dfd2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#c29547] to-[#842323] transition-all duration-300"
                  style={{ width: `${((currentCardIndex + 1) / localWords.length) * 100}%` }}
                />
              </div>

              {/* The 3D Flashcard */}
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="min-h-[260px] p-8 bg-white border-2 border-[#ded8cb] hover:border-[#842323] rounded-2xl shadow-sm cursor-pointer transition flex flex-col justify-between text-center select-none relative group"
              >
                <div className="flex items-center justify-between text-[11px] text-[#8e95a2]">
                  <span className="font-bold text-[#842323] uppercase tracking-wider">
                    {isCardFlipped ? "সংজ্ঞা ও অর্থ (পিছনের অংশ)" : "ধারণাগত শব্দ (সামনের অংশ)"}
                  </span>
                  <span className="text-[10px] bg-[#f6f2e9] px-2 py-0.5 rounded text-[#505764]">
                    ক্লিক করে ফ্লিপ করুন
                  </span>
                </div>

                <div className="py-6 space-y-3">
                  {!isCardFlipped ? (
                    <div>
                      <div className="flex items-center justify-center gap-3">
                        <h3 className="text-2xl sm:text-3xl font-black font-serif text-[#17191d] tracking-wide">
                          {currentFlashcard.term.term}
                        </h3>
                        {isEnglishMode && (
                          <button
                            type="button"
                            onClick={(e) => handleSpeak(currentFlashcard.term.term, e)}
                            className={`p-2 rounded-full transition ${
                              speakingWord === currentFlashcard.term.term
                                ? "bg-[#38bdf8] text-[#0f172a]"
                                : "bg-[#f0f9ff] text-[#0284c7] hover:bg-[#e0f2fe]"
                            }`}
                            title="উচ্চারণ শুনুন (Pronunciation)"
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      {isEnglishMode && (
                        <div className="text-sm font-semibold text-[#c29547] mt-1">
                          [{getBanglaPronunciation(currentFlashcard.term.term)}]
                        </div>
                      )}
                      {currentFlashcard.term.context && (
                        <p className="text-xs text-[#646c7a] italic mt-3 max-w-md mx-auto bg-[#faf8f4] p-2.5 rounded-lg border border-[#e5dfd2]">
                          &ldquo;{currentFlashcard.term.context}&rdquo;
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2 max-w-md mx-auto">
                        <p className="text-base sm:text-lg font-serif font-medium text-[#1c1d21] leading-relaxed">
                          {currentFlashcard.term.definition}
                        </p>
                        {isEnglishMode && currentFlashcard.term.context && (
                          <div className="text-xs text-[#0369a1] bg-[#f0f9ff] p-2 rounded border border-[#bae6fd] mt-2 text-left">
                            <span className="font-semibold block text-[10px] text-[#0284c7] uppercase">বাস্তব প্রয়োগের উদাহরণ:</span>
                            {currentFlashcard.term.context}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-[#842323] font-semibold block mt-2">
                        উৎস প্রতিবেদন: {currentFlashcard.term.article?.title}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#a0a8b5]">
                  {isCardFlipped ? "মনে রাখতে পারলে নিচে 'স্মরণে এসেছে' চাপুন" : "অর্থটি মনে করার চেষ্টা করুন, তারপর ক্লিক করুন"}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleReviewAgain(currentFlashcard.id)}
                  className="py-3 px-4 bg-white hover:bg-[#fff1f1] text-[#b91c1c] border border-[#fca5a5] rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <XCircle className="w-4 h-4" />
                  <span>আবার দেখতে চাই (Review)</span>
                </button>

                <button
                  onClick={() => handleMasterCard(currentFlashcard.id)}
                  className="py-3 px-4 bg-[#1e4620] hover:bg-[#163518] text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#86efac]" />
                  <span>স্মরণে এসেছে (Mastered)</span>
                </button>
              </div>

              {/* Card Switcher Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={currentCardIndex === 0}
                  onClick={() => {
                    setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                    setIsCardFlipped(false);
                  }}
                  className="text-xs font-semibold text-[#646c7a] hover:text-[#17191d] disabled:opacity-30 p-2"
                >
                  ← পূর্ববর্তী শব্দ
                </button>
                <button
                  disabled={currentCardIndex === localWords.length - 1}
                  onClick={() => {
                    setCurrentCardIndex((prev) => Math.min(localWords.length - 1, prev + 1));
                    setIsCardFlipped(false);
                  }}
                  className="text-xs font-semibold text-[#842323] hover:underline disabled:opacity-30 p-2"
                >
                  পরবর্তী শব্দ →
                </button>
              </div>
            </div>
          )}

          {/* Regular List View */}
          {!isFlashcardMode && (
            <div>
              {localWords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {displayedWords.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 bg-white border rounded-xl shadow-2xs flex flex-col justify-between transition ${
                        item.mastered ? "border-[#a7f3d0] bg-[#f0fdf4]" : "border-[#e4ded3]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isEnglishMode ? "text-[#0284c7]" : "text-[#842323]"
                          }`}>
                            {isEnglishMode ? "Vocabulary Word" : "পারিভাষিক শব্দ"}
                          </span>
                          {item.mastered && (
                            <span className="text-[10px] font-bold text-[#166534] bg-[#dcfce7] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{isEnglishMode ? "Mastered" : "মুখস্থ"}</span>
                            </span>
                          )}
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-[#1c1d21] font-serif">
                              {item.term.term}
                            </h3>
                            {isEnglishMode && (
                              <button
                                type="button"
                                onClick={(e) => handleSpeak(item.term.term, e)}
                                className={`p-1.5 rounded-md transition ${
                                  speakingWord === item.term.term
                                    ? "bg-[#38bdf8] text-[#0f172a]"
                                    : "text-[#0284c7] hover:bg-[#e0f2fe]"
                                }`}
                                title="উচ্চারণ শুনুন"
                              >
                                <Volume2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {isEnglishMode && (
                            <div className="text-[11px] font-medium text-[#c29547]">
                              [{getBanglaPronunciation(item.term.term)}]
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-[#4e5564] leading-relaxed">
                          {item.term.definition}
                        </p>
                        {item.term.context && (
                          <div className="mt-2 text-[11px] text-[#64748b] bg-[#faf8f4] p-2 rounded border border-[#f0ede6] italic line-clamp-3">
                            {item.term.context}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-[#f2ede4] flex items-center justify-between text-[11px]">
                        <Link
                          href={`/article/${item.term.article?.slug}`}
                          className="text-[#842323] font-semibold hover:underline truncate max-w-[140px]"
                        >
                          সূত্র: {item.term.article?.title}
                        </Link>
                        <button
                          onClick={() =>
                            item.mastered
                              ? handleReviewAgain(item.id)
                              : handleMasterCard(item.id)
                          }
                          className={`text-[10px] font-bold px-2.5 py-1 rounded transition ${
                            item.mastered
                              ? "text-[#64748b] hover:text-[#b91c1c] hover:bg-[#fee2e2]"
                              : "bg-[#f5f1e8] text-[#842323] hover:bg-[#ebdcc4]"
                          }`}
                        >
                          {item.mastered
                            ? (isEnglishMode ? "রিভিশন শুরু" : "আবার প্র্যাকটিস")
                            : (isEnglishMode ? "আয়ত্ত করেছি" : "মুখস্থ চিহ্নিত করুন")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-xl border border-[#e4ded3] text-xs text-[#717887] space-y-2">
                  <Sparkles className="w-8 h-8 text-[#d5cfc4] mx-auto" />
                  <p className="font-bold text-[#2a2d34] text-sm">ওয়ার্ড ব্যাংকে কোনো শব্দ জমা নেই</p>
                  <p className="text-[11px] text-[#8e95a2] max-w-md mx-auto">
                    যেকোনো সংবাদে থাকা পারিভাষিক শব্দে ক্লিক করে &lsquo;সংরক্ষণ করুন&rsquo; চাপলে তা এখানে আপনার ফ্ল্যাশকার্ড তালিকায় জমা হবে।
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: QUIZ SCORECARD & WEAKNESS ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* KPI Analytics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 bg-white border border-[#ded8cb] rounded-xl shadow-2xs">
              <span className="text-xs text-[#717887] block">মোট কুইজ সমাধান</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#17191d]">
                  {quizAnalytics.totalAttempts}
                </span>
                <span className="text-[11px] text-[#555d6b]">টি প্রশ্ন</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-[#ded8cb] rounded-xl shadow-2xs">
              <span className="text-xs text-[#717887] block">সঠিক উত্তর সংখ্যা</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#166534]">
                  {quizAnalytics.correctAttempts}
                </span>
                <span className="text-[11px] text-[#555d6b]">টি সঠিক</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-[#ded8cb] rounded-xl shadow-2xs">
              <span className="text-xs text-[#717887] block">সার্বিক নির্ভুলতা (Accuracy)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#842323]">
                  {quizAnalytics.accuracyPercent}%
                </span>
                <span className="text-[11px] text-[#555d6b]">সাফল্যের হার</span>
              </div>
            </div>

            <div className="p-4 bg-white border border-[#ded8cb] rounded-xl shadow-2xs">
              <span className="text-xs text-[#717887] block">রিভিশন দরকার (ভুল উত্তর)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#b91c1c]">
                  {quizAnalytics.mistakes.length}
                </span>
                <span className="text-[11px] text-[#555d6b]">টি প্রশ্ন রিভিশন যোগ্য</span>
              </div>
            </div>
          </div>

          {/* Category-wise Performance Bars */}
          <div className="p-6 bg-white border border-[#ded8cb] rounded-xl shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-[#1c1d21] font-serif uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#842323]" />
              <span>বিষয়ভিত্তিক কুইজ পারফরম্যান্স (Topic Proficiency)</span>
            </h3>

            {quizAnalytics.categoryBreakdown.length > 0 ? (
              <div className="space-y-3 pt-1">
                {quizAnalytics.categoryBreakdown.map((cat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#333a46]">{cat.name}</span>
                      <span className="text-[#842323] font-mono">
                        {cat.correct} / {cat.total} ({cat.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#f0eae1] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          cat.percent >= 80
                            ? "bg-[#16a34a]"
                            : cat.percent >= 50
                            ? "bg-[#d97706]"
                            : "bg-[#dc2626]"
                        }`}
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#717887]">
                এখনও কোনো কুইজে অংশগ্রহণ করা হয়নি। যেকোনো সংবাদ পড়ে নিচে থাকা কুইজে অংশ নিন।
              </p>
            )}
          </div>

          {/* Mistake Review Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1c1d21] font-serif flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#dc2626]" />
                  <span>ভুল উত্তরের পর্যালোচনা ও বিশ্লেষণ (Review Mistakes)</span>
                </h3>
                <p className="text-xs text-[#646c7a] mt-0.5">
                  যেসব প্রশ্নে পূর্বে ভুল উত্তর দেওয়া হয়েছিল, সেগুলো পুনরায় ঝালিয়ে নিন
                </p>
              </div>
            </div>

            {quizAnalytics.mistakes.length > 0 ? (
              <div className="space-y-3">
                {quizAnalytics.mistakes.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-white border border-[#fecaca] rounded-xl shadow-2xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#fef2f2] pb-2">
                      <span className="text-xs font-bold text-[#842323]">
                        {m.categoryName || "সাধারণ জ্ঞান"} &bull; {m.articleTitle}
                      </span>
                      <span className="text-[10px] text-[#717887]">
                        {new Date(m.date).toLocaleDateString("bn-BD")}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#1c1d21] font-serif">
                      {m.questionText}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-[#fef2f2] border border-[#fca5a5] rounded-lg">
                        <span className="text-[10px] font-bold text-[#991b1b] uppercase block">
                          আপনার প্রদত্ত ভুল উত্তর:
                        </span>
                        <span className="font-semibold text-[#b91c1c] mt-0.5 block">
                          {m.chosenOptionText}
                        </span>
                      </div>

                      <div className="p-2.5 bg-[#f0fdf4] border border-[#86efac] rounded-lg">
                        <span className="text-[10px] font-bold text-[#166534] uppercase block">
                          সঠিক উত্তর:
                        </span>
                        <span className="font-semibold text-[#15803d] mt-0.5 block">
                          {m.correctOptionText}
                        </span>
                      </div>
                    </div>

                    {m.explanation && (
                      <div className="p-3 bg-[#faf8f4] border border-[#eee9df] rounded-lg text-xs text-[#404652]">
                        <strong className="text-[#842323] block text-[11px] mb-0.5">ব্যাখ্যা:</strong>
                        <span>{m.explanation}</span>
                      </div>
                    )}

                    <div className="text-right pt-1">
                      <Link
                        href={`/article/${m.articleSlug}`}
                        className="text-xs font-bold text-[#842323] hover:underline inline-flex items-center gap-1"
                      >
                        <span>সম্পূর্ণ আর্টিকেল পড়ে রিভিশন দিন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-[#ded8cb] text-xs text-[#166534] space-y-1">
                <CheckCircle2 className="w-8 h-8 text-[#22c55e] mx-auto mb-2" />
                <p className="font-bold text-sm">চমৎকার! কোনো অমীমাংসিত ভুল উত্তর নেই</p>
                <p className="text-[11px] text-[#525964]">
                  আপনি যেসকল কুইজে অংশ নিয়েছেন সেগুলোর প্রস্তুতি সন্তোষজনক রয়েছে।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: STUDENT IDENTITY & PROFILE SWITCHER */}
      {/* ======================================================== */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Active Profile Info */}
          <div className="p-6 bg-white border border-[#ded8cb] rounded-xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#ece7dc] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1c1d21] font-serif">
                  শিক্ষার্থী প্রোফাইল ও টার্গেট পরীক্ষা ট্র্যাক
                </h3>
                <p className="text-xs text-[#646c7a]">
                  আপনার শিক্ষা স্তর এবং পরীক্ষার লক্ষ্য অনুযায়ী কন্টেন্ট ও প্রগ্রেস সংরক্ষণ করুন
                </p>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-3 py-1.5 bg-[#842323] text-white text-xs font-bold rounded-lg hover:bg-[#6e1c1c] transition"
              >
                {isEditingProfile ? "বাতিল" : "সম্পাদনা করুন"}
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs pt-2">
                <div>
                  <label className="block font-semibold text-[#454c59] mb-1">শিক্ষার্থীর নাম *</label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full p-2.5 bg-[#fbf9f5] border border-[#dcd7cb] rounded text-sm text-[#1c1d21] outline-none focus:border-[#842323]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#454c59] mb-1">টার্গেট পরীক্ষা ট্র্যাক *</label>
                  <select
                    value={trackInput}
                    onChange={(e) => setTrackInput(e.target.value)}
                    className="w-full p-2.5 bg-[#fbf9f5] border border-[#dcd7cb] rounded text-sm text-[#1c1d21] outline-none focus:border-[#842323]"
                  >
                    <option value="BCS_GOVT">বিসিএস ও সরকারি চাকরি প্রস্তুতি (BCS_GOVT)</option>
                    <option value="ADMISSION">বিশ্ববিদ্যালয় 'ঘ' ইউনিট ও মানবিক ভর্তি (ADMISSION)</option>
                    <option value="RESEARCH">অর্থনীতি ও আন্তর্জাতিক পলিসি গবেষণা (RESEARCH)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#454c59] mb-1">শিক্ষা প্রতিষ্ঠান / বিশ্ববিদ্যালয়</label>
                  <input
                    type="text"
                    value={instInput}
                    onChange={(e) => setInstInput(e.target.value)}
                    placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয়, ভিকারুননিসা নূন কলেজ"
                    className="w-full p-2.5 bg-[#fbf9f5] border border-[#dcd7cb] rounded text-sm text-[#1c1d21] outline-none focus:border-[#842323]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-[#f5f1e8] text-[#555d6b] rounded font-semibold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 bg-[#842323] text-white rounded font-bold hover:bg-[#6e1c1c] transition"
                  >
                    {isSavingProfile ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="bg-[#fbf9f5] p-3.5 rounded-lg border border-[#eee9df]">
                  <span className="text-[#717887] block text-[11px]">শিক্ষার্থীর নাম</span>
                  <strong className="text-sm text-[#1c1d21] font-serif block mt-0.5">{student.name}</strong>
                </div>
                <div className="bg-[#fbf9f5] p-3.5 rounded-lg border border-[#eee9df]">
                  <span className="text-[#717887] block text-[11px]">টার্গেট পরীক্ষা ট্র্যাক</span>
                  <strong className="text-sm text-[#842323] block mt-0.5">{student.targetTrack}</strong>
                </div>
                <div className="bg-[#fbf9f5] p-3.5 rounded-lg border border-[#eee9df]">
                  <span className="text-[#717887] block text-[11px]">শিক্ষা প্রতিষ্ঠান</span>
                  <strong className="text-sm text-[#1c1d21] block mt-0.5">{student.institution || "সাধারণ শিক্ষার্থী"}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Account Security & Privacy */}
          <div className="p-6 bg-white border border-[#ded8cb] rounded-xl shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-[#1c1d21] font-serif flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#842323]" />
              <span>অ্যাকাউন্ট নিরাপত্তা ও গোপনীয়তা (Privacy & Security)</span>
            </h3>
            <p className="text-xs text-[#646c7a] leading-relaxed">
              আপনার ব্যক্তিগত নোটবুক, সংরক্ষিত শব্দভাণ্ডার এবং কুইজ অ্যানালিটিক্স সম্পূর্ণভাবে আপনার নিজস্ব অ্যাকাউন্টের অধীনে সুরক্ষিত এবং অন্য কোনো ব্যবহারকারীর কাছে দৃশ্যমান নয়।
            </p>

            <div className="pt-2 border-t border-[#f2ede4] flex items-center justify-between">
              <span className="text-xs text-[#717887]">
                ইমেইল: <strong className="text-[#1c1d21] font-mono">{student.email}</strong>
              </span>

              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-lg transition shadow-2xs"
              >
                লগআউট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
