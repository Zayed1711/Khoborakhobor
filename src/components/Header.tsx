"use client";
import StudyPartner from "@/components/StudyPartner";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Search, Globe, Bookmark, Calendar, UserCheck, 
  ChevronDown, Menu, X, Zap, GraduationCap, BookOpen
} from "lucide-react";
import SearchModal from "./SearchModal";
import ThemeSwitcher from "./ThemeSwitcher";
import KhoborLogo from "./KhoborLogo";
import { getCurrentSession, UserSession } from "@/actions/auth";
import { useAppMode } from "@/context/LanguageContext";
import { FEATURES } from "@/lib/features";

interface HeaderProps {
  categories?: { id: string; name: string; slug: string }[];
  session?: UserSession | null;
  /** On a story page: the story's section, so the bar shows where the reader is */
  activeSection?: string;
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

export default function Header({ categories = DEFAULT_CATEGORIES, session, activeSection }: HeaderProps) {
  // Which part of the site the reader is in: highlighted in the section bar and menu
  const pathname = usePathname() || "/";
  const router = useRouter();
  const current =
    activeSection ??
    (pathname === "/"
      ? "home"
      : pathname.startsWith("/category/")
      ? decodeURIComponent(pathname.split("/")[2] || "")
      : pathname.startsWith("/capsule")
      ? "capsule"
      : null);
  // A story page shows its section, but is not that section's page itself
  const currentKind = activeSection ? "true" : "page";
  // Filled chip for where the reader is; plain white for the rest
  const chipClass = (active: boolean, extra: string) =>
    `${extra} py-1.5 rounded-full text-xs whitespace-nowrap transition border ${
      active
        ? isEnglishMode
          ? "bg-[#1e40af] border-[#1e40af] text-white shadow-2xs"
          : "bg-[#842323] border-[#842323] text-white shadow-2xs"
        : "bg-[#ffffff] hover:bg-[#ede7da] text-[#343a46] border-[#ded8cb]"
    }`;
  const [sessionState, setSessionState] = useState<UserSession | null>(session || null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileCategoryOpen, setIsMobileCategoryOpen] = useState(false);
  
  const { mode, setMode, isEnglishMode, lockedMode } = useAppMode();
  // Sections belong to job/BCS mode: switching to English on a section page opens the English feed
  useEffect(() => {
    if (isEnglishMode && pathname.startsWith("/category/")) router.replace("/");
  }, [isEnglishMode, pathname, router]);
  // While a story is open the mode is locked to the story's mode (see ArticleStudyView);
  // the other button explains why instead of doing nothing silently
  const [showLockNote, setShowLockNote] = useState(false);
  const lockNoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLockedAway = (m: "job_prep" | "english_learning") => lockedMode !== null && lockedMode !== m;
  const chooseMode = (m: "job_prep" | "english_learning") => {
    if (isLockedAway(m)) {
      setShowLockNote(true);
      if (lockNoteTimer.current) clearTimeout(lockNoteTimer.current);
      lockNoteTimer.current = setTimeout(() => setShowLockNote(false), 3500);
      return;
    }
    setMode(m);
  };
  const lockNote = isEnglishMode
    ? "You can't switch modes while reading a story. Go back to the homepage to switch."
    : "খবর পড়ার সময় মোড বদলানো যায় না। মোড বদলাতে প্রচ্ছদে ফিরুন।";

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
    const handleGlobalSearchTrigger = () => setIsSearchOpen(true);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("khobor_open_search", handleGlobalSearchTrigger);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("khobor_open_search", handleGlobalSearchTrigger);
    };
  }, []);

  // Today's date in Bangladesh, the same on the server and in the browser
  const todayText = (english: boolean) => {
    try {
      return new Date().toLocaleDateString(english ? "en-US" : "bn-BD", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Dhaka",
      });
    } catch {
      return "";
    }
  };
  const [currentDate, setCurrentDate] = useState(() => todayText(false));

  useEffect(() => {
    setCurrentDate(todayText(isEnglishMode)); // eslint-disable-line react-hooks/set-state-in-effect
  }, [isEnglishMode]);

  const primaryCategories = categories.slice(0, 5);
  const extraCategories = categories.slice(5);
  // When the reader is in a section under "অন্যান্য বিভাগ", that button shows its name
  const activeExtra = extraCategories.find((c) => c.slug === current);

  // Dynamic 14-day Founding Pro Trial computed per active student
  const studentJoined = sessionState?.student && (sessionState.student as any).createdAt
    ? new Date((sessionState.student as any).createdAt)
    : new Date();
  const daysSinceJoin = Math.floor((Date.now() - studentJoined.getTime()) / (1000 * 60 * 60 * 24));
  const trialDaysRemaining = Math.max(1, 14 - daysSinceJoin);

  return (
    <>
      <header className="border-b border-[#e5e0d6] bg-[#ffffff] sticky top-0 z-40 shadow-[0_2px_8px_rgba(0,0,0,0.03)] select-none">
        {/* ======================================================== */}
        {/* MOBILE DEDICATED APP BAR (< md: Clean, 52px, 0 Clutter) */}
        {/* ======================================================== */}
        <div className="md:hidden flex items-center justify-between gap-1.5 px-2.5 py-2 bg-white border-b border-[#ece7dc]">
          {/* Left: Mobile Brand Logo */}
          <div className="min-w-0 shrink overflow-hidden">
            <KhoborLogo variant="compact" size="sm" showTagline={false} />
          </div>

          {/* Right: Quick Ergonomic Controls (must fit a 360px screen) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 1-Tap Platform Mode Toggle Pill */}
            <div className="inline-flex rounded-lg border border-[#ded8cc] bg-[#faf8f4] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => chooseMode("job_prep")}
                aria-disabled={isLockedAway("job_prep") || undefined}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  !isEnglishMode ? "bg-[#842323] text-white shadow-2xs font-bold" : "text-[#555d6b]"
                } ${isLockedAway("job_prep") ? "opacity-40 cursor-not-allowed" : ""}`}
                title={isLockedAway("job_prep") ? lockNote : "চাকরি ও বিসিএস"}
              >
                <span>চাকরি</span>
              </button>
              <button
                type="button"
                onClick={() => chooseMode("english_learning")}
                aria-disabled={isLockedAway("english_learning") || undefined}
                className={`px-2 py-1 rounded transition flex items-center gap-1 ${
                  isEnglishMode ? "bg-[#1e40af] text-white shadow-2xs font-bold" : "text-[#555d6b]"
                } ${isLockedAway("english_learning") ? "opacity-40 cursor-not-allowed" : ""}`}
                title={isLockedAway("english_learning") ? lockNote : "English Learning"}
                aria-label="English Learning"
              >
                <span>EN</span>
              </button>
            </div>

            {/* Logged-in Reverse Trial Navbar Pill (Mobile) */}
            {isLoggedIn && FEATURES.trialPromo ? (
              <Link
                href="/saved"
                className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-medium border border-amber-500/20 shrink-0"
                title={`Founding Pro Trial: Active (${trialDaysRemaining} Days Left)`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Pro</span>
              </Link>
            ) : isLoggedIn ? (
              <Link
                href="/saved"
                className="w-9 h-9 rounded-lg bg-[#faf8f4] border border-[#ded8cb] text-[#842323] flex items-center justify-center"
                title="আমার প্রোফাইল"
                aria-label="আমার প্রোফাইল"
              >
                <UserCheck className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-9 h-9 rounded-lg bg-[#faf8f4] border border-[#ded8cb] text-[#842323] flex items-center justify-center"
                title="লগইন বা সাইন আপ"
                aria-label="লগইন বা সাইন আপ"
              >
                <UserCheck className="w-4 h-4" />
              </Link>
            )}

            {/* Instant Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-lg border border-[#ded8cb] bg-[#faf8f4] flex items-center justify-center text-[#404652] hover:bg-[#ede7da] transition active:scale-95"
              aria-label="অনুসন্ধান করুন"
            >
              <Search className={`w-4 h-4 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
            </button>

            {/* Mobile Categories Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileCategoryOpen(!isMobileCategoryOpen)}
              className="w-9 h-9 rounded-lg border border-[#ded8cb] bg-[#faf8f4] flex items-center justify-center text-[#404652] hover:bg-[#ede7da] transition"
              aria-label="বিভাগসমূহ ও সেটিংস"
              aria-expanded={isMobileCategoryOpen}
              title="বিভাগসমূহ"
            >
              {isMobileCategoryOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Category Drawer (Optional deep-dive) */}
        {isMobileCategoryOpen && (
          <div className="md:hidden border-b border-[#ece7dc] bg-[#faf8f4] px-4 py-3 max-h-[60vh] overflow-y-auto animate-in slide-in-from-top duration-200 space-y-1">
            <div className="flex items-center justify-between gap-3 pb-2 mb-1 border-b border-[#ece7dc]">
              <span className="text-xs font-semibold text-[#555d6b]">
                {isEnglishMode ? "Reading theme" : "পড়ার থিম"}
              </span>
              <ThemeSwitcher compact />
            </div>
            {/* English learning mode has one feed and no sections */}
            {!isEnglishMode && (<>
            <span className="text-xs font-bold text-[#717887] uppercase tracking-wider block mb-2">
              {isEnglishMode ? "Explore Tracks & Categories" : "সংবাদ ও স্টাডি বিভাগসমূহ"}
            </span>
            <Link
              href="/"
              onClick={() => setIsMobileCategoryOpen(false)}
              aria-current={current === "home" ? "page" : undefined}
              className={`block px-3 py-2 rounded-lg font-bold text-xs ${
                current === "home"
                  ? isEnglishMode ? "text-white bg-[#1e40af]" : "text-white bg-[#842323]"
                  : isEnglishMode ? "text-[#1e40af] bg-blue-50" : "text-[#842323] bg-[#f5ebeb]"
              }`}
            >
              {isEnglishMode ? "Home: today's top 10" : "প্রচ্ছদ (আজকের জরুরি ১০)"}
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
                    aria-current={current === cat.slug ? currentKind : undefined}
                    className={`block px-3 py-2.5 text-sm rounded-lg border font-medium truncate ${
                      current === cat.slug
                        ? isEnglishMode ? "bg-[#1e40af] border-[#1e40af] text-white" : "bg-[#842323] border-[#842323] text-white"
                        : "text-[#3b414d] hover:bg-[#ede7da] bg-white border-[#ded8cb]"
                    }`}
                  >
                    {displayName}
                  </Link>
                );
              })}
            </div>
            </>)}
            <div className="pt-2 mt-1 border-t border-[#ece7dc]">
              <StudyPartner variant="menu" english={isEnglishMode} />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DESKTOP HEADER (Preserved 100% with full institutional layout) */}
        {/* ======================================================== */}
        {/* Top Micro-Bar */}
        <div className="hidden md:block border-b border-[#ece7dc] text-xs text-[#555d6b] py-1.5 px-4 sm:px-8 bg-[#faf8f3]">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium text-[#404652]">
                <Calendar className="w-3.5 h-3.5 text-[#88909d]" />
                {currentDate}
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
                className="inline-flex rounded-lg border border-[#ded8cc] bg-white p-0.5 shadow-2xs text-xs font-semibold"
              >
                <button
                  type="button"
                  onClick={() => chooseMode("job_prep")}
                  aria-disabled={isLockedAway("job_prep") || undefined}
                  className={`px-2.5 py-0.5 rounded-md transition flex items-center gap-1 ${
                    !isEnglishMode
                      ? "bg-[#842323] text-white shadow-xs font-bold"
                      : isLockedAway("job_prep")
                      ? "text-[#525a68] opacity-40 cursor-not-allowed"
                      : "text-[#525a68] hover:text-[#1c1d21] hover:bg-[#ede7da]"
                  }`}
                  title={isLockedAway("job_prep") ? lockNote : "বিসিএস, ব্যাংক ও সরকারি চাকরি প্রস্তুতি মোড"}
                >
                  <GraduationCap className="w-3 h-3" />
                  <span>চাকরি ও বিসিএস</span>
                </button>
                <button
                  type="button"
                  onClick={() => chooseMode("english_learning")}
                  aria-disabled={isLockedAway("english_learning") || undefined}
                  className={`px-2.5 py-0.5 rounded-md transition flex items-center gap-1 ${
                    isEnglishMode
                      ? "bg-[#1e40af] text-white shadow-xs font-bold"
                      : isLockedAway("english_learning")
                      ? "text-[#525a68] opacity-40 cursor-not-allowed"
                      : "text-[#525a68] hover:text-[#1c1d21] hover:bg-[#ede7da]"
                  }`}
                  title={isLockedAway("english_learning") ? lockNote : "ইংরেজি সম্পাদকীয় পাঠ ও ভোকাবুলারি শিক্ষা মোড"}
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 transition text-xs"
                >
                  অ্যাডমিন
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Brand Header Navigation (Desktop: Left Logo with Motto, Center Search, Right Pro Badge & Profile) */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-8 py-3.5 items-center justify-between gap-4 lg:gap-8">
          {/* Left Column: Original Brand Logo with Motto */}
          <div className="shrink-0 flex items-center justify-start">
            <Link href="/" className="inline-block group" aria-label="খবরাখবর ডিজিটাল — প্রচ্ছদ">
              <Image
                src="/brand-logo.png"
                alt="খবরাখবর ডিজিটাল — KHOBORAKHOBOR DIGITAL"
                width={650}
                height={148}
                priority
                className="h-12 lg:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
          </div>

          {/* Center Column: Search Box */}
          <div className="flex-1 max-w-md mx-auto px-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="অনুসন্ধান করুন"
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-[#ded8cb] bg-[#fbf9f5] hover:bg-[#ede7da] text-[#4b5260] text-xs font-medium transition shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className={`w-4 h-4 group-hover:scale-110 transition-transform shrink-0 ${
                  isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"
                }`} />
                <span className="truncate">
                  {isEnglishMode ? "Search articles & words..." : "অনুসন্ধান করুন..."}
                </span>
              </div>
              <kbd className="hidden sm:inline-flex items-center bg-[#eae4d6] text-[#6b7280] text-xs font-mono px-1.5 py-0.5 rounded border border-[#dfd8ca] shrink-0">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Column: Founding Pro Badge & Profile / Login */}
          <div className="shrink-0 flex items-center gap-2.5 justify-end">
            {/* Founding Pro trial pill: hidden until there is a real paid plan (lib/features.ts) */}
            {FEATURES.trialPromo && (
            <Link
              href={isLoggedIn ? "/saved" : "/login"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 text-xs font-medium border border-amber-500/30 hover:bg-amber-500/15 transition shrink-0"
              title={isLoggedIn ? `Founding Pro Trial: Active (${trialDaysRemaining} Days Left)` : "Founding Pro: 14-Day Free Access"}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-semibold">Founding Pro</span>
              <span className="text-xs text-amber-800/80 font-normal">
                {isLoggedIn ? `| ${trialDaysRemaining}d remaining` : "| 14-Day Trial"}
              </span>
            </Link>
            )}

            {/* Profile or Login Action Button */}
            {isLoggedIn ? (
              <Link
                href="/saved"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#ded8cb] bg-[#faf8f4] hover:bg-[#ede7da] text-xs font-semibold text-[#1c1d21] transition shadow-2xs shrink-0"
                title="শিক্ষার্থী ড্যাশবোর্ড ও ব্যক্তিগত স্টাডি হাব"
              >
                <UserCheck className={`w-3.5 h-3.5 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
                <span className="max-w-[70px] sm:max-w-[90px] truncate">
                  {sessionState?.student?.name ? sessionState.student.name.split(" ")[0] : "প্রোফাইল"}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#ded8cb] bg-[#faf8f4] hover:bg-[#ede7da] text-xs font-semibold text-[#1c1d21] transition shadow-2xs shrink-0"
                title="লগইন বা শিক্ষার্থী সাইন আপ"
              >
                <UserCheck className={`w-3.5 h-3.5 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
                <span>লগইন</span>
              </Link>
            )}
          </div>
        </div>

        {/* Single Unified Category Bar (Desktop) */}
        {showLockNote && (
          <div
            role="status"
            className="fixed left-1/2 -translate-x-1/2 top-16 md:top-24 z-50 max-w-[90vw] px-4 py-2.5 rounded-xl bg-[#1c1d21] text-white text-xs sm:text-sm shadow-lg animate-fade-in"
          >
            {lockNote}
          </div>
        )}

        {/* English learning mode has one feed and no sections, so no section bar */}
        {!isEnglishMode && (
        <nav className="border-t border-[#ece7dc] bg-[#faf8f4] hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                aria-current={current === "home" ? "page" : undefined}
                className={chipClass(current === "home", "px-4 font-bold")}
              >
                {isEnglishMode ? "Home" : "প্রচ্ছদ"}
              </Link>
              {primaryCategories.map((cat) => {
                const displayName = isEnglishMode
                  ? ENGLISH_CATEGORY_NAMES[cat.slug] || cat.name
                  : cat.name;

                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    aria-current={current === cat.slug ? currentKind : undefined}
                    className={chipClass(current === cat.slug, "px-3.5 font-medium")}
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
                    aria-current={activeExtra ? currentKind : undefined}
                    className={
                      activeExtra
                        ? `${chipClass(true, "px-3.5 font-semibold")} flex items-center gap-1.5`
                        : `flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#ffffff] hover:bg-[#ede7da] border border-[#ded8cb] transition ${
                            isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"
                          }`
                    }
                  >
                    <span>
                      {activeExtra
                        ? isEnglishMode
                          ? ENGLISH_CATEGORY_NAMES[activeExtra.slug] || activeExtra.name
                          : activeExtra.name
                        : isEnglishMode
                        ? "More Tracks"
                        : "অন্যান্য বিভাগ"}
                    </span>
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
                            aria-current={current === cat.slug ? currentKind : undefined}
                            className={`block px-4 py-2 font-medium transition ${
                              current === cat.slug
                                ? isEnglishMode ? "bg-blue-50 text-[#1e40af] font-bold" : "bg-[#f5ebeb] text-[#842323] font-bold"
                                : "hover:bg-[#f6f2e9] text-[#2d333f]"
                            }`}
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
                aria-current={current === "capsule" ? "page" : undefined}
                className={
                  current === "capsule"
                    ? `${chipClass(true, "px-3.5 font-semibold")} flex items-center gap-1`
                    : `font-semibold flex items-center gap-1 transition ${isEnglishMode ? "hover:text-[#1e40af]" : "hover:text-[#842323]"}`
                }
              >
                <Zap className={`w-3.5 h-3.5 ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`} />
                <span>{isEnglishMode ? "5-Min English Capsule" : "আজকের ক্যাপসুল"}</span>
              </Link>
            </div>
          </div>
        </nav>
        )}
      </header>

      {/* Global Search Dialog Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
