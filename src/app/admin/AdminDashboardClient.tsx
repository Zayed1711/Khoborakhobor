"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  triggerSpiderCrawlAction,
  testFeedSourceAction,
  getAllSourcesAction,
  addSourceToRegistryAction,
  removeSourceFromRegistryAction,
  getCrawlLogsAction,
  getAdminStatsAction,
  getAdminRecentArticlesAction,
  deleteArticleAction,
  toggleArticleFlagAction,
} from "@/actions/scraper";
import { logoutAction } from "@/actions/auth";
import { NewspaperSource, CrawlLogEntry } from "@/lib/scraper/spider";
import {
  Bot,
  Activity,
  Terminal,
  Shield,
  RefreshCw,
  Trash2,
  Eye,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Globe,
  Database,
  Layers,
  ExternalLink,
  Sparkles,
  Zap,
  Play,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  Info,
  Clock,
  Copy,
  Code,
  X,
  Users,
  Volume2,
  BookOpen,
  HelpCircle,
  GraduationCap,
  PenLine,
  CalendarClock,
} from "lucide-react";
import UserManagementTab from "./UserManagementTab";
import WritingReviewTab from "./WritingReviewTab";
import WeeklyExamTab from "./WeeklyExamTab";
import { getEnToBnPhonetics } from "@/lib/phonetics/en-to-bn";

const CATEGORIES = [
  { name: "সকল বিভাগ (All Categories)", slug: "all" },
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

export default function AdminDashboardClient() {

  const [activeTab, setActiveTab] = useState<"spider" | "users" | "exam" | "writing" | "sources" | "history" | "articles" | "scheduler">("spider");

  // Cron / Scheduler state
  const [copiedVercel, setCopiedVercel] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Admin Stats
  const [stats, setStats] = useState<{
    articleCount: number;
    quizCount: number;
    vocabCount: number;
    studentCount: number;
    totalSources: number;
    bnSources: number;
    enSources: number;
    lastRun: CrawlLogEntry | null;
  } | null>(null);

  // Sources Data
  const [sources, setSources] = useState<NewspaperSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  // History Logs
  const [logs, setLogs] = useState<CrawlLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Moderation Articles
  const [articles, setArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleFilterMode, setArticleFilterMode] = useState<"all" | "job_prep" | "english">("all");
  const [previewArticle, setPreviewArticle] = useState<any | null>(null);
  const [previewTab, setPreviewTab] = useState<"vocab" | "quiz">("vocab");
  const [speakingTerm, setSpeakingTerm] = useState<string | null>(null);

  // Spider run state
  const [spiderRunning, setSpiderRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Feed Test State
  const [testingUrl, setTestingUrl] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [url: string]: any }>({});

  // Add Source Form State
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newLang, setNewLang] = useState<"bn" | "en">("bn");
  const [newCatSlug, setNewCatSlug] = useState("national");
  const [newExamTrack, setNewExamTrack] = useState("বিসিএস ও সাধারণ জ্ঞান");
  const [addingSource, setAddingSource] = useState(false);

  const [, startTransition] = useTransition();

  const handleSpeakWord = (word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    setSpeakingTerm(word);
    utterance.onend = () => setSpeakingTerm(null);
    utterance.onerror = () => setSpeakingTerm(null);
    window.speechSynthesis.speak(utterance);
  };

  const isBengaliText = (text: string) => /[\u0980-\u09FF]/.test(text || "");
  const bnArticlesCount = articles.filter((a) => isBengaliText(a.title)).length;
  const enArticlesCount = articles.filter((a) => !isBengaliText(a.title)).length;

  const displayedArticles = articles.filter((art) => {
    if (articleFilterMode === "job_prep") return isBengaliText(art.title);
    if (articleFilterMode === "english") return !isBengaliText(art.title);
    return true;
  });

  // Load initial data
  const refreshAllData = async () => {
    try {
      const [statsRes, sourcesRes, logsRes, articlesRes] = await Promise.all([
        getAdminStatsAction(),
        getAllSourcesAction(),
        getCrawlLogsAction(),
        getAdminRecentArticlesAction(30),
      ]);

      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      if (sourcesRes.success) setSources(sourcesRes.sources);
      if (logsRes.success) setLogs(logsRes.logs);
      if (articlesRes.success) setArticles(articlesRes.articles);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
    }
  };

  useEffect(() => {
    refreshAllData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (
        tabParam === "users" ||
        tabParam === "writing" ||
        tabParam === "exam" ||
        tabParam === "spider" ||
        tabParam === "sources" ||
        tabParam === "history" ||
        tabParam === "articles" ||
        tabParam === "scheduler"
      ) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  const showNotify = (type: "success" | "error" | "info", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 6000);
  };

  // Run Spider Handler
  const handleExecuteSpider = async () => {
    setSpiderRunning(true);
    setRunResult(null);
    try {
      const response = await fetch("/api/admin/spider/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // No options: the crawler always reads every newspaper for today's news
        body: JSON.stringify({}),
      });

      let res: any;
      try {
        res = await response.json();
      } catch {
        res = {
          success: false,
          message: `সার্ভারে প্রসেসিং সম্পন্ন হচ্ছে (HTTP ${response.status})। কয়েক সেকেন্ড পর রিফ্রেশ করুন।`,
        };
      }

      if (res.success && res.data) {
        setRunResult(res.data);
        showNotify("success", res.message);
        refreshAllData();
      } else {
        showNotify("error", res.message || "স্পাইডার চালাতে ত্রুটি হয়েছে।");
      }
    } catch (err: any) {
      const errMsg = err?.message || "";
      if (
        errMsg.includes("unexpected response") ||
        errMsg.includes("504") ||
        errMsg.includes("timeout") ||
        errMsg.includes("Failed to fetch")
      ) {
        showNotify("info", "সার্ভারে স্পাইডার ক্রলিং সম্পন্ন হচ্ছে। কয়েক মুহূর্ত পর রিফ্রেশ করুন।");
      } else {
        showNotify("error", errMsg || "স্পাইডার চালাতে ত্রুটি হয়েছে।");
      }
      refreshAllData();
    } finally {
      setSpiderRunning(false);
    }
  };


  // Test single feed
  const handleTestFeed = async (url: string) => {
    setTestingUrl(url);
    try {
      const res = await testFeedSourceAction(url);
      setTestResult((prev) => ({ ...prev, [url]: res }));
    } catch (err: any) {
      setTestResult((prev) => ({ ...prev, [url]: { success: false, error: err.message } }));
    } finally {
      setTestingUrl(null);
    }
  };

  // Add source
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newFeedUrl) return;

    setAddingSource(true);
    try {
      const res = await addSourceToRegistryAction({
        name: newSourceName,
        feedUrl: newFeedUrl,
        categorySlug: newCatSlug,
        examTrack: newExamTrack,
        language: newLang,
      });

      if (res.success) {
        showNotify("success", res.message);
        setNewSourceName("");
        setNewFeedUrl("");
        setShowAddSourceModal(false);
        refreshAllData();
      } else {
        showNotify("error", res.message);
      }
    } catch (err: any) {
      showNotify("error", err.message || "উৎস যুক্ত করা যায়নি।");
    } finally {
      setAddingSource(false);
    }
  };

  // Remove source
  const handleRemoveSource = async (feedUrl: string, lang: "bn" | "en") => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই সংবাদপত্র উৎসটি অপসারণ করতে চান?")) return;

    try {
      const res = await removeSourceFromRegistryAction(feedUrl, lang);
      if (res.success) {
        showNotify("success", res.message);
        refreshAllData();
      } else {
        showNotify("error", res.message);
      }
    } catch (err: any) {
      showNotify("error", err.message || "উৎস অপসারণ ব্যর্থ হয়েছে।");
    }
  };

  // Delete article
  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`প্রতিবেদনটি মুছে ফেলতে চান?\n"${title}"`)) return;

    try {
      const res = await deleteArticleAction(id);
      if (res.success) {
        showNotify("success", res.message);
        setArticles((prev) => prev.filter((a) => a.id !== id));
        refreshAllData();
      } else {
        showNotify("error", res.message);
      }
    } catch (err: any) {
      showNotify("error", err.message || "মুছে ফেলা যায়নি।");
    }
  };

  // Toggle flags
  const handleToggleFlag = async (id: string, flag: "isLead" | "isCapsule") => {
    try {
      const res = await toggleArticleFlagAction(id, flag);
      if (res.success) {
        setArticles((prev) =>
          prev.map((a) => (a.id === id ? { ...a, [flag]: !a[flag] } : a))
        );
      }
    } catch (err: any) {
      showNotify("error", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f141c] text-[#e1e7ed] font-sans flex flex-col">
      {/* Top Admin Header */}
      <header className="border-b border-[#212936] bg-[#141b24] sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#842323] text-white flex items-center justify-center font-serif font-black shadow-md">
              <Bot className="w-5 h-5 text-[#f5c66b]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold font-serif text-white tracking-wide">
                  খবরাখবর স্পাইডার ও ক্রলার অ্যাডমিন কনসোল
                </h1>
                <span className="text-[10px] bg-[#1e293b] text-[#38bdf8] border border-[#0284c7]/40 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  v2.0 Command Center
                </span>
              </div>
              <p className="text-[11px] text-[#8e9aa8]">
                Newspaper Scrapers, RSS Spiders, Dataset Curation & Live Automation Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={refreshAllData}
              className="p-2 text-[#94a3b8] hover:text-white bg-[#1e293b] hover:bg-[#283548] rounded border border-[#334155] transition flex items-center gap-1.5"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>
            <Link
              href="/desk"
              className="px-3 py-1.5 text-xs text-[#cbd5e1] hover:text-white bg-[#1e293b] hover:bg-[#283548] rounded border border-[#334155] transition flex items-center gap-1.5"
            >
              <span>এডিটোরিয়াল ডেস্ক</span>
              <ArrowRight className="w-3 h-3 text-[#f5c66b]" />
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 text-xs text-white bg-[#842323] hover:bg-[#992929] rounded font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <span>ওয়েবসাইটে ফিরুন</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logoutAction();
                window.location.href = "/admin/login";
              }}
              className="px-2.5 py-1.5 text-xs text-red-300 hover:text-white bg-red-950/50 hover:bg-red-900/60 rounded border border-red-800/60 transition flex items-center gap-1"
              title="অ্যাডমিন সেশন সমাপ্ত করুন"
            >
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`px-6 py-2.5 text-xs font-medium flex items-center justify-center gap-2 transition-all ${
            notification.type === "success"
              ? "bg-[#064e3b] text-[#a7f3d0] border-b border-[#059669]"
              : notification.type === "error"
              ? "bg-[#7f1d1d] text-[#fecaca] border-b border-[#dc2626]"
              : "bg-[#1e293b] text-[#93c5fd] border-b border-[#3b82f6]"
          }`}
        >
          {notification.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {notification.type === "error" && <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-[#141b24] border border-[#212936] p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-[#8e9aa8] text-xs">
              <span>সংযুক্ত সংবাদ উৎস (Sources)</span>
              <Globe className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {stats?.totalSources ?? sources.length}
              </span>
              <span className="text-[11px] text-[#94a3b8]">
                ({stats?.bnSources ?? "-"} বাংলা + {stats?.enSources ?? "-"} ইংরেজি)
              </span>
            </div>
          </div>

          <div className="bg-[#141b24] border border-[#212936] p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-[#8e9aa8] text-xs">
              <span>মোট সংগৃহীত প্রতিবেদন (Articles)</span>
              <Database className="w-4 h-4 text-[#4ade80]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {stats?.articleCount ?? articles.length}
              </span>
              <span className="text-[11px] text-[#94a3b8]">ডেটাবেজে সংরক্ষিত</span>
            </div>
          </div>

          {/* Dedicated Registered Users / Students KPI Card */}
          <div 
            onClick={() => setActiveTab("users")}
            className="bg-[#141b24] border border-[#212936] hover:border-[#f5c66b]/60 p-4 rounded-xl shadow-xs cursor-pointer transition group"
            title="শিক্ষার্থী ও ব্যবহারকারী তালিকা দেখতে ক্লিক করুন"
          >
            <div className="flex items-center justify-between text-[#8e9aa8] text-xs">
              <span className="group-hover:text-[#f5c66b] transition">নিবন্ধিত শিক্ষার্থী (Users)</span>
              <Users className="w-4 h-4 text-[#38bdf8] group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {stats?.studentCount ?? 0}
              </span>
              <span className="text-[11px] text-[#38bdf8] group-hover:underline">তালিকা দেখুন →</span>
            </div>
          </div>

          <div className="bg-[#141b24] border border-[#212936] p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-[#8e9aa8] text-xs">
              <span>লার্নিং টুলস (Quizzes & Vocab)</span>
              <Sparkles className="w-4 h-4 text-[#f5c66b]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                {(stats?.quizCount ?? 0) + (stats?.vocabCount ?? 0)}
              </span>
              <span className="text-[11px] text-[#94a3b8]">
                ({stats?.quizCount ?? 0} কুইজ, {stats?.vocabCount ?? 0} শব্দ)
              </span>
            </div>
          </div>

          <div className="bg-[#141b24] border border-[#212936] p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-[#8e9aa8] text-xs">
              <span>সর্বশেষ ক্রল স্ট্যাটাস (Last Run)</span>
              <Activity className="w-4 h-4 text-[#f43f5e]" />
            </div>
            <div className="mt-2">
              <div className="text-xs font-semibold text-white truncate">
                {stats?.lastRun ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        stats.lastRun.status === "SUCCESS"
                          ? "bg-green-500"
                          : stats.lastRun.status === "WARNING"
                          ? "bg-amber-400"
                          : "bg-red-500"
                      }`}
                    />
                    {stats.lastRun.targetDate} ({stats.lastRun.saved} সেভড{stats.lastRun.skipped ? ` • ${stats.lastRun.skipped} আপ-টু-ডেট` : ""})
                  </span>
                ) : (
                  "কোনো ইতিহাস নেই"
                )}
              </div>
              <p className="text-[10px] text-[#64748b] mt-0.5 truncate">
                {stats?.lastRun
                  ? new Date(stats.lastRun.timestamp).toLocaleTimeString()
                  : "স্পাইডার প্রস্তুত"}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="border-b border-[#212936] flex items-center gap-2 overflow-x-auto pb-px text-xs font-medium">
          <button
            onClick={() => setActiveTab("spider")}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 font-semibold ${
              activeTab === "spider"
                ? "bg-[#141b24] text-[#f5c66b] border-[#f5c66b]"
                : "text-[#8e9aa8] hover:text-white border-transparent hover:bg-[#141b24]/50"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>স্পাইডার কন্ট্রোল সেন্টার (Spider Console)</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 font-semibold ${
              activeTab === "users"
                ? "bg-[#141b24] text-[#f5c66b] border-[#f5c66b]"
                : "text-[#8e9aa8] hover:text-white border-transparent hover:bg-[#141b24]/50"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>ব্যবহারকারী ও অ্যাকাউন্ট ব্যবস্থাপনা ({stats?.studentCount ?? 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("exam")}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 font-semibold ${
              activeTab === "exam"
                ? "bg-[#141b24] text-[#f5c66b] border-[#f5c66b]"
                : "text-[#8e9aa8] hover:text-white border-transparent hover:bg-[#141b24]/50"
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Weekly exam</span>
          </button>

          <button
            onClick={() => setActiveTab("writing")}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 font-semibold ${
              activeTab === "writing"
                ? "bg-[#141b24] text-[#f5c66b] border-[#f5c66b]"
                : "text-[#8e9aa8] hover:text-white border-transparent hover:bg-[#141b24]/50"
            }`}
          >
            <PenLine className="w-4 h-4" />
            <span>Writing reviews</span>
          </button>

          <a
            href="/admin/ai-review"
            className="px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 font-semibold text-[#8e9aa8] hover:text-white border-transparent hover:bg-[#141b24]/50"
          >
            <PenLine className="w-4 h-4" />
            <span>AI summaries</span>
          </a>

          <button
            onClick={() => setActiveTab("sources")}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 font-semibold ${
              activeTab === "sources"
                ? "bg-[#141b24] text-[#f5c66b] border-[#f5c66b]"
                : "text-[#8e9aa8] hover:text-white border-transparent hover:bg-[#141b24]/50"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>সংবাদ উৎস ও ফিড ম্যানেজার ({sources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 font-semibold ${
              activeTab === "history"
                ? "bg-[#141b24] text-[#f5c66b] border-[#f5c66b]"
                : "text-[#8e9aa8] hover:text-white border-transparent hover:bg-[#141b24]/50"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>ক্রলিং হিস্টোরি ও অডিট লগ ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("articles")}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 font-semibold ${
              activeTab === "articles"
                ? "bg-[#141b24] text-[#f5c66b] border-[#f5c66b]"
                : "text-[#8e9aa8] hover:text-white border-transparent hover:bg-[#141b24]/50"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>সংগৃহীত প্রতিবেদন ও মডারেশন ({articles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("scheduler")}
            className={`px-4 py-2.5 rounded-t-lg transition flex items-center gap-2 border-b-2 font-semibold ${
              activeTab === "scheduler"
                ? "bg-[#141b24] text-[#f5c66b] border-[#f5c66b]"
                : "text-[#8e9aa8] hover:text-white border-transparent hover:bg-[#141b24]/50"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>অটোমেটেড শিডিউলার ও ক্রন (Scheduler & Webhook)</span>
          </button>
        </div>

        {/* TAB: USER & ACCOUNT MANAGEMENT */}
        {activeTab === "users" && <UserManagementTab showNotify={showNotify} />}

        {/* TAB: WRITING REVIEWS (by hand) */}
        {activeTab === "writing" && <WritingReviewTab showNotify={showNotify} />}

        {/* TAB: WEEKLY EXAM BUILDER */}
        {activeTab === "exam" && <WeeklyExamTab showNotify={showNotify} />}

        {/* TAB 1: SPIDER CONTROL CENTER */}
        {activeTab === "spider" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* One button: the crawler always runs the same way (all newspapers, today's news) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#141b24] border border-[#212936] rounded-xl p-5 space-y-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#212936] pb-3">
                  <Zap className="w-5 h-5 text-[#f5c66b]" />
                  <div>
                    <h2 className="text-sm font-bold text-white">সংবাদ সংগ্রহ (Crawler)</h2>
                    <p className="text-[11px] text-[#94a3b8] mt-0.5">
                      প্রতি ৬ ঘণ্টায় নিজে থেকেই চলে। এখনই চালাতে নিচের বোতাম চাপুন।
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteSpider}
                  disabled={spiderRunning}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#842323] hover:bg-[#6e1c1c] disabled:opacity-60 text-white text-sm font-bold transition"
                >
                  {spiderRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>সংবাদ সংগ্রহ চলছে… (এক মিনিট পর্যন্ত লাগতে পারে)</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>এখনই সংবাদ সংগ্রহ করুন</span>
                    </>
                  )}
                </button>

                {runResult && (
                  <div className="rounded-lg border border-[#212936] bg-[#0f151d] p-4 space-y-3">
                    <h3 className="text-xs font-bold text-white">সর্বশেষ সংগ্রহের ফল ({runResult.targetDate})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      {[
                        ["নতুন সংরক্ষিত", runResult.saved],
                        ["দৈনিক ৩০-এর বাইরে বাদ", runResult.trimmed || 0],
                        ["অপ্রাসঙ্গিক বাদ", runResult.filteredExamNoise || 0],
                        ["আগেই ছিল / পুনরাবৃত্তি", runResult.skipped],
                      ].map(([label, value]) => (
                        <div key={label as string} className="rounded-md bg-[#141b24] border border-[#212936] p-2.5">
                          <div className="text-lg font-bold text-white">{Number(value).toLocaleString("bn-BD")}</div>
                          <div className="text-[11px] text-[#94a3b8]">{label}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#94a3b8]">
                      {runResult.sourcesCount?.toLocaleString("bn-BD")}টি সংবাদপত্র ফিড • সময় {(runResult.durationMs / 1000).toFixed(1)} সেকেন্ড
                      {runResult.errors ? ` • ${runResult.errors.toLocaleString("bn-BD")}টি ফিডে সমস্যা` : ""}
                    </p>
                    {runResult.items?.length > 0 && (
                      <ul className="text-xs text-[#cbd5e1] space-y-1 max-h-60 overflow-y-auto border-t border-[#212936] pt-2">
                        {runResult.items.map((it: string, i: number) => (
                          <li key={i} className="truncate">• {it}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* What a run does (kept accurate to the code) */}
            <div className="space-y-6">
              <div className="bg-[#141b24] border border-[#212936] rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-white mb-3">প্রতিবার সংগ্রহে যা হয়</h3>
                <ul className="text-[11px] text-[#94a3b8] space-y-2 leading-relaxed list-disc pl-4">
                  <li>তালিকার সব সংবাদপত্রের ফিড থেকে আজকের সংবাদ পড়া হয়।</li>
                  <li>সিলেবাসের সঙ্গে সম্পর্কহীন সংবাদ (অপরাধ, গসিপ, পারিবারিক বিরোধ) বাদ যায়; আলোচিত জাতীয় ও আন্তর্জাতিক সংবাদ থাকে।</li>
                  <li>বাংলা (চাকরি ও বিসিএস) সংবাদ দিনে সর্বোচ্চ ৩০টি: প্রতিবার দিনের সব সংবাদ মিলিয়ে সেরা ৩০টি রাখা হয়, দুর্বলগুলো বাদ যায় এবং আর সংগ্রহ হয় না।</li>
                  <li>কোনো শিক্ষার্থী যে সংবাদ সংরক্ষণ করেছে, পড়েছে, নোট নিয়েছে বা যার কুইজ দিয়েছে, সেটি কখনো বাদ যায় না।</li>
                  <li>ইংরেজি সংবাদের কোনো দৈনিক সীমা নেই।</li>
                  <li>একই সংবাদ দুবার সংরক্ষিত হয় না; পুরো লেখা সংরক্ষণ বা প্রকাশ করা হয় না, শুধু মূল তথ্য ও মূল সংবাদের লিংক।</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NEWSPAPER SOURCES & FEED CONFIG */}
        {activeTab === "sources" && (
          <div className="space-y-4">
            <div className="bg-[#141b24] border border-[#212936] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white font-serif">
                  সংবাদপত্র উৎস ও ফিড কনফিগারেশন (Newspaper Source Registries)
                </h2>
                <p className="text-xs text-[#8e9aa8]">
                  বাংলা (<code>newspapers_bn.csv</code>) ও ইংরেজি (<code>newspapers_en.csv</code>) উৎস ব্যবস্থাপনা
                </p>
              </div>

              <button
                onClick={() => setShowAddSourceModal(true)}
                className="px-3 py-1.5 bg-[#842323] hover:bg-[#9c2b2b] text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন সংবাদপত্র উৎস যোগ করুন</span>
              </button>
            </div>

            {/* Sources Table */}
            <div className="bg-[#141b24] border border-[#212936] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18202c] border-b border-[#212936] text-[#8e9aa8] uppercase text-[10px] tracking-wider font-mono">
                    <tr>
                      <th className="px-4 py-3">সংবাদপত্রের নাম</th>
                      <th className="px-4 py-3">ভাষা</th>
                      <th className="px-4 py-3">বিভাগ</th>
                      <th className="px-4 py-3">পরীক্ষা ট্র্যাক</th>
                      <th className="px-4 py-3">আরএসএস ফিড URL</th>
                      <th className="px-4 py-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#212936]">
                    {sources.map((s, idx) => (
                      <tr key={idx} className="hover:bg-[#18212e]/50 transition">
                        <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                          {s.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.language === "bn"
                                ? "bg-[#842323]/30 text-[#fca5a5] border border-[#842323]/50"
                                : "bg-[#0369a1]/30 text-[#7dd3fc] border border-[#0369a1]/50"
                            }`}
                          >
                            {s.language === "bn" ? "চাকরি প্রস্তুতি (BN)" : "English Learning (EN)"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#cbd5e1]">{s.categorySlug}</td>
                        <td className="px-4 py-3 text-[#94a3b8]">{s.examTrack}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[#38bdf8] max-w-[260px] truncate">
                          <a
                            href={s.feedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <span className="truncate">{s.feedUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                          </a>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTestFeed(s.feedUrl)}
                              disabled={testingUrl === s.feedUrl}
                              className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#283548] text-[#38bdf8] rounded text-[11px] font-semibold transition"
                              title="ফিড টেস্ট করুন"
                            >
                              {testingUrl === s.feedUrl ? "চেকিং..." : "টেস্ট"}
                            </button>
                            <button
                              onClick={() => handleRemoveSource(s.feedUrl, s.language || "bn")}
                              className="p-1 text-[#f87171] hover:text-white hover:bg-[#7f1d1d] rounded transition"
                              title="উৎস মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUTOMATED SCHEDULER & CRON */}
        {activeTab === "scheduler" && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-[#141b24] border border-[#212936] rounded-xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0f766e]/30 border border-[#14b8a6]/40 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#2dd4bf]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-serif">
                      স্বয়ংক্রিয় ক্রলার শিডিউলার ও ক্রন ইঞ্জিন (Automated Spider Scheduler)
                    </h2>
                    <p className="text-xs text-[#8e9aa8] mt-0.5">
                      প্রতিদিন নির্দিষ্ট সময়ে স্বয়ংক্রিয়ভাবে সংবাদপত্র স্ক্যান, এডটেক সারসংক্ষেপ ও ৫-মিনিট ক্যাপসুল আপডেট
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-[#064e3b] text-[#34d399] px-3 py-1 rounded-full border border-[#059669]/50 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    Cron Endpoint Active
                  </span>
                </div>
              </div>
            </div>

            {/* Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Interactive Webhook Tester */}
              <div className="bg-[#141b24] border border-[#212936] rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#212936] pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#f5c66b]" />
                    <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                      ওয়েবহুক এন্ডপয়েন্ট টেস্ট (Live Webhook Trigger)
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#38bdf8] font-mono">GET / POST</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#cbd5e1] block mb-1">
                      ক্রন এন্ডপয়েন্ট URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#0f141c] border border-[#283548] p-2.5 rounded font-mono text-xs text-[#38bdf8] truncate">
                        /api/cron/spider
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/api/cron/spider`
                          );
                          setCopiedCurl(true);
                          setTimeout(() => setCopiedCurl(false), 2000);
                        }}
                        className="px-3 py-2.5 bg-[#1e293b] hover:bg-[#283548] text-white text-xs rounded border border-[#334155] transition flex items-center gap-1.5 shrink-0"
                        title="URL কপি করুন"
                      >
                        {copiedCurl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span>কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>কপি</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0f141c] border border-[#212936] p-3 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94a3b8]">অনুমোদন (Security / Secret):</span>
                      <span className="text-[10px] bg-[#1e293b] text-[#cbd5e1] px-2 py-0.5 rounded font-mono">
                        শুধু Authorization: Bearer হেডার
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94a3b8]">ডিফল্ট ফিল্টারিং:</span>
                      <span className="text-[10px] text-[#cbd5e1] font-mono">
                        targetDate=আজ, language=all
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <p className="text-[11px] text-[#94a3b8]">ক্রলার এখনই চালাতে "স্পাইডার" ট্যাবের বোতাম ব্যবহার করুন।</p>
                  </div>
                </div>

                {/* Response Output Box */}
              </div>

              {/* Right Column: Production Vercel & Local Setup Guide */}
              <div className="space-y-6">
                {/* Vercel Crons Card */}
                <div className="bg-[#141b24] border border-[#212936] rounded-xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#212936] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#38bdf8]" />
                      <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                        প্রোডাকশন ক্রন শিডিউল (Vercel Cron)
                      </h3>
                    </div>
                    <span className="text-[10px] text-[#4ade80] bg-[#14261d] px-2 py-0.5 rounded border border-[#059669]/40 font-mono">
                      vercel.json Ready
                    </span>
                  </div>

                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    প্রোডাকশনে (যেমন: Vercel) ডিপ্লয় করলে <code>vercel.json</code> কনফিগারেশন অনুযায়ী প্রতিদিন স্বয়ংক্রিয়ভাবে দুটি সংস্করণে ক্রলিং চলবে:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="bg-[#0f141c] p-2.5 rounded border border-[#212936] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f5c66b]" />
                        <span className="text-white font-semibold">ভোরের সংস্করণ (Morning Capsule)</span>
                      </div>
                      <span className="text-[#38bdf8] font-mono text-[11px]">
                        00:00 UTC (সকাল ০৬:০০ BST)
                      </span>
                    </div>

                    <div className="bg-[#0f141c] p-2.5 rounded border border-[#212936] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                        <span className="text-white font-semibold">অপরাহ্ন সংস্করণ (Afternoon Update)</span>
                      </div>
                      <span className="text-[#38bdf8] font-mono text-[11px]">
                        08:00 UTC (দুপুর ০২:০০ BST)
                      </span>
                    </div>
                  </div>

                  <div className="relative pt-2">
                    <pre className="bg-[#0b0f15] border border-[#1e2633] p-3 rounded text-[11px] font-mono text-[#cbd5e1] overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/cron/spider?language=all",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/spider?language=all",
      "schedule": "0 8 * * *"
    }
  ]
}`}
                    </pre>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          JSON.stringify(
                            {
                              crons: [
                                { path: "/api/cron/spider?language=all", schedule: "0 0 * * *" },
                                { path: "/api/cron/spider?language=all", schedule: "0 8 * * *" },
                              ],
                            },
                            null,
                            2
                          )
                        );
                        setCopiedVercel(true);
                        setTimeout(() => setCopiedVercel(false), 2000);
                      }}
                      className="absolute top-4 right-2 text-[10px] bg-[#1e293b] hover:bg-[#283548] text-[#94a3b8] hover:text-white px-2 py-1 rounded border border-[#334155] transition flex items-center gap-1"
                    >
                      {copiedVercel ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedVercel ? "কপি হয়েছে" : "কপি JSON"}</span>
                    </button>
                  </div>
                </div>

                {/* Local & VPS Background Worker */}
                <div className="bg-[#141b24] border border-[#212936] rounded-xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-[#212936] pb-2.5">
                    <Terminal className="w-4 h-4 text-[#a78bfa]" />
                    <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                      লোকাল ও VPS ব্যাকগ্রাউন্ড অটোমেশন (Background Worker)
                    </h3>
                  </div>

                  <p className="text-xs text-[#94a3b8] leading-relaxed">
                    লোকাল মেশিনে বা নিজস্ব সার্ভারে সার্বক্ষণিক অটো-ক্রলার চালু রাখতে টার্মিনালে নিচের কমান্ডটি চালাতে পারেন:
                  </p>

                  <div className="bg-[#0b0f15] border border-[#1e2633] p-3 rounded font-mono text-xs text-[#34d399] flex items-center justify-between">
                    <span>npm run cron</span>
                    <span className="text-[10px] text-[#64748b]">scripts/cron-worker.js</span>
                  </div>

                  <p className="text-[11px] text-[#64748b]">
                    এটি স্বয়ংক্রিয়ভাবে প্রতি ৬ ঘণ্টা পরপর <code>/api/cron/spider</code> কল করে আপনার ডেটাবেজে সর্বশেষ সংবাদ ও কুইজ হালনাগাদ রাখবে।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CRAWL HISTORY & LOGS */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="bg-[#141b24] border border-[#212936] rounded-xl p-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white font-serif">
                  স্পাইডার ক্রলিং অডিট লগ (Crawl Run History)
                </h2>
                <p className="text-xs text-[#8e9aa8]">
                  পূর্ববর্তী সকল ক্রলার কার্যক্রম, এক্সিকিউশন টাইম এবং ডেটাসেট পরিসংখ্যান
                </p>
              </div>
              <button
                onClick={refreshAllData}
                className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#283548] text-[#cbd5e1] text-xs rounded border border-[#334155] transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>রিফ্রেশ হিস্টোরি</span>
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="bg-[#141b24] border border-[#212936] rounded-xl p-8 text-center text-xs text-[#64748b]">
                এখনও কোনো ক্রলিং রেকর্ড সংরক্ষিত হয়নি। স্পাইডার কনসোল থেকে ক্রলার চালু করুন।
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-[#141b24] border border-[#212936] rounded-xl p-4 space-y-3 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#212936] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            log.status === "SUCCESS"
                              ? "bg-green-500"
                              : log.status === "WARNING"
                              ? "bg-amber-400"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="font-bold text-white text-xs">
                          {log.dryRun ? "[ড্রাই রান]" : "[লাইভ ক্রল]"} লক্ষ্য তারিখ: {log.targetDate}
                        </span>
                        <span className="text-[10px] bg-[#1e293b] text-[#94a3b8] px-2 py-0.5 rounded font-mono">
                          {log.language === "all" ? "উভয় মাধ্যম" : log.language === "bn" ? "বাংলা" : "ইংরেজি"}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-[#8e9aa8] flex items-center gap-3">
                        <span>সময়কাল: {(log.durationMs / 1000).toFixed(1)}s</span>
                        <span>{new Date(log.timestamp).toLocaleString("bn-BD")}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="bg-[#0f141c] p-2 rounded border border-[#212936]">
                        <span className="text-[10px] text-[#8e9aa8] block">স্ক্যানকৃত সোর্স</span>
                        <strong className="text-white">{log.sourcesProcessed}</strong>
                      </div>
                      <div className="bg-[#0f141c] p-2 rounded border border-[#212936]">
                        <span className="text-[10px] text-[#8e9aa8] block">সংরক্ষিত / ম্যাচড</span>
                        <strong className="text-[#4ade80]">{log.saved}</strong>
                      </div>
                      <div className="bg-[#0f141c] p-2 rounded border border-[#212936]">
                        <span className="text-[10px] text-[#8e9aa8] block">ডুপ্লিকেট বাদ</span>
                        <strong className="text-[#94a3b8]">{log.skipped}</strong>
                      </div>
                      <div className="bg-[#0f141c] p-2 rounded border border-[#212936]">
                        <span className="text-[10px] text-[#8e9aa8] block">তারিখ অমিল</span>
                        <strong className="text-[#f5c66b]">{log.dateMismatched}</strong>
                      </div>
                      <div className="bg-[#0f141c] p-2 rounded border border-[#212936]">
                        <span className="text-[10px] text-[#8e9aa8] block">ত্রুটি (Errors)</span>
                        <strong className={log.errors > 0 ? "text-red-400" : "text-[#94a3b8]"}>
                          {log.errors}
                        </strong>
                      </div>
                    </div>

                    {log.items && log.items.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[11px] text-[#cbd5e1] font-semibold mb-1">
                          সংগৃহীত আর্টিকেলের নমুনা:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {log.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-[#0f141c] text-[#cbd5e1] px-2 py-1 rounded border border-[#212936] truncate max-w-xs"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ARTICLE MODERATION & REVIEW */}
        {activeTab === "articles" && (
          <div className="space-y-4">
            <div className="bg-[#141b24] border border-[#212936] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white font-serif">
                  সংগৃহীত সংবাদ ও কন্টেন্ট মডারেশন (Article Content Moderation)
                </h2>
                <p className="text-xs text-[#8e9aa8]">
                  উভয় মোডের (চাকরি ও বিসিএস প্রস্তুতি বনাম English Learning) প্রতিবেদন রিভিউ ও লার্নিং টুলস পরিদর্শন
                </p>
              </div>
              <button
                onClick={refreshAllData}
                className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#283548] text-[#cbd5e1] text-xs rounded border border-[#334155] transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>রিফ্রেশ তালিকা</span>
              </button>
            </div>

            {/* Mode Filtering Filter Bar */}
            <div className="bg-[#141b24] border border-[#212936] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#8e9aa8] flex items-center gap-1.5 mr-1 font-medium">
                  <Filter className="w-3.5 h-3.5" /> মোড অনুযায়ী ফিল্টার:
                </span>
                <button
                  onClick={() => setArticleFilterMode("all")}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    articleFilterMode === "all"
                      ? "bg-[#334155] text-white shadow-sm ring-1 ring-[#475569]"
                      : "bg-[#1e293b] text-[#94a3b8] hover:text-white hover:bg-[#283548]"
                  }`}
                >
                  <span>সকল প্রতিবেদন</span>
                  <span className="px-1.5 py-0.5 bg-[#0f141c] rounded-full text-[10px] text-[#cbd5e1]">
                    {articles.length}
                  </span>
                </button>
                <button
                  onClick={() => setArticleFilterMode("job_prep")}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    articleFilterMode === "job_prep"
                      ? "bg-[#842323] text-white shadow-sm ring-1 ring-[#b91c1c]"
                      : "bg-[#1e293b] text-[#fca5a5] hover:bg-[#842323]/20"
                  }`}
                >
                  <span>চাকরি ও বিসিএস</span>
                  <span className="px-1.5 py-0.5 bg-[#0f141c] rounded-full text-[10px] text-[#fca5a5]">
                    {bnArticlesCount}
                  </span>
                </button>
                <button
                  onClick={() => setArticleFilterMode("english")}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    articleFilterMode === "english"
                      ? "bg-[#0284c7] text-white shadow-sm ring-1 ring-[#38bdf8]"
                      : "bg-[#1e293b] text-[#7dd3fc] hover:bg-[#0284c7]/20"
                  }`}
                >
                  <span>English Learning</span>
                  <span className="px-1.5 py-0.5 bg-[#0f141c] rounded-full text-[10px] text-[#7dd3fc]">
                    {enArticlesCount}
                  </span>
                </button>
              </div>

              <div className="text-xs text-[#8e9aa8] font-mono">
                প্রদর্শিত: <span className="text-white font-bold">{displayedArticles.length}</span> টি
              </div>
            </div>

            <div className="bg-[#141b24] border border-[#212936] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#18202c] border-b border-[#212936] text-[#8e9aa8] uppercase text-[10px] tracking-wider font-mono">
                    <tr>
                      <th className="px-4 py-3">শিরোনাম ও বিভাগ</th>
                      <th className="px-4 py-3">উৎস ও তারিখ</th>
                      <th className="px-4 py-3 text-center">লার্নিং টুলস</th>
                      <th className="px-4 py-3 text-center">ক্যাপসুল</th>
                      <th className="px-4 py-3 text-center">প্রধান লিড</th>
                      <th className="px-4 py-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#212936]">
                    {displayedArticles.map((art) => {
                      const isEnglish = !isBengaliText(art.title);
                      return (
                        <tr key={art.id} className="hover:bg-[#18212e]/50 transition">
                          <td className="px-4 py-3 max-w-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                              {isEnglish ? (
                                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-bold bg-[#0369a1]/25 text-[#7dd3fc] border border-[#0284c7]/40">
                                  English Mode
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-bold bg-[#842323]/25 text-[#fca5a5] border border-[#842323]/40">
                                  চাকরি প্রস্তুতি
                                </span>
                              )}
                              <span className="text-[10px] text-[#38bdf8]">
                                বিভাগ: {art.category?.name || "সাধারণ"}
                              </span>
                            </div>
                            <Link
                              href={`/article/${art.slug}`}
                              target="_blank"
                              className="font-semibold text-white hover:text-[#f5c66b] line-clamp-2"
                            >
                              {art.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-[#94a3b8] text-[11px] whitespace-nowrap">
                            <div>{art.imageCaption || "উৎস: অনলাইন"}</div>
                            <div className="text-[10px] text-[#64748b]">{art.publishedAt}</div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[11px] bg-[#1e293b] text-[#cbd5e1] px-2 py-0.5 rounded border border-[#334155]">
                                {art._count?.quizQuestions || (art.quizQuestions?.length ?? 0)} কুইজ • {art._count?.vocabulary || (art.vocabulary?.length ?? 0)} শব্দ
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewArticle(art);
                                  setPreviewTab("vocab");
                                }}
                                className="text-[10px] text-[#f5c66b] hover:text-[#fbbf24] underline flex items-center gap-1 transition font-medium"
                              >
                                <Eye className="w-3 h-3" /> টুলস প্রিভিউ
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleFlag(art.id, "isCapsule")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                art.isCapsule
                                  ? "bg-[#065f46] text-[#a7f3d0] border-[#059669]"
                                  : "bg-[#1e293b] text-[#64748b] border-[#334155]"
                              }`}
                            >
                              {art.isCapsule ? "সক্রিয়" : "বন্ধ"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleFlag(art.id, "isLead")}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                art.isLead
                                  ? "bg-[#842323] text-[#fca5a5] border-[#842323]"
                                  : "bg-[#1e293b] text-[#64748b] border-[#334155]"
                              }`}
                            >
                              {art.isLead ? "লিড" : "সাধারণ"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/article/${art.slug}`}
                                target="_blank"
                                className="p-1 text-[#38bdf8] hover:text-white hover:bg-[#0369a1] rounded transition"
                                title="সাইটে দেখুন"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteArticle(art.id, art.title)}
                                className="p-1 text-[#f87171] hover:text-white hover:bg-[#7f1d1d] rounded transition"
                                title="প্রতিবেদন মুছুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal: Add New Newspaper Source */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141b24] border border-[#2b3545] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#212936] pb-3">
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#f5c66b]" />
                <span>নতুন সংবাদপত্র উৎস যোগ করুন</span>
              </h3>
              <button
                onClick={() => setShowAddSourceModal(false)}
                className="text-[#94a3b8] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSource} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">সংবাদপত্রের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ঢাকা পোস্ট, ডেইলি স্টার"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  className="w-full p-2.5 bg-[#0f141c] border border-[#2b3545] rounded text-white outline-none focus:border-[#f5c66b]"
                />
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">আরএসএস ফিড URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/feed"
                  value={newFeedUrl}
                  onChange={(e) => setNewFeedUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#0f141c] border border-[#2b3545] rounded text-white font-mono outline-none focus:border-[#f5c66b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">ভাষা</label>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value as any)}
                    className="w-full p-2.5 bg-[#0f141c] border border-[#2b3545] rounded text-white outline-none"
                  >
                    <option value="bn">বাংলা (newspapers_bn.csv)</option>
                    <option value="en">English (newspapers_en.csv)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#cbd5e1] font-semibold mb-1">বিভাগ</label>
                  <select
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    className="w-full p-2.5 bg-[#0f141c] border border-[#2b3545] rounded text-white outline-none"
                  >
                    <option value="national">জাতীয় পরিক্রমা</option>
                    <option value="economy">অর্থনীতি ও ব্যাংকিং</option>
                    <option value="tech">বিজ্ঞান ও প্রযুক্তি</option>
                    <option value="world">আন্তর্জাতিক সম্পর্ক</option>
                    <option value="opinion">সম্পাদকীয় ও কলাম</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#cbd5e1] font-semibold mb-1">পরীক্ষা ট্র্যাক ট্যাগ</label>
                <input
                  type="text"
                  placeholder="যেমন: বিসিএস ও বিশ্ববিদ্যালয় ভর্তি"
                  value={newExamTrack}
                  onChange={(e) => setNewExamTrack(e.target.value)}
                  className="w-full p-2.5 bg-[#0f141c] border border-[#2b3545] rounded text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSourceModal(false)}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-[#283548] text-[#94a3b8] rounded font-semibold transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={addingSource}
                  className="px-5 py-2 bg-[#842323] hover:bg-[#9c2b2b] text-white rounded font-bold transition disabled:opacity-50"
                >
                  {addingSource ? "যুক্ত হচ্ছে..." : "উৎস সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* Learning Tools Preview Modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141b24] border border-[#2b3545] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#212936] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!isBengaliText(previewArticle.title) ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0369a1]/30 text-[#7dd3fc] border border-[#0284c7]/50 inline-flex items-center gap-1">
                      English Learning Mode
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#842323]/30 text-[#fca5a5] border border-[#842323]/50 inline-flex items-center gap-1">
                      চাকরি ও বিসিএস প্রস্তুতি
                    </span>
                  )}
                  <span className="text-xs text-[#94a3b8]">
                    {previewArticle.category?.name || "সাধারণ"} • {previewArticle.publishedAt}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white font-serif line-clamp-2">
                  {previewArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1.5 text-[#94a3b8] hover:text-white hover:bg-[#1e293b] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subheader Tabs */}
            <div className="px-5 pt-3 border-b border-[#212936] flex items-center gap-4 bg-[#101620]">
              <button
                onClick={() => setPreviewTab("vocab")}
                className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                  previewTab === "vocab"
                    ? "border-[#f5c66b] text-[#f5c66b]"
                    : "border-transparent text-[#8e9aa8] hover:text-[#cbd5e1]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  শব্দভাণ্ডার ম্যাট্রিক্স ({previewArticle.vocabulary?.length || 0})
                </span>
              </button>
              <button
                onClick={() => setPreviewTab("quiz")}
                className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
                  previewTab === "quiz"
                    ? "border-[#f5c66b] text-[#f5c66b]"
                    : "border-transparent text-[#8e9aa8] hover:text-[#cbd5e1]"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>
                  অ্যাক্টিভ রিকল কুইজ ({previewArticle.quizQuestions?.length || 0})
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {previewTab === "vocab" && (
                <div>
                  {!previewArticle.vocabulary || previewArticle.vocabulary.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[#64748b]">
                      এই প্রতিবেদনের জন্য কোনো শব্দভাণ্ডার পাওয়া যায়নি।
                    </div>
                  ) : !isBengaliText(previewArticle.title) ? (
                    /* 3-Column Vocabulary Table for English Mode */
                    <div className="border border-[#2b3545] rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#18202c] border-b border-[#2b3545] text-[#94a3b8] font-mono text-[11px]">
                          <tr>
                            <th className="px-3.5 py-2.5 w-[30%]">শব্দ ও সিলেবল উচ্চারণ</th>
                            <th className="px-3.5 py-2.5 w-[35%]">অর্থ ও সংজ্ঞা</th>
                            <th className="px-3.5 py-2.5 w-[35%]">বাস্তব প্রয়োগের উদাহরণ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#212936]">
                          {previewArticle.vocabulary.map((v: any, idx: number) => {
                            const phonetics = getEnToBnPhonetics(v.term);
                            return (
                              <tr key={idx} className="hover:bg-[#18212e]/50">
                                <td className="px-3.5 py-3 align-top">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">
                                      {v.term}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleSpeakWord(v.term)}
                                      className={`p-1 rounded transition ${
                                        speakingTerm === v.term
                                          ? "bg-[#38bdf8] text-[#0f172a]"
                                          : "text-[#38bdf8] hover:bg-[#0369a1]/30"
                                      }`}
                                      title="উচ্চারণ শুনুন"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {phonetics && (
                                    <div className="text-[11px] text-[#fbbf24] font-medium mt-0.5">[{phonetics}]</div>
                                  )}
                                </td>
                                <td className="px-3.5 py-3 align-top text-[#cbd5e1] space-y-1">
                                  <div className="font-semibold text-white">
                                    {v.definition}
                                  </div>
                                </td>
                                <td className="px-3.5 py-3 align-top text-[#94a3b8] text-[11px] leading-relaxed">
                                  {v.context ? (
                                    <div className="bg-[#0f141c] p-2 rounded border border-[#1e293b] italic">
                                      {v.context}
                                    </div>
                                  ) : (
                                    <span className="text-[#64748b]">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* Job Prep Mode Vocabulary List */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {previewArticle.vocabulary.map((v: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-[#0f141c] border border-[#212936] p-3 rounded-lg space-y-1"
                        >
                          <div className="font-bold text-[#f5c66b] text-sm">{v.term}</div>
                          <div className="text-xs text-[#e2e8f0]">{v.definition}</div>
                          {v.context && (
                            <div className="text-[11px] text-[#8e9aa8] italic pt-1 border-t border-[#1e293b]">
                              প্রসঙ্গ: {v.context}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {previewTab === "quiz" && (
                <div className="space-y-4">
                  {!previewArticle.quizQuestions || previewArticle.quizQuestions.length === 0 ? (
                    <div className="text-center py-10 text-xs text-[#64748b]">
                      এই প্রতিবেদনের জন্য কোনো কুইজ প্রশ্ন পাওয়া যায়নি।
                    </div>
                  ) : (
                    previewArticle.quizQuestions.map((q: any, idx: number) => {
                      let options: string[] = [];
                      try {
                        options = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
                      } catch {
                        options = [];
                      }
                      return (
                        <div
                          key={idx}
                          className="bg-[#0f141c] border border-[#212936] rounded-xl p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-sm font-semibold text-white">
                              <span className="text-[#f5c66b] mr-2">প্রশ্ন {idx + 1}:</span>
                              {q.question}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {options.map((opt: string, optIdx: number) => {
                              const isCorrect = optIdx === q.correctOption;
                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                                    isCorrect
                                      ? "bg-[#065f46]/20 border-[#059669] text-[#a7f3d0] font-medium"
                                      : "bg-[#141b24] border-[#212936] text-[#cbd5e1]"
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {isCorrect && (
                                    <span className="shrink-0 px-1.5 py-0.5 bg-[#059669] text-white rounded text-[10px] font-bold">
                                      সঠিক
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="text-[11px] text-[#94a3b8] bg-[#141b24] p-2.5 rounded-lg border border-[#1e293b]">
                              <span className="text-[#fbbf24] font-semibold mr-1">ব্যাখ্যা:</span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#212936] bg-[#101620] flex items-center justify-between gap-3">
              <Link
                href={`/article/${previewArticle.slug}`}
                target="_blank"
                className="text-xs text-[#38bdf8] hover:underline flex items-center gap-1 font-medium"
              >
                <span>মূল প্রতিবেদনে দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setPreviewArticle(null)}
                className="px-4 py-1.5 bg-[#1e293b] hover:bg-[#283548] text-white text-xs font-semibold rounded-lg transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

