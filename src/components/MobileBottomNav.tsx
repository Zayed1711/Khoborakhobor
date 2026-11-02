"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, Award, Bookmark, UserCheck } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isEnglishMode } = useAppMode();

  const navItems = isEnglishMode
    ? [
        { label: "Home", href: "/", icon: Home },
        { label: "Capsule", href: "/capsule", icon: Zap },
        { label: "Quiz Recall", href: "/saved?tab=analytics", icon: Award },
        { label: "Notebook", href: "/saved", icon: Bookmark },
        { label: "Profile", href: "/login", icon: UserCheck },
      ]
    : [
        { label: "হোম", href: "/", icon: Home },
        { label: "ক্যাপসুল", href: "/capsule", icon: Zap },
        { label: "কুইজ রিকল", href: "/saved?tab=analytics", icon: Award },
        { label: "নোটবুক", href: "/saved", icon: Bookmark },
        { label: "প্রোফাইল", href: "/login", icon: UserCheck },
      ];

  const activeColor = isEnglishMode ? "text-[#1e40af] font-bold" : "text-[#842323] font-bold";
  const iconActiveColor = isEnglishMode ? "text-[#1e40af]" : "text-[#842323]";
  const activeBg = isEnglishMode ? "bg-blue-50/80" : "bg-[#f5ebeb]/80";

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ded8cb] py-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href) && !item.href.includes("?"));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-2 rounded-xl transition-all ${
                isActive ? `${activeColor} ${activeBg} shadow-2xs` : "text-[#646c7a] hover:text-[#17191d]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? iconActiveColor : "text-[#788191]"}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
