"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Search, Globe, Bookmark, Calendar, UserCheck, 
  ChevronDown, Menu, X, Zap, GraduationCap, BookOpen
} from "lucide-react";
import SearchModal from "./SearchModal";
import ThemeSwitcher from "./ThemeSwitcher";
import KhoborLogo from "./KhoborLogo";
import { getCurrentSession, UserSession } from "@/actions/auth";
import { useAppMode } from "@/context/LanguageContext";

interface HeaderProps {
  categories?: { id: string; name: string; slug: string }[];
  session?: UserSession | null;
}

const DEFAULT_CATEGORIES = [
  { id: "1", name: "জাতীয় পরিক্রমা", slug: "national" },
  { id: "2", name: "আন্তর্জাতিক সম্পর্ক", slug: "world" },
  { id: "3", name: "অর্থনীতি ও বাণিজ্য", slug: "economy" },
  { id: "4", name: "বিজ্ঞান ও প্রযুক্তি", slug: "tech" },
  { id: "5", name: "শিল্প, সাহিত্য ও সংস্কৃতি", slug: "entertainment" },
  { id: "6", name: "খেলাধুলা", slug: "sports" },
  { id: "7", name: "রাজনীতি ও সুশাসন", slug: "politics" },
  { id: "8", name: "সম্পাদকীয় ও কলাম", slug: "opinion" },
  { id: "9", name: "জীবনযাপন ও শিক্ষা", slug: "lifestyle" },
  { id: "10", name: "বিসিএস ও সাধারণ জ্ঞান", slug: "exam-prep" },
];

const ENGLISH_CATEGORY_NAMES: Record<string, string> = {
  national: "National & Policy",
  world: "Global Affairs",
  economy: "Business & Economy",
  tech: "Tech & Science",
  entertainment: "Culture & Arts",
  sports: "Sports & Fitness",
  politics: "Governance & Law",
  opinion: "Editorials & Opinions",
  lifestyle: "Lifestyle & Learning",
  "exam-prep": "Vocabulary & Exams",
};

export default function Header({ categories = DEFAULT_CATEGORIES, session }: HeaderProps) {
  const [sessionState, setSessionState] = useState<UserSession | null>(session || null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  
  const { mode, setMode, isEnglishMode } = useAppMode();

  useEffect(() => {
    if (session !== undefined) {
      setSessionState(session);
    } else {
      getCurrentSession()
        .then((s) => setSessionState(s))
        .catch(() => {});
    }
  }, [session]);

  const isLoggedIn = Boolean(sessionState?.role || sessionState?.student);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [currentDate, setCurrentDate] = useState("বুধবার, ২৮ অক্টোবর ২০২৬");

  useEffect(() => {
    try {
      const now = new Date();
      if (isEnglishMode) {
        const formatted = now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        setCurrentDate(formatted);
      } else {
        const formatted = now.toLocaleDateString("bn-BD", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        setCurrentDate(formatted);
      }
    } catch {
      // Keep initial
    }
  }, [isEnglishMode]);

  const primaryCategories = categories.slice(0, 5);
  const extraCategories = categories.slice(5);

  return (
    <>
      <header className="border-b border-[#e5e0d6] bg-[#ffffff] sticky top-0 z-40 shadow-[0_2px_8px_rgba(0,0,0,0.03)] select-none">
        {/* ======================================================== */}
        {/* MOBILE DEDICATED APP BAR (< md: Clean, 52px, 0 Clutter) */}
        {/* ======================================================== */}
        <div className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-[#ece7dc]">
          {/* Left: Mobile Brand Logo */}
          <KhoborLogo variant="compact" size="sm" showTagline={false} />

          {/* Right: Quick Ergonomic Controls */}
          <div className="flex items-center gap-1.5">
            {/* 1-Tap Platform Mode Toggle Pill */}
            <div className="inline-flex rounded-lg border border-[#ded8cc] bg-[#faf8f4] p-0.5 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setMode("job_prep")}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  !isEnglishMode ? "bg-[#842323] text-white shadow-2xs font-bold" : "text-[#555d6b]"
                }`}
                title="চাকরি ও বিসিএস"
              >
                <span>চাকরি</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("english_learning")}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  isEnglishMode ? "bg-[#1e40af] text-white shadow-2xs font-bold" : "text-[#555d6b]"
                }`}
                title="English Learning"
              >
                <span>English</span>
              </button>
            </div>

            {/* Eye-Care Theme Switcher */}
            <ThemeSwitcher compact />

            {/* Instant Search Button (40x40 touch target) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-8 h-8 rounded-lg border border-[#ded8cb] bg-[#faf8f4] flex items-center justify-center text-[#404652] hover:bg-[#ede7da] transition active:scale-95"
              aria-label="অনুসন্ধান করুন"
            >
              <Search className={`w-4 h-4 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
            </button>

            {/* Mobile Categories Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
              className="w-8 h-8 rounded-lg border border-[#ded8cb] bg-[#faf8f4] flex items-center justify-center text-[#404652] hover:bg-[#ede7da] transition"
              aria-label="বিভাগসমূহ"
              title="বিভাগসমূহ"
            >
              {isMobileCategoryOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Category Drawer (Optional deep-dive) */}
        {isMobileCategoryOpen && (
          <div className="md:hidden border-b border-[#ece7dc] bg-[#faf8f4] px-4 py-3 max-h-[60vh] overflow-y-auto animate-in slide-in-from-top duration-200 space-y-1">
            <span className="text-[11px] font-bold text-[#717887] uppercase tracking-wider block mb-2">
              {isEnglishMode ? "Explore Tracks & Categories" : "সংবাদ ও স্টাডি বিভাগসমূহ"}
            </span>
            <Link
              href="/"
              onClick={() => setIsMobileCategoryOpen(false)}
              className={`block px-3 py-2 rounded-lg font-bold text-xs ${
                isEnglishMode ? "text-[#1e40af] bg-blue-50" : "text-[#842323] bg-[#f5ebeb]"
              }`}
            >
              {isEnglishMode ? "All News Feed" : "প্রচ্ছদ (সকল খবর)"}
            </Link>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {categories.map((cat) => {
                const displayName = isEnglishMode
                  ? ENGLISH_CATEGORY_NAMES[cat.slug] || cat.name
                  : cat.name;

                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onClick={() => setIsMobileCategoryOpen(false)}
                    className="block px-2.5 py-2 text-xs text-[#3b414d] hover:bg-[#ede7da] bg-white rounded-lg border border-[#ded8cb] font-medium truncate"
                  >
                    {displayName}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DESKTOP HEADER (Preserved 100% with full institutional layout) */}
        {/* ======================================================== */}
        {/* Top Micro-Bar */}
        <div className="hidden md:block border-b border-[#ece7dc] text-[11px] text-[#555d6b] py-1.5 px-4 sm:px-8 bg-[#faf8f3]">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium text-[#404652]">
                <Calendar className="w-3.5 h-3.5 text-[#88909d]" />
                {currentDate}
              </span>
              <span className="hidden md:inline-block text-[#d5d0c4]">|</span>
              <span className="hidden md:inline-block text-[#606775]">
                {isEnglishMode ? "Dhaka: 28°C, Clear Sky" : "ঢাকা: ২৮° সেলসিয়াস, পরিচ্ছন্ন আবহাওয়া"}
              </span>
              <span className="hidden lg:inline-block text-[#d5d0c4]">|</span>
              <Link
                href="/capsule"
                className={`hidden lg:inline-flex items-center gap-1 font-semibold hover:underline ${
                  isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#f5c66b]" />
                <span>{isEnglishMode ? "Daily 5-Min Capsule" : "দৈনিক ৫-মিনিট ক্যাপসুল"}</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* PRIMARY PLATFORM MODE SWITCHER PILL */}
              <div
                id="platform-mode-switcher"
                className="inline-flex rounded-lg border border-[#ded8cc] bg-white p-0.5 shadow-2xs text-[11px] font-semibold"
              >
                <button
                  type="button"
                  onClick={() => setMode("job_prep")}
                  className={`px-2.5 py-0.5 rounded-md transition flex items-center gap-1 ${
                    !isEnglishMode
                      ? "bg-[#842323] text-white shadow-xs font-bold"
                      : "text-[#525a68] hover:text-[#1c1d21] hover:bg-[#ede7da]"
                  }`}
                  title="বিসিএস, ব্যাংক ও সরকারি চাকরি প্রস্তুতি মোড"
                >
                  <GraduationCap className="w-3 h-3" />
                  <span>চাকরি ও বিসিএস</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("english_learning")}
                  className={`px-2.5 py-0.5 rounded-md transition flex items-center gap-1 ${
                    isEnglishMode
                      ? "bg-[#1e40af] text-white shadow-xs font-bold"
                      : "text-[#525a68] hover:text-[#1c1d21] hover:bg-[#ede7da]"
                  }`}
                  title="ইংরেজি সম্পাদকীয় পাঠ ও ভোকাবুলারি শিক্ষা মোড"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>English Learning</span>
                </button>
              </div>

              {/* Eye-Care Reading Theme Switcher */}
              <ThemeSwitcher compact />

              {/* Saved Notebook Link */}
              <Link
                href="/saved"
                className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[#ede8dc] text-[#404652] transition font-medium"
                title={isEnglishMode ? "Personal Word Bank & Notebook" : "ব্যক্তিগত নোটবুক ও স্টাডি হাব"}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
                <span className="hidden sm:inline">
                  {isEnglishMode ? "Word Bank & Hub" : "স্টাডি হাব"}
                </span>
              </Link>

              {/* Admin Console Link (ONLY visible if logged in as Admin) */}
              {sessionState?.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 transition text-[11px]"
                >
                  অ্যাডমিন
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Masthead / Brand Centerpiece (Desktop) */}
        <div className="hidden md:grid max-w-7xl mx-auto px-4 sm:px-8 py-5 grid-cols-1 md:grid-cols-3 items-center gap-4 lg:gap-6">
          {/* Left Column: Academic Motto / Tagline */}
          <div className="flex flex-col justify-center text-left w-full max-w-[260px] sm:max-w-[280px]">
            <span className="text-xs tracking-wider text-[#68707f] font-serif uppercase font-semibold block">
              {isEnglishMode
                ? "Editorial English & Active Recall"
                : "সত্য, বিশ্লেষণ ও শিক্ষণীয় তথ্যের আধার"}
            </span>
            <span className="text-[11px] text-[#939ba8] mt-0.5 block">
              {isEnglishMode
                ? "Curated Journalism for English Fluency"
                : "শিক্ষার্থী ও গবেষক কেন্দ্রিক ডিজিটাল পত্রিকা"}
            </span>
          </div>

          {/* Center Column: KhoboraKhobor Digital Brand Logo */}
          <div className="text-center justify-self-center py-0.5">
            <KhoborLogo variant="masthead" size="responsive" />
          </div>

          {/* Right Column: Search Box & Login Link */}
          <div className="flex justify-end items-center gap-2 sm:gap-3 justify-self-end w-full">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="অনুসন্ধান করুন"
              className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-[#ded8cb] bg-[#fbf9f5] hover:bg-[#ede7da] text-[#4b5260] text-xs font-medium transition shadow-2xs group cursor-pointer ${
                isLoggedIn
                  ? "w-full max-w-[250px] sm:max-w-[270px]"
                  : "w-full max-w-[160px] sm:max-w-[180px]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Search className={`w-4 h-4 group-hover:scale-110 transition-transform shrink-0 ${
                  isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"
                }`} />
                <span className="truncate">
                  {isEnglishMode ? "Search articles & words..." : "অনুসন্ধান করুন..."}
                </span>
              </div>
              <kbd className="hidden sm:inline-flex items-center bg-[#eae4d6] text-[#6b7280] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#dfd8ca] shrink-0">
                Ctrl K
              </kbd>
            </button>

            {/* Profile & Login Link */}
            {!isLoggedIn && (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#ded8cb] bg-[#faf8f4] hover:bg-[#ede7da] text-xs font-semibold text-[#1c1d21] transition shadow-2xs shrink-0"
                title="লগইন বা শিক্ষার্থী সাইন আপ"
              >
                <UserCheck className={`w-3.5 h-3.5 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
                <span>লগইন</span>
              </Link>
            )}
          </div>
        </div>

        {/* Single Unified Category Bar (Desktop) */}
        <nav className="border-t border-[#ece7dc] bg-[#faf8f4] hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-2xs transition ${
                  isEnglishMode ? "bg-[#1e40af] text-white" : "bg-[#842323] text-white"
                }`}
              >
                {isEnglishMode ? "All News Feed" : "প্রচ্ছদ"}
              </Link>
              {primaryCategories.map((cat) => {
                const displayName = isEnglishMode
                  ? ENGLISH_CATEGORY_NAMES[cat.slug] || cat.name
                  : cat.name;

                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#ffffff] hover:bg-[#ede7da] text-[#343a46] border border-[#ded8cb] whitespace-nowrap transition"
                  >
                    {displayName}
                  </Link>
                );
              })}

              {/* Others Dropdown for overflow categories */}
              {extraCategories.length > 0 && (
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#ffffff] hover:bg-[#ede7da] border border-[#ded8cb] transition ${
                      isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"
                    }`}
                  >
                    <span>{isEnglishMode ? "More Tracks" : "অন্যান্য বিভাগ"}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute left-0 mt-2 w-52 bg-white border border-[#ded8cc] rounded-lg shadow-xl py-2 z-50 text-xs animate-fade-in">
                      {extraCategories.map((cat) => {
                        const displayName = isEnglishMode
                          ? ENGLISH_CATEGORY_NAMES[cat.slug] || cat.name
                          : cat.name;

                        return (
                          <Link
                            key={cat.id}
                            href={`/category/${cat.slug}`}
                            onClick={() => setIsMoreMenuOpen(false)}
                            className="block px-4 py-2 hover:bg-[#f6f2e9] text-[#2d333f] font-medium transition"
                          >
                            {displayName}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-3 text-xs text-[#717887]">
              <Link
                href="/capsule"
                className={`font-semibold flex items-center gap-1 transition ${
                  isEnglishMode ? "hover:text-[#1e40af]" : "hover:text-[#842323]"
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
                <span>{isEnglishMode ? "5-Min English Capsule" : "আজকের ক্যাপসুল"}</span>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Global Search Dialog Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
