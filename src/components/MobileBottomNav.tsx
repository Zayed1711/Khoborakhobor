"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Award, Bookmark, UserCheck } from "lucide-react";
import TodayRing from "@/components/TodayRing";
import { openTodayPanel, useTodayProgress } from "@/lib/today-client";
import { useAppMode } from "@/context/LanguageContext";

export default function MobileBottomNav() {
  const pathname = usePathname() || "/";
  // "?tab=" of the current address, read after the page loads (and on each page change);
  // tapping one of these tabs sets it straight away
  const [tab, setTab] = useState<string | null>(null);
  useEffect(() => {
    setTab(new URLSearchParams(window.location.search).get("tab"));
  }, [pathname]);
  const { isEnglishMode } = useAppMode();

  const navItems = isEnglishMode
    ? [
        { label: "Home", href: "/", icon: Home },
        { label: "Exam", href: "/exam", icon: Award },
        { label: "Today", href: "#today", icon: Home },
        { label: "Notebook", href: "/saved", icon: Bookmark },
        { label: "Me", href: "/me", icon: UserCheck },
      ]
    : [
        { label: "হোম", href: "/", icon: Home },
        { label: "পরীক্ষা", href: "/exam", icon: Award },
        { label: "আজ", href: "#today", icon: Home },
        { label: "নোটবুক", href: "/saved", icon: Bookmark },
        { label: "আমি", href: "/me", icon: UserCheck },
      ];

  const activeColor = isEnglishMode ? "text-[#1e40af] font-bold" : "text-[#842323] font-bold";
  const iconActiveColor = isEnglishMode ? "text-[#1e40af]" : "text-[#842323]";
  const activeBg = isEnglishMode ? "bg-blue-50/80" : "bg-[#f5ebeb]/80";
  const today = useTodayProgress();

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ded8cb] py-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Middle tab: the Today ring. It opens the mission panel instead of a page.
          if (item.href === "#today") {
            return (
              <button
                key={item.label}
                id="tutorial-today-ring"
                type="button"
                onClick={openTodayPanel}
                aria-label={isEnglishMode ? `Today's mission, ${today?.percent ?? 0}% done` : `আজকের মিশন, ${today?.percent ?? 0}% সম্পন্ন`}
                className="relative -mt-5 flex flex-col items-center justify-end min-w-[58px]"
              >
                <span className={`flex items-center justify-center rounded-full bg-white p-1 shadow-[0_-2px_10px_rgba(0,0,0,0.10)] border border-[#ded8cb] ${today?.loggedIn && !today.activeToday ? "animate-[pulse_2.4s_ease-in-out_infinite]" : ""}`}>
                  <TodayRing percent={today?.percent ?? 0} done={!!today?.done} size={46} stroke={4.5} accent={isEnglishMode ? "#1e40af" : "#842323"} />
                </span>
                <span className={`text-xs tracking-tight mt-0.5 font-semibold ${isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}`}>{item.label}</span>
              </button>
            );
          }
          // "/saved?tab=analytics" (quiz recall) and "/saved" (notebook) share one page,
          // so the tab decides which of the two is lit
          const [path, query] = item.href.split("?");
          const itemTab = query ? new URLSearchParams(query).get("tab") : null;
          const isActive =
            path === "/"
              ? pathname === "/"
              : (pathname === path || pathname.startsWith(path + "/")) && (itemTab ? tab === itemTab : tab !== "analytics");

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setTab(itemTab)}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-2 rounded-xl transition-all ${
                isActive ? `${activeColor} ${activeBg} shadow-2xs` : "text-[#646c7a] hover:text-[#17191d]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? iconActiveColor : "text-[#788191]"}`} />
              <span className="text-xs tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
