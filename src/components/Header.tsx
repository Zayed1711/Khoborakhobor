"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Search, Globe, Bookmark, Calendar, UserCheck, 
  ChevronDown, Menu, X, Zap
} from "lucide-react";
import SearchModal from "./SearchModal";
import ThemeSwitcher from "./ThemeSwitcher";
import { getCurrentSession, UserSession } from "@/actions/auth";
import { useLanguage } from "@/context/LanguageContext";

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

export default function Header({ categories = DEFAULT_CATEGORIES, session }: HeaderProps) {
  const [sessionState, setSessionState] = useState<UserSession | null>(session || null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const selectedLang = language === "en" ? "English" : "বাংলা";

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

  const langRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
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
      const formatted = now.toLocaleDateString("bn-BD", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setCurrentDate(formatted);
    } catch {
      // Keep initial
    }
  }, []);

  // Fit 5 primary buttons + "অন্যান্য বিভাগ" dropdown so it fits cleanly in one line with zero scrolling
  const primaryCategories = categories.slice(0, 5);
  const extraCategories = categories.slice(5);

  return (
    <>
      <header className="border-b border-[#e5e0d6] bg-[#ffffff] sticky top-0 z-40 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        {/* Top Micro-Bar (Pre-Header Utilities) */}
        <div className="border-b border-[#ece7dc] text-[11px] text-[#555d6b] py-1.5 px-4 sm:px-8 bg-[#faf8f3]">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium text-[#404652]">
                <Calendar className="w-3.5 h-3.5 text-[#88909d]" />
                {currentDate}
              </span>
              <span className="hidden md:inline-block text-[#d5d0c4]">|</span>
              <span className="hidden md:inline-block text-[#606775]">
                ঢাকা: ২৮° সেলসিয়াস, পরিচ্ছন্ন আবহাওয়া
              </span>
              <span className="hidden lg:inline-block text-[#d5d0c4]">|</span>
              <Link
                href="/capsule"
                className="hidden lg:inline-flex items-center gap-1 text-[#842323] font-semibold hover:underline"
              >
                <Zap className="w-3.5 h-3.5 text-[#f5c66b]" />
                <span>দৈনিক ৫-মিনিট ক্যাপসুল</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Eye-Care Reading Theme Switcher */}
              <ThemeSwitcher compact />

              {/* Language Selector Dropdown */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#ede8dc] text-[#404652] font-medium transition"
                >
                  <Globe className="w-3.5 h-3.5 text-[#737b88]" />
                  <span>{selectedLang}</span>
                  <ChevronDown className="w-3 h-3 text-[#88909d]" />
                </button>

                {isLangOpen && (
                  <div className="absolute right-0 mt-1 w-28 bg-white border border-[#ded8cc] rounded-md shadow-lg py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => { setLanguage("bn"); setIsLangOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#f6f2e9] text-[#1c1d21] font-medium flex items-center justify-between transition"
                    >
                      বাংলা {language === "bn" && <span className="text-[#842323] text-xs font-bold">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLanguage("en"); setIsLangOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#f6f2e9] text-[#1c1d21] font-medium flex items-center justify-between transition"
                    >
                      English {language === "en" && <span className="text-[#842323] text-xs font-bold">✓</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* Saved Notebook Link */}
              <Link
                href="/saved"
                className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-[#ede8dc] text-[#404652] transition font-medium"
                title="ব্যক্তিগত নোটবুক, ফ্ল্যাশকার্ড ও কুইজ স্কোরকার্ড"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#842323]" />
                <span className="hidden sm:inline">স্টাডি হাব ও নোটবুক</span>
              </Link>

              {/* Admin Console Link (ONLY visible if logged in as Admin) */}
              {sessionState?.role === "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 transition text-[11px]"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>অ্যাডমিন কনসোল</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Masthead / Brand Centerpiece with Symmetrical Spacing */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 grid grid-cols-1 md:grid-cols-3 items-center gap-4 lg:gap-6">
          {/* Left Column: Academic Motto / Tagline (Symmetrically Bounded) */}
          <div className="hidden md:flex flex-col justify-center text-left w-full max-w-[260px] sm:max-w-[280px]">
            <span className="text-xs tracking-wider text-[#68707f] font-serif uppercase font-semibold block">
              সত্য, বিশ্লেষণ ও শিক্ষণীয় তথ্যের আধার
            </span>
            <span className="text-[11px] text-[#939ba8] mt-0.5 block">
              শিক্ষার্থী ও গবেষক কেন্দ্রিক ডিজিটাল পত্রিকা
            </span>
          </div>

          {/* Center Column: KhoboraKhobor Digital Brand Logo (Mathematically Dead-Center) */}
          <div className="text-center justify-self-center">
            <Link href="/" className="inline-block group">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#17191d] font-serif">
                খবরাখবর
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="h-[1px] w-8 bg-[#842323]/40" />
                <span className="text-[10px] tracking-[0.28em] text-[#842323] font-bold uppercase">
                  KHOBORAKHOBOR DIGITAL
                </span>
                <span className="h-[1px] w-8 bg-[#842323]/40" />
              </div>
            </Link>
          </div>

          {/* Right Column: Search Box & Login Link (Symmetrically Bounded to Mirror Left Column) */}
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
                <Search className="w-4 h-4 text-[#842323] group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">অনুসন্ধান করুন...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center bg-[#eae4d6] text-[#6b7280] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#dfd8ca] shrink-0">
                Ctrl K
              </kbd>
            </button>

            {/* Profile & Login Link (ONLY visible when NOT logged in!) */}
            {!isLoggedIn && (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#ded8cb] bg-[#faf8f4] hover:bg-[#ede7da] text-xs font-semibold text-[#1c1d21] transition shadow-2xs shrink-0"
                title="লগইন বা শিক্ষার্থী সাইন আপ"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#842323]" />
                <span>লগইন</span>
              </Link>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md border border-[#ded8cb] bg-[#faf8f4] text-[#404652]"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Single Unified Category Bar with Zero Horizontal Scrolling */}
        <nav className="border-t border-[#ece7dc] bg-[#faf8f4] hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#842323] text-white whitespace-nowrap shadow-2xs transition"
              >
                প্রচ্ছদ
              </Link>
              {primaryCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#ffffff] hover:bg-[#ede7da] text-[#343a46] border border-[#ded8cb] whitespace-nowrap transition"
                >
                  {cat.name}
                </Link>
              ))}

              {/* Others Dropdown for overflow categories */}
              {extraCategories.length > 0 && (
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#ffffff] hover:bg-[#ede7da] text-[#842323] border border-[#ded8cb] transition"
                  >
                    <span>অন্যান্য বিভাগ</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isMoreMenuOpen && (
                    <div className="absolute left-0 mt-2 w-52 bg-white border border-[#ded8cc] rounded-lg shadow-xl py-2 z-50 text-xs animate-fade-in">
                      {extraCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/category/${cat.slug}`}
                          onClick={() => setIsMoreMenuOpen(false)}
                          className="block px-4 py-2 hover:bg-[#f6f2e9] text-[#2d333f] font-medium transition"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-3 text-xs text-[#717887]">
              <Link
                href="/capsule"
                className="hover:text-[#842323] font-semibold flex items-center gap-1 transition"
              >
                <Zap className="w-3.5 h-3.5 text-[#842323]" />
                <span>আজকের ক্যাপসুল</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#ece7dc] bg-[#faf8f4] px-4 py-3 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#ece7dc]">
              <span className="text-xs font-semibold text-[#525964]">ভাষা (Language):</span>
              <div className="inline-flex rounded-md border border-[#ded8cc] bg-white p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setLanguage("bn")}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    language === "bn" ? "bg-[#842323] text-white" : "text-[#404652] hover:bg-[#f6f2e9]"
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 py-1 rounded font-medium transition ${
                    language === "en" ? "bg-[#842323] text-white" : "text-[#404652] hover:bg-[#f6f2e9]"
                  }`}
                >
                  English
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-[#ece7dc]">
              <span className="text-xs font-semibold text-[#525964]">চোখের প্রশান্তি থিম:</span>
              <ThemeSwitcher compact />
            </div>
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-[#842323] font-bold bg-[#ede7da]"
            >
              প্রচ্ছদ
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm text-[#3b414d] hover:bg-[#f0ebe0] rounded font-medium"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
