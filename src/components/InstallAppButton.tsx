"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { useInstallApp } from "@/lib/use-install-app";

/**
 * Header install button.
 *  - "icon": square button for the phone header. Shows `fallback` (the profile icon)
 *    once the app is installed, so the header never grows wider.
 *  - "pill": desktop header; only when the browser can install with one tap.
 */
export function InstallAppButton({ variant, fallback = null }: { variant: "icon" | "pill"; fallback?: React.ReactNode }) {
  const { isEnglishMode: en } = useAppMode();
  const { state, install } = useInstallApp();
  const label = en ? "Install the app" : "অ্যাপ ইনস্টল করুন";

  if (variant === "pill") {
    if (state !== "ready") return null;
    return (
      <button
        type="button"
        onClick={install}
        title={label}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#842323] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#6e1c1c] transition shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        {en ? "Install app" : "অ্যাপ ইনস্টল"}
      </button>
    );
  }

  if (state !== "ready" && state !== "manual") return <>{fallback}</>;
  return (
    <button
      type="button"
      onClick={install}
      title={label}
      aria-label={label}
      className="relative w-9 h-9 rounded-lg bg-[#842323] text-white flex items-center justify-center shadow-sm active:bg-[#6e1c1c]"
    >
      <Download className="w-4 h-4" />
      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 border-2 border-white" aria-hidden="true" />
    </button>
  );
}

const CARD_KEY = "kk_app_card_until";

/**
 * Install card at the top of the home feed. Part of the page (it scrolls away, covers
 * nothing). Closing it hides it for 14 days; it never shows inside the installed app.
 */
export function AppInstallCard({ className = "" }: { className?: string }) {
  const { isEnglishMode: en } = useAppMode();
  const { state, install } = useInstallApp();
  const [closed, setClosed] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setClosed(Date.now() < Number(localStorage.getItem(CARD_KEY) || 0));
      } catch {
        setClosed(false);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (closed || (state !== "ready" && state !== "manual")) return null;

  const close = () => {
    setClosed(true);
    try {
      localStorage.setItem(CARD_KEY, String(Date.now() + 14 * 86400_000));
    } catch {
      // storage blocked: it shows again next visit
    }
  };

  return (
    // Without a one-tap offer the guide is only useful on phones
    <section
      aria-label={en ? "Get the app" : "অ্যাপ নামান"}
      className={`${state === "ready" ? "" : "md:hidden"} relative flex items-center gap-3 rounded-2xl border border-[#e6d3d3] bg-gradient-to-r from-[#fbf1f1] to-white pl-3 pr-9 py-3 ${className}`}
    >
      <Image src="/icon.png" alt="" width={44} height={44} className="rounded-xl border border-[#ece7dc] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#17191d] leading-snug">{en ? "Get the KhoboraKhobor app" : "খবরাখবর অ্যাপ নামান"}</p>
        <p className="text-xs text-[#5b616d] leading-snug">{en ? "Free · reminders · offline" : "ফ্রি · রিমাইন্ডার · অফলাইনে পড়া"}</p>
      </div>
      <button type="button" onClick={install} className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-[#842323] px-3.5 py-2.5 text-sm font-bold text-white active:bg-[#6e1c1c]">
        <Download className="w-4 h-4" />
        {en ? "Install" : "ইনস্টল"}
      </button>
      <button type="button" onClick={close} aria-label={en ? "Close" : "বন্ধ করুন"} className="absolute right-1.5 top-1.5 p-1 text-[#8a8f99]">
        <X className="w-3.5 h-3.5" />
      </button>
    </section>
  );
}
