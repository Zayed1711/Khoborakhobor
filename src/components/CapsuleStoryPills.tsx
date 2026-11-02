"use client";

import Link from "next/link";
import { Zap, Sparkles } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { isBengaliText, translateTitleToBengali } from "@/lib/bilingual";

interface CapsuleStoryPillsProps {
  capsuleArticles: {
    id: string;
    slug: string;
    title: string;
    featuredImage?: string;
    category: {
      name: string;
      slug: string;
    };
    readTime: string;
  }[];
}

export default function CapsuleStoryPills({ capsuleArticles }: CapsuleStoryPillsProps) {
  const { isEnglishMode } = useAppMode();
  if (!capsuleArticles || capsuleArticles.length === 0) return null;

  return (
    <div className="bg-white border border-[#ded8cb] rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2 sm:space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#842323]">
          <Zap className={`w-4 h-4 ${isEnglishMode ? "text-[#1e40af] fill-[#1e40af]" : "text-[#c29547] fill-[#c29547]"}`} />
          <span className={isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"}>
            {isEnglishMode ? "Daily 5-Min English Capsules" : "আজকের ৫-মিনিট ক্যাপসুল স্টোরিজ"}
          </span>
        </div>
        <Link
          href="/capsule"
          className={`text-[11px] font-semibold hover:underline flex items-center gap-1 ${
            isEnglishMode ? "text-[#1e40af]" : "text-[#842323]"
          }`}
        >
          <span>{isEnglishMode ? "View all" : "সবগুলো দেখুন"}</span>
          <span>→</span>
        </Link>
      </div>

      {/* Horizontal Story Stream */}
      <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
        {capsuleArticles.slice(0, 6).map((art, idx) => (
          <Link
            key={art.id}
            href={`/article/${art.slug}`}
            className="group flex flex-col items-center gap-1 shrink-0 w-16 sm:w-20 text-center"
          >
            {/* Story Circle with Gradient Ring */}
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr ${
              isEnglishMode
                ? "from-blue-600 via-indigo-600 to-amber-500"
                : "from-[#c29547] via-[#842323] to-[#ef4444]"
            } group-hover:scale-105 transition-transform duration-200`}>
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                <img
                  src={
                    art.featuredImage ||
                    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=200&q=80"
                  }
                  alt={art.title}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Micro Caption */}
            <span className="text-[10px] text-[#404652] font-semibold line-clamp-1 w-full group-hover:text-[#1e40af] transition-colors leading-tight">
              {isEnglishMode ? art.title : (isBengaliText(art.title) ? art.title : translateTitleToBengali(art.title))}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
