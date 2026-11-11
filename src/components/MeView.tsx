"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Bell, BellOff, Smartphone, LogOut, Bookmark, ChevronRight, Newspaper, ListChecks, BookA, Target, Check, Download } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { logoutAction } from "@/actions/auth";
import type { TodayProgress } from "@/actions/progress";
import type { Badge, BadgeStats } from "@/lib/study/badges";
import { clearOfflinePages, disablePush, enablePush, isInstalledApp, pushIsOn, pushSupported } from "@/lib/pwa-client";
import { canPromptInstall, promptInstall } from "@/components/PwaRegister";
import { openTodayPanel, useTodayProgress } from "@/lib/today-client";
import TodayRing from "@/components/TodayRing";

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
const HOUR_KEY = "kk_reminder_hour";
const HOURS = [6, 7, 8, 9, 12, 15, 17, 18, 19, 20, 21, 22, 23];

const TRACKS: Record<string, [string, string]> = {
  BCS_GOVT: ["বিসিএস ও সরকারি চাকরি", "BCS & Govt Jobs"],
  ADMISSION: ["বিশ্ববিদ্যালয় ভর্তি", "University Admission"],
  GENERAL_KNOWLEDGE: ["সাধারণ জ্ঞান", "General Knowledge"],
  RESEARCH: ["গবেষণা ও নীতি", "Research & Policy"],
};

function hourLabel(h: number, en: boolean): string {
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (en) return `${h12}:00 ${h < 12 ? "AM" : "PM"}`;
  const part = h < 12 ? "সকাল" : h < 16 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত";
  return `${part} ${bn(h12)}টা`;
}

type PushState = "loading" | "unsupported" | "off" | "on" | "denied";

export default function MeView({
  name,
  email,
  targetTrack,
  today: initialToday,
  stats,
  badges,
}: {
  name: string;
  email: string;
  targetTrack: string;
  today: TodayProgress;
  stats: BadgeStats;
  badges: Badge[];
}) {
  const { isEnglishMode: en } = useAppMode();
  const router = useRouter();
  const today = useTodayProgress() ?? initialToday;
  const accent = en ? "#1e40af" : "#842323";
  const num = (n: number) => (en ? String(n) : bn(n));

  const [push, setPush] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);
  const [hour, setHour] = useState(20);
  const [installed, setInstalled] = useState(false);
  const [installable, setInstallable] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = Number(localStorage.getItem(HOUR_KEY));
      const on = await pushIsOn();
      if (!alive) return;
      if (HOURS.includes(saved)) setHour(saved);
      setInstalled(isInstalledApp());
      setInstallable(canPromptInstall());
      setPush(!pushSupported() ? "unsupported" : on ? "on" : Notification.permission === "denied" ? "denied" : "off");
    })();
    const onInstallable = () => setInstallable(canPromptInstall());
    window.addEventListener("kk-installable", onInstallable);
    return () => {
      alive = false;
      window.removeEventListener("kk-installable", onInstallable);
    };
  }, []);

  const togglePush = async () => {
    setBusy(true);
    setNote("");
    if (push === "on") {
      await disablePush();
      setPush("off");
    } else {
      const r = await enablePush(hour);
      if (r === "on") setPush("on");
      else if (r === "denied") setPush("denied");
      else if (r === "unsupported") setPush("unsupported");
      else setNote(en ? "Could not turn on notifications. Please try again." : "নোটিফিকেশন চালু করা যায়নি। আবার চেষ্টা করুন।");
    }
    setBusy(false);
  };

  const changeHour = async (h: number) => {
    setHour(h);
    try {
      localStorage.setItem(HOUR_KEY, String(h));
    } catch {
      // private mode: the server still gets the new time below
    }
    if (push === "on") {
      setBusy(true);
      const r = await enablePush(h);
      setNote(r === "on" ? (en ? "Reminder time saved." : "রিমাইন্ডারের সময় সেভ হয়েছে।") : en ? "Could not save the time." : "সময় সেভ করা যায়নি।");
      setBusy(false);
    }
  };

  const install = async () => {
    const ok = await promptInstall();
    if (ok) setInstalled(true);
    setInstallable(canPromptInstall());
  };

  const logout = async () => {
    await logoutAction();
    clearOfflinePages();
    router.push("/login");
    router.refresh();
  };

  const earned = badges.filter((b) => b.earned).length;
  const track = TRACKS[targetTrack]?.[en ? 1 : 0] ?? "";
  const card = "rounded-2xl border border-[#e5e0d6] bg-white p-4 sm:p-5";
  const h2 = "text-sm font-bold text-[#17191d]";

  return (
    <div className="space-y-4">
      {/* Profile + level */}
      <section className={card}>
        <div className="flex items-center gap-3.5">
          <button type="button" onClick={openTodayPanel} aria-label={en ? "Today's mission" : "আজকের মিশন"} className="shrink-0">
            <TodayRing percent={today.percent} done={today.done} size={72} stroke={6} accent={accent}>
              <span className="text-2xl font-black" style={{ color: "#17191d" }}>
                {(name.trim()[0] || "?").toUpperCase()}
              </span>
            </TodayRing>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-[#17191d] truncate">{name}</h1>
            <p className="text-xs text-[#717887] truncate">{email}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 px-2 py-0.5">
                <Flame className="w-3.5 h-3.5" />
                {en ? `${today.streak} day streak` : `${bn(today.streak)} দিনের স্ট্রিক`}
              </span>
              {track && <span className="rounded-full bg-[#f3efe6] text-[#5b616d] px-2 py-0.5">{track}</span>}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-[#17191d]">
              {en ? `Level ${today.level.level} · ${today.level.en}` : `লেভেল ${bn(today.level.level)} · ${today.level.bn}`}
            </span>
            <span className="text-xs font-semibold text-[#5b616d] tabular-nums">{num(today.xp)} XP</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#ece7dc] overflow-hidden">
            <div className="h-full rounded-full bg-[#c98a1b] transition-all duration-700" style={{ width: `${today.level.progress}%` }} />
          </div>
          {today.level.nextAt !== null && (
            <p className="mt-1.5 text-xs text-[#717887]">
              {en ? `${today.level.nextAt - today.xp} XP to the next level` : `পরের লেভেলে আর ${bn(today.level.nextAt - today.xp)} XP`}
            </p>
          )}
        </div>
      </section>

      {/* Numbers */}
      <section className="grid grid-cols-4 gap-2">
        {(
          [
            [Newspaper, stats.stories, "খবর", "Stories"],
            [ListChecks, stats.mcqs, "MCQ", "MCQs"],
            [BookA, stats.words, "শব্দ", "Words"],
            [Target, stats.goalDays, "পূর্ণ রিং", "Full rings"],
          ] as const
        ).map(([Icon, value, labelBn, labelEn]) => (
          <div key={labelEn} className="rounded-xl border border-[#e5e0d6] bg-white px-1.5 py-3 text-center">
            <Icon className="mx-auto w-4 h-4 text-[#8a8f99]" />
            <div className="mt-1 text-lg font-black text-[#17191d] tabular-nums leading-none">{num(value)}</div>
            <div className="mt-1 text-xs text-[#717887]">{en ? labelEn : labelBn}</div>
          </div>
        ))}
      </section>

      {/* Badges */}
      <section className={card}>
        <div className="flex items-baseline justify-between">
          <h2 className={h2}>{en ? "Badges" : "ব্যাজ"}</h2>
          <span className="text-xs font-semibold text-[#717887]">
            {num(earned)}/{num(badges.length)}
          </span>
        </div>
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {badges.map((b) => (
            <li key={b.id} className={`rounded-xl border px-2.5 py-2.5 ${b.earned ? "border-amber-200 bg-amber-50" : "border-[#ece7dc] bg-[#faf8f4]"}`}>
              <div className="flex items-center gap-2">
                <span className={`text-2xl leading-none ${b.earned ? "" : "grayscale opacity-45"}`} aria-hidden="true">
                  {b.emoji}
                </span>
                <span className="min-w-0">
                  <span className={`block text-xs font-bold leading-tight ${b.earned ? "text-[#17191d]" : "text-[#6b7280]"}`}>{en ? b.en : b.bn}</span>
                  <span className="block text-xs text-[#717887] leading-snug mt-0.5">
                    {b.earned ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                        <Check className="w-3 h-3" strokeWidth={3} />
                        {en ? "Earned" : "অর্জিত"}
                      </span>
                    ) : en ? (
                      b.howEn
                    ) : (
                      b.howBn
                    )}
                  </span>
                </span>
              </div>
              {!b.earned && (
                <div className="mt-2 h-1 rounded-full bg-[#ece7dc] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${b.progress}%`, background: accent }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Daily reminder */}
      <section className={card}>
        <h2 className={h2}>{en ? "Daily reminder" : "প্রতিদিনের রিমাইন্ডার"}</h2>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {push === "on" ? <Bell className="w-5 h-5 shrink-0" style={{ color: accent }} /> : <BellOff className="w-5 h-5 shrink-0 text-[#8a8f99]" />}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#17191d]">{en ? "Notifications" : "নোটিফিকেশন"}</p>
              <p className="text-xs text-[#717887]">
                {push === "on"
                  ? en ? "On for this device" : "এই ডিভাইসে চালু আছে"
                  : en ? "A nudge to keep your streak" : "স্ট্রিক ধরে রাখতে মনে করিয়ে দেবে"}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={push === "on"}
            aria-label={en ? "Notifications" : "নোটিফিকেশন"}
            disabled={busy || push === "loading" || push === "unsupported" || push === "denied"}
            onClick={togglePush}
            className="relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40"
            style={{ background: push === "on" ? accent : "#d5d0c4" }}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${push === "on" ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>

        <label className="mt-3 flex items-center justify-between gap-3 border-t border-[#f0ece3] pt-3">
          <span className="text-sm font-semibold text-[#17191d]">{en ? "Remind me at" : "কখন মনে করাব"}</span>
          <select
            value={hour}
            disabled={busy}
            onChange={(e) => changeHour(Number(e.target.value))}
            className="rounded-lg border border-[#ded8cb] bg-[#faf8f4] px-2.5 py-2 text-sm font-semibold text-[#17191d]"
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hourLabel(h, en)}
              </option>
            ))}
          </select>
        </label>

        {push === "unsupported" && (
          <p className="mt-3 rounded-lg bg-[#faf8f4] border border-[#ece7dc] px-3 py-2 text-xs text-[#5b616d] leading-relaxed">
            {en
              ? "This browser cannot show notifications. On iPhone, first add the app to your Home Screen, then open it from there."
              : "এই ব্রাউজারে নোটিফিকেশন চলে না। আইফোনে আগে অ্যাপটি হোম স্ক্রিনে যোগ করুন, তারপর সেখান থেকে খুলুন।"}
          </p>
        )}
        {push === "denied" && (
          <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 leading-relaxed">
            {en
              ? "Notifications are blocked for this site. Allow them in your browser's site settings, then come back."
              : "এই সাইটের নোটিফিকেশন ব্লক করা আছে। ব্রাউজারের সাইট সেটিংস থেকে অনুমতি দিন, তারপর আবার আসুন।"}
          </p>
        )}
        {note && <p className="mt-2 text-xs text-[#5b616d]" role="status">{note}</p>}
      </section>

      {/* App */}
      <section className={card}>
        <h2 className={h2}>{en ? "Mobile app" : "মোবাইল অ্যাপ"}</h2>
        <div className="mt-3 flex items-center gap-3">
          <Smartphone className="w-5 h-5 shrink-0 text-[#8a8f99]" />
          <p className="flex-1 text-sm text-[#3d434d]">
            {installed
              ? en ? "The app is installed on this device." : "এই ডিভাইসে অ্যাপ ইনস্টল করা আছে।"
              : installable
              ? en ? "Add খবরাখবর to your home screen." : "খবরাখবর হোম স্ক্রিনে যোগ করুন।"
              : en ? "Open your browser menu and choose “Add to Home screen”." : "ব্রাউজারের মেনু থেকে “Add to Home screen” বেছে নিন।"}
          </p>
          {installed ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={3} />
          ) : (
            installable && (
              <button type="button" onClick={install} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-bold text-white shrink-0" style={{ background: accent }}>
                <Download className="w-4 h-4" />
                {en ? "Install" : "ইনস্টল"}
              </button>
            )
          )}
        </div>
      </section>

      {/* Links */}
      <section className="rounded-2xl border border-[#e5e0d6] bg-white overflow-hidden">
        <Link href="/saved" className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-[#17191d] active:bg-[#faf8f4]">
          <Bookmark className="w-4.5 h-4.5 text-[#8a8f99]" />
          <span className="flex-1">{en ? "My notebook & profile" : "আমার নোটবুক ও প্রোফাইল"}</span>
          <ChevronRight className="w-4 h-4 text-[#a8adb7]" />
        </Link>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 border-t border-[#f0ece3] px-4 py-3.5 text-sm font-semibold text-[#b42318] active:bg-[#faf8f4]">
          <LogOut className="w-4.5 h-4.5" />
          {en ? "Log out" : "লগআউট"}
        </button>
      </section>
    </div>
  );
}
