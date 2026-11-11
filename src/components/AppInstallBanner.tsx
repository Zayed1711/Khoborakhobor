"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { isInstalledApp } from "@/lib/pwa-client";

// "The app is available" bar on phones, just above the bottom nav.
// Kept out of the way on purpose:
//  - phones only, never inside the installed app
//  - waits 25 seconds, and only shows when no popup (tour, early-bird, login) is open,
//    so a visit never gets two things at once
//  - closing it hides it for 7 days; it stops for good after 3 closes
//  - not on the exam, login, admin or download pages
const KEY = "kk_app_banner";
const DELAY_MS = 25_000;
const QUIET_DAYS = 7;
const MAX_DISMISSALS = 3;
const HIDDEN_ON = /^\/(app|login|signup|admin|exam|desk)(\/|$)/;

interface Saved {
  until: number;
  count: number;
}

function read(): Saved {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { until: Number(v.until) || 0, count: Number(v.count) || 0 };
  } catch {
    return { until: 0, count: 0 };
  }
}

export default function AppInstallBanner() {
  const { isEnglishMode: en } = useAppMode();
  const pathname = usePathname() || "/";
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isInstalledApp()) return;
    const saved = read();
    if (saved.count >= MAX_DISMISSALS || Date.now() < saved.until) return;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(function tryShow() {
      // Something else has the reader's attention: look again later
      if (document.querySelector('[aria-modal="true"]')) {
        retry = setTimeout(tryShow, 20_000);
        return;
      }
      setShow(true);
    }, DELAY_MS);
    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearTimeout(timer);
      clearTimeout(retry);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      const saved = read();
      localStorage.setItem(KEY, JSON.stringify({ until: Date.now() + QUIET_DAYS * 86400_000, count: saved.count + 1 }));
    } catch {
      // storage blocked: it simply shows again on a later visit
    }
  };

  if (!show || HIDDEN_ON.test(pathname)) return null;

  return (
    <div
      role="region"
      aria-label={en ? "Get the app" : "অ্যাপ নামান"}
      className="md:hidden print:hidden fixed left-2 right-2 z-30 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] flex items-center gap-2.5 rounded-2xl border border-[#ded8cb] bg-white/97 backdrop-blur px-2.5 py-2 shadow-[0_6px_24px_rgba(0,0,0,0.14)] animate-in slide-in-from-bottom duration-300"
    >
      <Image src="/icon.png" alt="" width={36} height={36} className="rounded-lg border border-[#ece7dc] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#17191d] leading-tight truncate">{en ? "Get the KhoboraKhobor app" : "খবরাখবর অ্যাপ নামান"}</p>
        <p className="text-xs text-[#717887] leading-tight truncate">{en ? "Free · reminders · offline reading" : "ফ্রি · রিমাইন্ডার · অফলাইনে পড়া"}</p>
      </div>
      <Link href="/app" onClick={() => setShow(false)} className="shrink-0 rounded-lg bg-[#842323] px-3.5 py-2 text-sm font-bold text-white">
        {en ? "Get" : "নামান"}
      </Link>
      <button type="button" onClick={dismiss} aria-label={en ? "Close" : "বন্ধ করুন"} className="shrink-0 p-1.5 text-[#8a8f99]">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
