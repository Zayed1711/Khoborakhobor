// What a reminder notification says, and when one is due. Pure functions (no database),
// so every rule is tested. The sender is src/app/api/cron/reminders/route.ts.
//
// Rules agreed with the owner:
//  - at most 2 notifications per device per day
//  - nothing once today's goal is done
//  - never generic: the text depends on the reader's streak, ring and today's news

import type { GoalTask, DayCounts } from "@/lib/study/daily-goal";
import type { PushMessage } from "@/lib/push";

export const MAX_PER_DAY = 2;
/** Last-chance streak reminder, Bangladesh time */
export const RESCUE_HOUR = 22;
/** Friday exam opens at 7 am; the reminder goes out in this hour */
export const EXAM_HOUR = 7;

export type ReminderKind = "main" | "rescue" | "exam";

const bn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

export interface ReaderState {
  /** null = nobody is logged in on this device */
  streak: number | null;
  /** The streak is still alive (not already lost) */
  streakAlive: boolean;
  activeToday: boolean;
  done: boolean;
  percent: number;
  counts: DayCounts;
  goal: GoalTask[];
}

export interface Teaser {
  question: string;
  slug: string;
}

const TASK_BN: Record<GoalTask["key"], (n: string) => string> = {
  stories: (n) => `${n}টি খবর`,
  mcqs: (n) => `${n}টি MCQ`,
  words: (n) => `${n}টি শব্দ`,
  lookups: (n) => `অভিধানে ${n}টি শব্দ`,
};

/** "২টি খবর ও ৩টি MCQ": what is still left of today's goal */
export function remainingText(counts: DayCounts, goal: GoalTask[]): string {
  const parts = goal
    .map((t) => ({ t, left: t.target - Math.min(counts[t.key], t.target) }))
    .filter((x) => x.left > 0)
    .map((x) => TASK_BN[x.t.key](bn(x.left)));
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} ও ${parts[parts.length - 1]}`;
}

// A few wordings each, rotated by the day, so it does not read the same every evening
const STREAK_LINES = [
  (n: string) => ({ title: `🔥 ${n} দিনের স্ট্রিক ঝুঁকিতে!`, body: "আজ মাত্র একটি খবর পড়লেই স্ট্রিক বেঁচে যাবে।" }),
  (n: string) => ({ title: `⏳ ${n} দিনের ধারা আজ থামবে?`, body: "৩০ সেকেন্ড সময় দিন — একটি খবর পড়ুন, ধারা চলুক।" }),
  (n: string) => ({ title: `🔥 টানা ${n} দিন! আজ বাদ দেবেন?`, body: "একটি খবর পড়ুন, কাল সংখ্যাটা আরও এক বাড়বে।" }),
];
const FRESH_LINES = [
  { title: "📰 আজকের জরুরি খবর তৈরি", body: "৫ মিনিটের ক্যাপসুলে আজকের পরীক্ষা-উপযোগী খবর পড়ে নিন।" },
  { title: "🎯 আজকের রিং এখনও খালি", body: "৩টি খবর দিয়ে শুরু করুন — রিং পূর্ণ হলেই +৫০ XP।" },
];

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).trimEnd() + "…";
}

/** The daily reminder at the reader's chosen hour. null = send nothing. */
export function mainReminder(state: ReaderState, teaser: Teaser | null, dayIndex: number): PushMessage | null {
  if (state.done) return null;

  // Already started today: show how close the ring is
  if (state.activeToday) {
    const left = remainingText(state.counts, state.goal);
    if (!left) return null;
    return { title: `🎯 রিং ${bn(state.percent)}% পূর্ণ`, body: `আর ${left} — আজকের লক্ষ্য হাতের নাগালে!`, url: "/?open=today", tag: "kk-daily" };
  }

  // Not started and there is a streak worth keeping
  if (state.streak !== null && state.streakAlive && state.streak >= 2) {
    const line = STREAK_LINES[dayIndex % STREAK_LINES.length](bn(state.streak));
    return { ...line, url: "/", tag: "kk-daily" };
  }

  // Otherwise a real question from today's news; the answer is in the app
  if (teaser) {
    return { title: "❓ আজকের প্রশ্ন — পারবেন?", body: `${clip(teaser.question, 110)} উত্তর দেখতে ট্যাপ করুন।`, url: `/article/${teaser.slug}`, tag: "kk-daily" };
  }
  return { ...FRESH_LINES[dayIndex % FRESH_LINES.length], url: "/capsule", tag: "kk-daily" };
}

/** Last chance at 10 pm: only for a logged-in reader whose streak would break tonight. */
export function rescueReminder(state: ReaderState): PushMessage | null {
  if (state.streak === null || !state.streakAlive || state.activeToday || state.streak < 2) return null;
  return {
    title: `🚨 ২ ঘণ্টা বাকি — ${bn(state.streak)} দিনের স্ট্রিক`,
    body: "রাত ১২টার আগে একটি খবর পড়ুন, নইলে স্ট্রিক আবার ১ থেকে শুরু।",
    url: "/",
    tag: "kk-rescue",
  };
}

export function examReminder(title: string): PushMessage {
  return {
    title: "🏆 সাপ্তাহিক পরীক্ষা শুরু হয়েছে",
    body: `${clip(title, 60)} — আজ দুপুর ১২টা পর্যন্ত। ৫০ নম্বর, ৪০ মিনিট। মেধাতালিকায় নাম তুলুন!`,
    url: "/exam",
    tag: "kk-exam",
  };
}

export interface DeviceClock {
  reminderHour: number;
  /** Bangladesh date of the last notification, and which kinds went out that day */
  sentDay: string | null;
  sentKinds: string[];
}

/**
 * Which kinds this device may get right now, most important first. The sender stops at
 * the first one that produces a message. The job runs several times an hour; a kind
 * already sent today never repeats, and a missed hour is caught up in the next one.
 */
export function dueKinds(clock: DeviceClock, today: string, hour: number, examOpen: boolean): ReminderKind[] {
  const sent = clock.sentDay === today ? clock.sentKinds : [];
  if (sent.length >= MAX_PER_DAY) return [];
  const due: ReminderKind[] = [];
  if (examOpen && hour >= EXAM_HOUR && hour < 11 && !sent.includes("exam")) due.push("exam");
  if ((hour === clock.reminderHour || hour === clock.reminderHour + 1) && !sent.includes("main")) due.push("main");
  // Not when the reader's own reminder is that late anyway
  if (hour === RESCUE_HOUR && clock.reminderHour < RESCUE_HOUR - 1 && !sent.includes("rescue")) due.push("rescue");
  return due;
}
