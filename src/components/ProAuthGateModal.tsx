"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BookOpen, HelpCircle, Bookmark, Sparkles, X, 
  ArrowRight, ShieldCheck, CheckCircle2, Lock, UserCheck
} from "lucide-react";
import KhoborLogo from "@/components/KhoborLogo";

export type ProGateFeature = "dictionary" | "quiz" | "notebook";

interface ProAuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: ProGateFeature;
  customTitle?: string;
  customDescription?: string;
}

const FEATURE_META: Record<ProGateFeature, { title: string; subtitle: string; icon: any }> = {
  dictionary: {
    title: "দ্বিভাষিক ধারণাগত অভিধান (Bilingual Dictionary)",
    subtitle: "প্রতিটি অর্থনৈতিক, রাজনৈতিক ও আন্তর্জাতিক শব্দের তাৎক্ষণিক বাংলা অর্থ ও বিসিএস পরীক্ষার প্রাসঙ্গিক ব্যাখ্যা পেতে লগইন করুন।",
    icon: BookOpen,
  },
  quiz: {
    title: "অ্যাক্টিভ রিকল মাইক্রো-কুইজ (Active Recall Quiz)",
    subtitle: "প্রতিদিনের সংবাদের ওপর ভিত্তি করে তৈরি প্রশ্নোত্তরে অংশ নিয়ে আত্মমূল্যায়ন ও র্যাংকিং দেখতে সাইন ইন করুন।",
    icon: HelpCircle,
  },
  notebook: {
    title: "ক্লাউড স্টাডি নোটবুক ও হাইলাইটার (Study Notebook)",
    subtitle: "গুরুত্বপূর্ণ বাক্য হাইলাইট করতে এবং ব্যক্তিগত স্টাডি নোট ক্লাউডে সংরক্ষণ করতে বিনামূল্যে লগইন করুন।",
    icon: Bookmark,
  },
};

export default function ProAuthGateModal({
  isOpen,
  onClose,
  feature = "dictionary",
  customTitle,
  customDescription,
}: ProAuthGateModalProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const meta = FEATURE_META[feature] || FEATURE_META.dictionary;
  const FeatureIcon = meta.icon;
  const redirectTarget = encodeURIComponent(pathname || "/");

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#ffffff] border border-[#e2dcd0] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 text-[#1c1d21] animate-in zoom-in-95 duration-200 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#f4efe4] hover:bg-[#eae4d5] text-[#555d6b] flex items-center justify-center transition active:scale-95"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-900 text-[11px] font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>ফাউন্ডিং প্রো ট্রায়াল (Founding Pro)</span>
          </div>
          <span className="text-[11px] font-semibold text-[#842323] bg-[#fbf5f5] px-2 py-0.5 rounded border border-[#eddada]">
            ২ ডিসেম্বর পর্যন্ত ফ্রি
          </span>
        </div>

        {/* Brand Emblem & Feature Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#842323] text-white flex items-center justify-center shadow-sm shrink-0">
            <FeatureIcon className="w-6 h-6 text-[#fbeeee]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1c1d21] leading-snug">
              {customTitle || meta.title}
            </h3>
            <p className="text-xs text-[#717887]">
              শিক্ষার্থী ও গবেষক কেন্দ্রিক ডিজিটাল পত্রিকা
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#404652] leading-relaxed mb-4 bg-[#faf8f4] p-3 rounded-xl border border-[#ece7dc]">
          {customDescription || meta.subtitle}
        </p>

        {/* Benefit Checkmarks */}
        <div className="space-y-2 mb-6 text-xs text-[#353b47]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>কোনো ক্রেডিট কার্ড ছাড়াই সম্পূর্ণ বিনামূল্যে প্রো ফিচারে প্রবেশ</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ব্যক্তিগত স্টাডি অগ্রগতি ও শব্দভাণ্ডার ক্লাউডে সংরক্ষণ</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>বিসিএস ও ব্যাংক পরীক্ষার নির্ভুল মডেল কুইজ ও ব্যাখ্যা</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Quick Sign In Link (Preserves current URL redirect) */}
          <Link
            href={`/login?redirect=${redirectTarget}`}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#842323] hover:bg-[#6e1c1c] text-white font-bold text-sm shadow-md transition active:scale-98"
          >
            <UserCheck className="w-4 h-4 text-[#fcd8d8]" />
            <span>গুগল বা ইমেইল দিয়ে বিনামূল্যে লগইন করুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* New Account Link */}
          <Link
            href={`/login?tab=signup&redirect=${redirectTarget}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#ffffff] hover:bg-[#fbf9f5] text-[#2d333f] font-semibold text-xs border border-[#ded8cb] transition"
          >
            <span>নতুন অ্যাকাউন্ট তৈরি করুন (Sign Up)</span>
          </Link>
        </div>

        {/* Guarantee Footer */}
        <div className="mt-4 pt-3 border-t border-[#ece7dc] flex items-center justify-center gap-1.5 text-[11px] text-[#717887]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>২ ডিসেম্বর পর্যন্ত ফাউন্ডিং প্রো সম্পূর্ণ ফ্রি • ১ ক্লিকে শুরু</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

