"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Flame, Snowflake, Check, Zap, Timer, Newspaper, ListChecks, BookA, Search, ChevronRight, PartyPopper } from "lucide-react";
import { useAppMode } from "@/context/LanguageContext";
import { refreshToday, useTodayProgress } from "@/lib/today-client";
import { openDictionary } from "@/components/DictionaryHost";
import { GOAL_BONUS_XP, type TaskKey } from "@/lib/study/daily-goal";
import TodayRing from "@/components/TodayRing";

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const TASKS: Record<TaskKey, { icon: typeof Newspaper; bn: (n: string) => string; en: (n: number) => string; hintBn: string; hintEn: string }> = {
  stories: { icon: Newspaper, bn: (n) => `${n}টি খবর পড়ুন`, en: (n) => `Read ${n} stories`, hintBn: "খবর খুলে অন্তত ৩০ সেকেন্ড পড়ুন", hintEn: "Open a story and read for 30 seconds" },
  mcqs: { icon: ListChecks, bn: (n) => `${n}টি MCQ-এর উত্তর দিন`, en: (n) => `Answer ${n} MCQs`, hintBn: "খবরের নিচে “নিজেকে যাচাই করুন”", hintEn: "Under each story: “Test yourself”" },
  words: { icon: BookA, bn: (n) => `${n}টি শব্দ সংরক্ষণ করুন`, en: (n) => `Save ${n} word`, hintBn: "অভিধান থেকে শব্দ সেভ করুন", hintEn: "Save a word from the dictionary" },
  lookups: { icon: Search, bn: (n) => `অভিধানে ${n}টি শব্দ খুঁজুন`, en: (n) => `Look up ${n} word`, hintBn: "অভিধান খুলে যেকোনো শব্দ খুঁজুন", hintEn: "Search any word in the dictionary" },
};

/**
 * "আজকের মিশন": today's goal, streak, XP and the study shortcuts in one panel.
 * Slides up from the bottom on phones, sits in the middle on larger screens.
 * Opened from anywhere with openTodayPanel() (src/lib/today-client.ts).
 */
export default function TodayMissionSheet() {
  const { isEnglishMode: en } = useAppMode();
  // The page the panel was opened on; moving to another page closes it
  const [openAt, setOpenAt] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const progress = useTodayProgress();
  const pathname = usePathname();
  const open = openAt !== null && openAt === pathname;
  const num = (n: number) => (en ? String(n) : bn(n));

  useEffect(() => {
    const onOpen = () => {
      setOpenAt(window.location.pathname);
      void refreshToday(true);
    };
    const onDone = () => {
      setCelebrate(true);
      setOpenAt(window.location.pathname);
    };
    window.addEventListener("kk-open-today", onOpen);
    window.addEventListener("kk-goal-done", onDone);
    // A reminder notification opens the site with "?open=today"
    const fromLink = new URLSearchParams(window.location.search).get("open") === "today" ? setTimeout(onOpen, 300) : undefined;
    return () => {
      clearTimeout(fromLink);
      window.removeEventListener("kk-open-today", onOpen);
      window.removeEventListener("kk-goal-done", onDone);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  const close = () => {
    setOpenAt(null);
    setCelebrate(false);
  };
  const accent = en ? "#1e40af" : "#842323";
  const p = progress;

  return (
    <div className="print:hidden fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/45" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={en ? "Today's mission" : "আজকের মিশন"}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-[#ded8cb] max-h-[88vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+0.75rem)] animate-in slide-in-from-bottom md:zoom-in-95 duration-200"
      >
        {/* Grab bar (phones) + close */}
        <div className="relative pt-2.5 pb-1">
          <div className="md:hidden mx-auto h-1 w-10 rounded-full bg-[#ded8cb]" />
          <button onClick={close} aria-label={en ? "Close" : "বন্ধ করুন"} className="absolute right-3 top-2.5 p-1.5 rounded-full text-[#6b7280] hover:bg-[#f3efe6]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-1 pb-2 space-y-4">
          {/* Ring + streak */}
          <div className="flex items-center gap-4">
            <TodayRing percent={p?.percent ?? 0} done={!!p?.done} size={88} stroke={8} accent={accent}>
              <span className="text-xl font-black leading-none">{num(p?.percent ?? 0)}%</span>
            </TodayRing>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#17191d] leading-tight">{en ? "Today's mission" : "আজকের মিশন"}</h2>
              {p?.loggedIn ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${p.activeToday ? "bg-orange-100 text-orange-700" : "bg-[#f3efe6] text-[#6b7280]"}`}>
                    <Flame className="w-3.5 h-3.5" />
                    {en ? `${p.streak} day streak` : `${bn(p.streak)} দিনের স্ট্রিক`}
                  </span>
                  {p.freezeReady && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 bg-sky-50 text-sky-700" title={en ? "Miss one day this week and your streak is safe" : "সপ্তাহে একদিন বাদ গেলেও স্ট্রিক ভাঙবে না"}>
                      <Snowflake className="w-3.5 h-3.5" />
                      {en ? "1 freeze" : "১টি ফ্রিজ"}
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-1 text-sm text-[#5b616d]">{en ? "Fill the ring every day." : "প্রতিদিন রিংটি পূর্ণ করুন।"}</p>
              )}
              {p?.loggedIn && !p.activeToday && p.streak > 0 && (
                <p className="mt-1.5 text-xs text-orange-700">{en ? "Read one story to keep your streak." : "স্ট্রিক ধরে রাখতে আজ একটি খবর পড়ুন।"}</p>
              )}
            </div>
          </div>

          {celebrate && p?.done && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm font-semibold text-amber-800">
              <PartyPopper className="w-5 h-5 shrink-0" />
              {en ? `Goal complete! +${GOAL_BONUS_XP} XP bonus` : `আজকের লক্ষ্য পূর্ণ! +${bn(GOAL_BONUS_XP)} XP বোনাস`}
            </div>
          )}

          {!p ? (
            <div className="h-40 rounded-xl bg-[#f7f4ee] animate-pulse" />
          ) : !p.loggedIn ? (
            <div className="rounded-xl border border-[#ece7dc] bg-[#faf8f4] p-4 text-center space-y-3">
              <p className="text-sm text-[#3d434d]">
                {en ? "Log in to track your daily goal, streak and XP." : "প্রতিদিনের লক্ষ্য, স্ট্রিক ও XP জমাতে লগইন করুন।"}
              </p>
              <Link href="/login" className="inline-block rounded-lg px-5 py-2.5 text-sm font-bold text-white" style={{ background: accent }}>
                {en ? "Log in / Sign up" : "লগইন / সাইন আপ"}
              </Link>
            </div>
          ) : (
            <>
              {/* Goal checklist */}
              <ul className="space-y-2">
                {p.goal.map((t) => {
                  const meta = TASKS[t.key];
                  const have = Math.min(p.counts[t.key], t.target);
                  const ok = have >= t.target;
                  const Icon = meta.icon;
                  const dict = t.key === "words" || t.key === "lookups";
                  const body = (
                    <>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ok ? "bg-emerald-100 text-emerald-700" : "bg-[#f3efe6] text-[#5b616d]"}`}>
                        {ok ? <Check className="w-4.5 h-4.5" strokeWidth={3} /> : <Icon className="w-4.5 h-4.5" />}
                      </span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className={`block text-sm font-semibold ${ok ? "text-[#6b7280] line-through" : "text-[#17191d]"}`}>
                          {en ? meta.en(t.target) : meta.bn(bn(t.target))}
                        </span>
                        <span className="mt-1 block h-1.5 rounded-full bg-[#ece7dc] overflow-hidden">
                          <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${(have / t.target) * 100}%`, background: ok ? "#059669" : accent }} />
                        </span>
                        {!ok && <span className="mt-1 block text-xs text-[#717887]">{en ? meta.hintEn : meta.hintBn}</span>}
                      </span>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-[#5b616d]">
                        {num(have)}/{num(t.target)}
                      </span>
                      {!ok && <ChevronRight className="w-4 h-4 shrink-0 text-[#a8adb7]" />}
                    </>
                  );
                  const cls = "flex w-full items-center gap-3 rounded-xl border border-[#ece7dc] px-3 py-2.5 active:bg-[#faf8f4]";
                  return (
                    <li key={t.key}>
                      {ok ? (
                        <div className={cls}>{body}</div>
                      ) : dict ? (
                        <button type="button" className={cls} onClick={() => { close(); openDictionary(); }}>
                          {body}
                        </button>
                      ) : (
                        <Link href="/" className={cls} onClick={close}>
                          {body}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Level + XP */}
              <div className="rounded-xl bg-[#faf8f4] border border-[#ece7dc] px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-bold text-[#17191d]">
                    {en ? `Level ${p.level.level} · ${p.level.en}` : `লেভেল ${bn(p.level.level)} · ${p.level.bn}`}
                  </span>
                  <span className="text-xs font-semibold text-[#5b616d] tabular-nums">{num(p.xp)} XP</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#ece7dc] overflow-hidden">
                  <div className="h-full rounded-full bg-[#c98a1b] transition-all duration-700" style={{ width: `${p.level.progress}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-[#717887]">
                  <span>{en ? `+${p.todayXp} XP today` : `আজ +${bn(p.todayXp)} XP`}</span>
                  {p.level.nextAt !== null && (
                    <span>{en ? `${p.level.nextAt - p.xp} XP to next level` : `পরের লেভেলে আর ${bn(p.level.nextAt - p.xp)} XP`}</span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Shortcuts: the capsule and the study timer live here on phones */}
          <div className="grid grid-cols-2 gap-2">
            <Link href="/capsule" onClick={close} className="flex items-center justify-center gap-2 rounded-xl border border-[#ded8cb] bg-white px-3 py-3 text-sm font-semibold text-[#17191d] active:bg-[#faf8f4]">
              <Zap className="w-4 h-4" style={{ color: accent }} />
              {en ? "5-min capsule" : "৫ মিনিটের ক্যাপসুল"}
            </Link>
            <button
              type="button"
              onClick={() => {
                close();
                window.dispatchEvent(new Event("kk-open-pomodoro"));
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#ded8cb] bg-white px-3 py-3 text-sm font-semibold text-[#17191d] active:bg-[#faf8f4]"
            >
              <Timer className="w-4 h-4" style={{ color: accent }} />
              {en ? "Study timer" : "স্টাডি টাইমার"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
