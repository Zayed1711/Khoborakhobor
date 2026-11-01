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
} from "lucide-react";
import UserManagementTab from "./UserManagementTab";

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
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState<"spider" | "users" | "sources" | "history" | "articles" | "scheduler">("spider");

  // Cron / Scheduler state
  const [cronTestRunning, setCronTestRunning] = useState(false);
  const [cronTestResponse, setCronTestResponse] = useState<any>(null);
  const [cronTestDryRun, setCronTestDryRun] = useState(true);
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

  // Spider Run Form State
  const [targetDate, setTargetDate] = useState(todayStr);
  const [language, setLanguage] = useState<"all" | "bn" | "en">("all");
  const [categorySlug, setCategorySlug] = useState("all");
  const [sourceName, setSourceName] = useState("all");
  const [limitPerSource, setLimitPerSource] = useState(15);
  const [dryRun, setDryRun] = useState(false);
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
      const res = await triggerSpiderCrawlAction({
        targetDate,
        language,
        categorySlug: categorySlug === "all" ? undefined : categorySlug,
        sourceName: sourceName === "all" ? undefined : sourceName,
        dryRun,
        limitPerSource,
      });

      if (res.success && res.data) {
        setRunResult(res.data);
        showNotify("success", res.message);
        refreshAllData();
      } else {
        showNotify("error", res.message);
      }
    } catch (err: any) {
      showNotify("error", err.message || "স্পাইডার চালাতে ত্রুটি হয়েছে।");
    } finally {
      setSpiderRunning(false);
    }
  };

  // Test Cron Webhook API
  const handleTestCronApi = async () => {
    setCronTestRunning(true);
    setCronTestResponse(null);
    try {
      const res = await fetch(`/api/cron/spider?dryRun=${cronTestDryRun}&language=all`);
      const data = await res.json();
      setCronTestResponse(data);
      if (data.success) {
        showNotify("success", data.message || "ক্রন টেস্ট সফলভাবে সম্পন্ন হয়েছে।");
        refreshAllData();
      } else {
        showNotify("error", data.error || "ক্রন টেস্ট ব্যর্থ হয়েছে।");
      }
    } catch (err: any) {
      showNotify("error", err.message || "ক্রন এন্ডপয়েন্টে সংযোগ ব্যর্থ হয়েছে।");
      setCronTestResponse({ success: false, error: err.message });
    } finally {
      setCronTestRunning(false);
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                    {stats.lastRun.targetDate} ({stats.lastRun.saved} সেভড)
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
            <span>ব্যবহারকারী ও অ্যাকাউন্ট ব্যবস্থাপনা (Users & Accounts)</span>
          </button>

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

        {/* TAB 1: SPIDER CONTROL CENTER */}
        {activeTab === "spider" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Control Panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#141b24] border border-[#212936] rounded-xl p-5 space-y-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between border-b border-[#212936] pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#f5c66b]" />
                    <div>
                      <h2 className="text-sm font-bold text-white font-serif uppercase tracking-wider">
                        স্পাইডার এক্সিকিউশন প্যারামিটার (Execution Parameters)
                      </h2>
                      <p className="text-[11px] text-[#4ade80] flex items-center gap-1 mt-0.5 font-medium">
                        <Shield className="w-3 h-3 text-[#4ade80]" />
                        <span>বিসিএস ও ভর্তি পরীক্ষা ফিল্টার সক্রিয় • তথ্য ছক ও সোর্স লিংক অটো-ইনজেস্ট</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] bg-[#1e293b] text-[#4ade80] px-2.5 py-0.5 rounded border border-[#059669]/40 font-mono">
                    System Ready
                  </span>
                </div>

                {/* Form Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Target Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <label className="text-xs font-semibold text-[#cbd5e1] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>সংবাদের তারিখ (Target Date)</span>
                      </label>
                      <div className="flex gap-1 text-[10px] flex-wrap">
                        <button
                          type="button"
                          onClick={() => setTargetDate("all")}
                          className={`px-2 py-0.5 rounded border transition font-semibold ${
                            targetDate === "all"
                              ? "bg-[#059669] text-white border-[#059669] shadow-2xs"
                              : "bg-[#1e293b] text-[#94a3b8] border-[#334155] hover:text-white"
                          }`}
                          title="তারিখের সীমাবদ্ধতা ছাড়া সকল সংবাদ ক্রল করুন"
                        >
                          যে কোনো তারিখ
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetDate(todayStr)}
                          className={`px-1.5 py-0.5 rounded border transition ${
                            targetDate === todayStr
                              ? "bg-[#842323] text-white border-[#842323]"
                              : "bg-[#1e293b] text-[#94a3b8] border-[#334155] hover:text-white"
                          }`}
                        >
                          আজ
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetDate(yesterdayStr)}
                          className={`px-1.5 py-0.5 rounded border transition ${
                            targetDate === yesterdayStr
                              ? "bg-[#842323] text-white border-[#842323]"
                              : "bg-[#1e293b] text-[#94a3b8] border-[#334155] hover:text-white"
                          }`}
                        >
                          গতকাল
                        </button>
                        <button
                          type="button"
                          onClick={() => setTargetDate("7days")}
                          className={`px-1.5 py-0.5 rounded border transition ${
                            targetDate === "7days"
                              ? "bg-[#38bdf8] text-[#0f172a] font-bold border-[#38bdf8]"
                              : "bg-[#1e293b] text-[#94a3b8] border-[#334155] hover:text-white"
                          }`}
                          title="বিগত ৭ দিনের সকল সংবাদ সংকলন করুন"
                        >
                          গত ৭ দিন
                        </button>
                      </div>
                    </div>

                    {targetDate === "all" ? (
                      <div className="flex items-center justify-between p-2.5 bg-[#0f141c] border border-[#059669]/60 rounded-lg text-xs">
                        <span className="text-[#4ade80] font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse shrink-0" />
                          <span>যে কোনো তারিখ (তারিখের সীমাবদ্ধতা ছাড়া সমস্ত ফিড সংকলন)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setTargetDate(todayStr)}
                          className="text-[10px] text-[#38bdf8] hover:underline font-mono shrink-0 ml-2"
                        >
                          নির্দিষ্ট দিন নির্বাচন
                        </button>
                      </div>
                    ) : targetDate === "7days" ? (
                      <div className="flex items-center justify-between p-2.5 bg-[#0f141c] border border-[#38bdf8]/60 rounded-lg text-xs">
                        <span className="text-[#38bdf8] font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse shrink-0" />
                          <span>বিগত ৭ দিন (এক সপ্তাহের সংবাদ সংকলন)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setTargetDate(todayStr)}
                          className="text-[10px] text-[#94a3b8] hover:underline font-mono shrink-0 ml-2"
                        >
                          নির্দিষ্ট দিন নির্বাচন
                        </button>
                      </div>
                    ) : (
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full text-xs p-2.5 bg-[#0f141c] border border-[#2b3545] rounded-lg text-white font-mono outline-none focus:border-[#f5c66b]"
                        title="যেকোনো নির্দিষ্ট ক্যালেন্ডার তারিখ নির্বাচন করুন"
                      />
                    )}
                  </div>

                  {/* Language Selection */}
                  <div>
                    <label className="text-xs font-semibold text-[#cbd5e1] block mb-1.5">
                      সংবাদ মাধ্যমের ভাষা (Language)
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="w-full text-xs p-2.5 bg-[#0f141c] border border-[#2b3545] rounded-lg text-white outline-none focus:border-[#f5c66b]"
                    >
                      <option value="all">উভয় মাধ্যম (বাংলা ও ইংরেজি সংবাদপত্র)</option>
                      <option value="bn">শুধুমাত্র বাংলা সংবাদপত্র (newspapers_bn.csv)</option>
                      <option value="en">শুধুমাত্র ইংরেজি সংবাদপত্র (newspapers_en.csv)</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="text-xs font-semibold text-[#cbd5e1] block mb-1.5">
                      নির্দিষ্ট বিভাগ ফিল্টার (Category Filter)
                    </label>
                    <select
                      value={categorySlug}
                      onChange={(e) => setCategorySlug(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#0f141c] border border-[#2b3545] rounded-lg text-white outline-none focus:border-[#f5c66b]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target Newspaper */}
                  <div>
                    <label className="text-xs font-semibold text-[#cbd5e1] block mb-1.5">
                      নির্দিষ্ট সংবাদপত্র নির্বাচন (Target Source)
                    </label>
                    <select
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-[#0f141c] border border-[#2b3545] rounded-lg text-white outline-none focus:border-[#f5c66b]"
                    >
                      <option value="all">সকল সংযুক্ত পত্রিকা (All Sources)</option>
                      {sources.map((s, idx) => (
                        <option key={idx} value={s.name}>
                          {s.name} ({s.language === "bn" ? "বাংলা" : "ইংরেজি"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fetch Limit per source */}
                  <div>
                    <label className="text-xs font-semibold text-[#cbd5e1] block mb-1.5">
                      প্রতি পত্রিকা থেকে সর্বোচ্চ সংবাদ সীমা (Limit per Source)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={limitPerSource}
                      onChange={(e) => setLimitPerSource(Number(e.target.value))}
                      className="w-full text-xs p-2.5 bg-[#0f141c] border border-[#2b3545] rounded-lg text-white font-mono outline-none focus:border-[#f5c66b]"
                    />
                  </div>

                  {/* Dry Run Toggle */}
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2.5 text-xs text-[#cbd5e1] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={dryRun}
                        onChange={(e) => setDryRun(e.target.checked)}
                        className="w-4 h-4 accent-[#f5c66b] rounded"
                      />
                      <span>
                        <strong className="text-[#f5c66b]">ড্রাই-রান মোড (Dry-Run Preview)</strong>:{" "}
                        <span className="text-[#94a3b8]">ডেটাবেজে সেভ না করে টেস্ট করুন</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleExecuteSpider}
                    disabled={spiderRunning}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#842323] to-[#a32d2d] hover:from-[#9c2b2b] hover:to-[#bd3535] text-white font-bold text-sm rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {spiderRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#f5c66b]" />
                        <span>স্পাইডার ক্রলিং ও বিশ্লেষণ সক্রিয় রয়েছে...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-[#f5c66b]" />
                        <span>
                          {dryRun
                            ? "স্পাইডার টেস্ট চালান (Preview Dry Run)"
                            : "স্পাইডার ক্রলার চালু করুন (Run Live Crawl)"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Execution Console Output */}
              <div className="bg-[#0b0f15] border border-[#1e2633] rounded-xl p-4 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between border-b border-[#1b222e] pb-2 mb-3">
                  <div className="flex items-center gap-2 text-[#94a3b8]">
                    <Terminal className="w-4 h-4 text-[#4ade80]" />
                    <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                      ক্রলার টার্মিনাল কনসোল (Live Execution Logs)
                    </span>
                  </div>
                  {runResult && (
                    <span className="text-[10px] text-[#4ade80]">
                      সময়: {(runResult.durationMs / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>

                {spiderRunning && (
                  <div className="py-6 flex flex-col items-center justify-center gap-3 text-[#94a3b8]">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#f5c66b]" />
                    <p className="text-xs animate-pulse text-[#f5c66b]">
                      সংবাদ উৎসসমূহ স্ক্যান করা হচ্ছে... তারিখ ও কন্টেন্ট বিশ্লেষণ চলছে...
                    </p>
                  </div>
                )}

                {!spiderRunning && !runResult && (
                  <div className="text-[#64748b] py-6 text-center text-xs">
                    স্পাইডার ক্রলার রান করার পর এখানে রিয়েলটাইম আউটপুট, হেডলাইন এবং পরিসংখ্যান প্রদর্শিত হবে।
                  </div>
                )}

                {!spiderRunning && runResult && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] border-b border-[#1b222e] pb-3">
                      <div className="bg-[#141b24] p-2 rounded border border-[#212936]">
                        <span className="text-[#8e9aa8] block">লক্ষ্য তারিখ:</span>
                        <strong className="text-white">
                          {runResult.targetDate === "all"
                            ? "যে কোনো তারিখ"
                            : runResult.targetDate === "7days"
                            ? "বিগত ৭ দিন"
                            : runResult.targetDate}
                        </strong>
                      </div>
                      <div className="bg-[#141b24] p-2 rounded border border-[#212936]">
                        <span className="text-[#8e9aa8] block">স্ক্যানকৃত সোর্স:</span>
                        <strong className="text-[#38bdf8]">{runResult.sourcesCount} টি</strong>
                      </div>
                      <div className="bg-[#141b24] p-2 rounded border border-[#212936]">
                        <span className="text-[#8e9aa8] block">সংরক্ষিত / ম্যাচড:</span>
                        <strong className="text-[#4ade80]">{runResult.saved} টি</strong>
                      </div>
                      <div className="bg-[#141b24] p-2 rounded border border-[#212936]">
                        <span className="text-[#8e9aa8] block">নন-এক্সাম ছাঁটাই:</span>
                        <strong className="text-rose-400">{(runResult as any).filteredExamNoise ?? 0} টি</strong>
                      </div>
                      <div className="bg-[#141b24] p-2 rounded border border-[#212936]">
                        <span className="text-[#8e9aa8] block">তারিখ অমিল:</span>
                        <strong className="text-[#f5c66b]">{runResult.dateMismatched} টি</strong>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-bold text-[#cbd5e1] mb-1.5 flex items-center justify-between">
                        <span>সংগৃহীত সংবাদ শিরোনাম ({runResult.items.length})</span>
                        {runResult.dryRun && (
                          <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                            ড্রাই-রান প্রিভিউ
                          </span>
                        )}
                      </h4>
                      {runResult.items.length === 0 ? (
                        <p className="text-[#64748b] text-[11px]">
                          নির্বাচিত তারিখে কোনো নতুন সংবাদ মেলেনি অথবা সবগুলো ইতিমধ্যে সংরক্ষিত রয়েছে।
                        </p>
                      ) : (
                        <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
                          {runResult.items.map((item: string, i: number) => (
                            <li
                              key={i}
                              className="text-[11px] text-[#94a3b8] flex items-start gap-1.5 bg-[#141b24]/60 p-1.5 rounded"
                            >
                              <span className="text-[#4ade80] shrink-0 font-bold">•</span>
                              <span className="text-[#e2e8f0]">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Quick Guidelines & System Specs */}
            <div className="space-y-4">
              <div className="bg-[#141b24] border border-[#212936] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-serif tracking-wider">
                  <Shield className="w-4 h-4 text-[#38bdf8]" />
                  <span>ক্রলার পরিচালনা নীতিমালা</span>
                </h3>
                <ul className="text-xs text-[#94a3b8] space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#f5c66b]">•</span>
                    <span>
                      <strong>তারিখ ফিল্টারিং:</strong> আরএসএস ফিডের <code>pubDate</code> বা <code>isoDate</code> যাচাই করে নির্দিষ্ট দিনের সংবাদ ছাঁটাই করা হয়।
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#f5c66b]">•</span>
                    <span>
                      <strong>ডুপ্লিকেট প্রতিরোধ:</strong> স্ল্যাগ এবং শিরোনামের ভিত্তিতে পূর্বে সংরক্ষিত সংবাদ স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়।
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#4ade80]">•</span>
                    <span>
                      <strong>বিসিএস ও ভর্তি ফিল্টারিং (AI Gatekeeper):</strong> পারিবারিক বিরোধ, জমি কোন্দল ও সাধারণ সেলিব্রিটি গসিপ স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়; সড়ক দুর্ঘটনা জরিপ ও ক্রীড়া পুরস্কার লিখিত পরীক্ষার জন্য সংরক্ষিত থাকে।
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#38bdf8]">•</span>
                    <span>
                      <strong>তথ্য ছক ও সোর্স লিঙ্কিং:</strong> প্রতিটি সংবাদের সাথে সুনির্দিষ্ট উপাত্ত, নিয়ন্ত্রক প্রতিষ্ঠান ও সিলেবাস কোণ যুক্ত হয়ে ফ্যাক্ট টেবিল ও বিস্তারিত আউটবাউন্ড লিংক তৈরি হয়।
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#f5c66b]">•</span>
                    <span>
                      <strong>এডটেক প্রসেসিং:</strong> সংবাদ সেভ করার সময় স্বয়ংক্রিয়ভাবে ৩টি মূলবিন্দু, ধারণাগত শব্দকোষ এবং কুইজ তৈরি হয়।
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#f5c66b]">•</span>
                    <span>
                      <strong>ড্রাই-রান:</strong> লাইভ ডেটাবেজ স্পর্শ না করে ফিড পরীক্ষা করার নিরাপদ পদ্ধতি।
                    </span>
                  </li>
                </ul>
              </div>

              {/* Quick Feed Tester Card */}
              <div className="bg-[#141b24] border border-[#212936] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-serif tracking-wider">
                  <Activity className="w-4 h-4 text-[#4ade80]" />
                  <span>দ্রুত ফিড পিং / টেস্ট (Quick Ping)</span>
                </h3>
                <p className="text-[11px] text-[#94a3b8]">
                  সংযুক্ত যে কোনো সংবাদপত্রের আরএসএস সচল কিনা অবিলম্বে পরীক্ষা করুন:
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {sources.slice(0, 6).map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-[#0f141c] p-2 rounded border border-[#212936]"
                    >
                      <div className="truncate max-w-[140px]">
                        <span className="font-semibold text-white truncate block">{s.name}</span>
                        <span className="text-[10px] text-[#64748b] block">{s.language === "bn" ? "বাংলা" : "English"}</span>
                      </div>
                      <button
                        onClick={() => handleTestFeed(s.feedUrl)}
                        disabled={testingUrl === s.feedUrl}
                        className="px-2 py-1 bg-[#1e293b] hover:bg-[#283548] text-[#38bdf8] text-[10px] rounded font-mono font-bold transition disabled:opacity-50"
                      >
                        {testingUrl === s.feedUrl ? "চেকিং..." : "টেস্ট ফিড"}
                      </button>
                    </div>
                  ))}
                </div>

                {Object.keys(testResult).length > 0 && (
                  <div className="bg-[#0b0f15] p-2.5 rounded border border-[#1b222e] text-[11px]">
                    {Object.entries(testResult).slice(-1).map(([url, res]: any, i) => (
                      <div key={i}>
                        {res.success ? (
                          <div className="text-[#4ade80] space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>ফিড সচল রয়েছে ({res.itemCount} টি আইটেম)</span>
                            </div>
                            <div className="text-[10px] text-[#cbd5e1] truncate">
                              শিরোনাম: {res.sampleTitles?.[0] || "N/A"}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[#f87171] flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>সংযোগ ব্যর্থ: {res.error}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
                            {s.language === "bn" ? "বাংলা (BN)" : "English (EN)"}
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
                        Bearer Token বা ?secret=
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
                    <label className="flex items-center gap-2 text-xs text-[#cbd5e1] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cronTestDryRun}
                        onChange={(e) => setCronTestDryRun(e.target.checked)}
                        className="w-4 h-4 accent-[#f5c66b] rounded"
                      />
                      <span>
                        <strong className="text-[#f5c66b]">ড্রাই-রান মোড</strong> (সেভ না করে টেস্ট করুন)
                      </span>
                    </label>

                    <button
                      onClick={handleTestCronApi}
                      disabled={cronTestRunning}
                      className="px-4 py-2 bg-[#842323] hover:bg-[#9c2b2b] text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {cronTestRunning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#f5c66b]" />
                          <span>এক্সিকিউট হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-[#f5c66b]" />
                          <span>ক্রন ট্রিগার করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Response Output Box */}
                {cronTestResponse && (
                  <div className="mt-4 pt-3 border-t border-[#212936] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-[#4ade80]" />
                        <span>API রেসপন্স:</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          cronTestResponse.success
                            ? "bg-[#064e3b] text-[#34d399]"
                            : "bg-[#7f1d1d] text-[#f87171]"
                        }`}
                      >
                        {cronTestResponse.success ? "200 OK" : "FAILED"}
                      </span>
                    </div>
                    <pre className="bg-[#0b0f15] border border-[#1b222e] p-3 rounded text-[11px] font-mono text-[#cbd5e1] overflow-x-auto max-h-56">
                      {JSON.stringify(cronTestResponse, null, 2)}
                    </pre>
                  </div>
                )}
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
                  স্পাইডার দ্বারা তৈরিকৃত প্রতিবেদন রিভিউ, লিড/ক্যাপসুল টগল এবং অপসারণ
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
                    {articles.map((art) => (
                      <tr key={art.id} className="hover:bg-[#18212e]/50 transition">
                        <td className="px-4 py-3 max-w-sm">
                          <Link
                            href={`/article/${art.slug}`}
                            target="_blank"
                            className="font-semibold text-white hover:text-[#f5c66b] line-clamp-2"
                          >
                            {art.title}
                          </Link>
                          <span className="text-[10px] text-[#38bdf8] mt-0.5 block">
                            বিভাগ: {art.category?.name || "সাধারণ"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#94a3b8] text-[11px] whitespace-nowrap">
                          <div>{art.imageCaption || "উৎস: অনলাইন"}</div>
                          <div className="text-[10px] text-[#64748b]">{art.publishedAt}</div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="text-[11px] bg-[#1e293b] text-[#cbd5e1] px-2 py-0.5 rounded border border-[#334155]">
                            {art._count?.quizQuestions || 0} কুইজ • {art._count?.vocabulary || 0} শব্দ
                          </span>
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
                        Bearer Token বা ?secret=
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
                    <label className="flex items-center gap-2 text-xs text-[#cbd5e1] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cronTestDryRun}
                        onChange={(e) => setCronTestDryRun(e.target.checked)}
                        className="w-4 h-4 accent-[#f5c66b] rounded"
                      />
                      <span>
                        <strong className="text-[#f5c66b]">ড্রাই-রান মোড</strong> (সেভ না করে টেস্ট করুন)
                      </span>
                    </label>

                    <button
                      onClick={handleTestCronApi}
                      disabled={cronTestRunning}
                      className="px-4 py-2 bg-[#842323] hover:bg-[#9c2b2b] text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {cronTestRunning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#f5c66b]" />
                          <span>এক্সিকিউট হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-[#f5c66b]" />
                          <span>ক্রন ট্রিগার করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Response Output Box */}
                {cronTestResponse && (
                  <div className="mt-4 pt-3 border-t border-[#212936] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-[#4ade80]" />
                        <span>API রেসপন্স:</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          cronTestResponse.success
                            ? "bg-[#064e3b] text-[#34d399]"
                            : "bg-[#7f1d1d] text-[#f87171]"
                        }`}
                      >
                        {cronTestResponse.success ? "200 OK" : "FAILED"}
                      </span>
                    </div>
                    <pre className="bg-[#0b0f15] border border-[#1b222e] p-3 rounded text-[11px] font-mono text-[#cbd5e1] overflow-x-auto max-h-56">
                      {JSON.stringify(cronTestResponse, null, 2)}
                    </pre>
                  </div>
                )}
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
    </div>
  );
}

