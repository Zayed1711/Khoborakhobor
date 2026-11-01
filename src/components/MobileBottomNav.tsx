"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, Bookmark, Layers, UserCheck } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isEnglishMode } = useAppMode();

  const navItems = isEnglishMode
    ? [
        { label: "Home", href: "/", icon: Home },
        { label: "Capsule", href: "/capsule", icon: Zap },
        { label: "Notebook", href: "/saved", icon: Bookmark },
        { label: "Word Bank", href: "/saved?tab=flashcards", icon: Layers },
        { label: "Profile", href: "/login", icon: UserCheck },
      ]
    : [
        { label: "হোম", href: "/", icon: Home },
        { label: "ক্যাপসুল", href: "/capsule", icon: Zap },
        { label: "নোটবুক", href: "/saved", icon: Bookmark },
        { label: "ফ্ল্যাশকার্ড", href: "/saved?tab=flashcards", icon: Layers },
        { label: "প্রোফাইল", href: "/login", icon: UserCheck },
      ];

  const activeColor = isEnglishMode ? "text-[#1e40af] font-bold" : "text-[#842323] font-bold";
  const iconActiveColor = isEnglishMode ? "text-[#1e40af]" : "text-[#842323]";

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ded8cb] py-1.5 px-3 shadow-lg select-none">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition ${
                isActive ? activeColor : "text-[#646c7a] hover:text-[#17191d]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? iconActiveColor : "text-[#788191]"}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
