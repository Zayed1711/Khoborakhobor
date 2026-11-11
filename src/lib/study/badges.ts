// Badges shown on the "Me" page. Worked out from numbers the site already keeps,
// so nothing new is stored and a badge can never be lost by a bug.

export interface BadgeStats {
  streak: number;
  /** Days on which the daily goal was completed */
  goalDays: number;
  stories: number;
  mcqs: number;
  words: number;
  level: number;
}

export interface Badge {
  id: string;
  emoji: string;
  bn: string;
  en: string;
  /** What to do to earn it */
  howBn: string;
  howEn: string;
  earned: boolean;
  /** 0-100 towards earning it */
  progress: number;
}

const DEFS: { id: string; emoji: string; bn: string; en: string; key: keyof BadgeStats; need: number; howBn: string; howEn: string }[] = [
  { id: "first-story", emoji: "📖", bn: "প্রথম পাঠ", en: "First Read", key: "stories", need: 1, howBn: "১টি খবর পড়ুন", howEn: "Read 1 story" },
  { id: "goal-1", emoji: "🎯", bn: "লক্ষ্যভেদী", en: "On Target", key: "goalDays", need: 1, howBn: "১ দিন রিং পূর্ণ করুন", howEn: "Fill the ring once" },
  { id: "streak-3", emoji: "🔥", bn: "৩ দিনের ধারা", en: "3-Day Streak", key: "streak", need: 3, howBn: "টানা ৩ দিন পড়ুন", howEn: "Read 3 days in a row" },
  { id: "streak-7", emoji: "⚡", bn: "সাপ্তাহিক যোদ্ধা", en: "Week Warrior", key: "streak", need: 7, howBn: "টানা ৭ দিন পড়ুন", howEn: "Read 7 days in a row" },
  { id: "streak-30", emoji: "🏆", bn: "মাসজয়ী", en: "Month Master", key: "streak", need: 30, howBn: "টানা ৩০ দিন পড়ুন", howEn: "Read 30 days in a row" },
  { id: "goal-7", emoji: "💎", bn: "৭ বার পূর্ণ রিং", en: "7 Full Rings", key: "goalDays", need: 7, howBn: "৭ দিন রিং পূর্ণ করুন", howEn: "Fill the ring on 7 days" },
  { id: "stories-50", emoji: "📰", bn: "সংবাদপ্রেমী", en: "News Lover", key: "stories", need: 50, howBn: "৫০টি খবর পড়ুন", howEn: "Read 50 stories" },
  { id: "mcq-100", emoji: "🧠", bn: "MCQ মাস্টার", en: "MCQ Master", key: "mcqs", need: 100, howBn: "১০০টি MCQ-এর উত্তর দিন", howEn: "Answer 100 MCQs" },
  { id: "words-25", emoji: "🔤", bn: "শব্দ সংগ্রাহক", en: "Word Collector", key: "words", need: 25, howBn: "২৫টি শব্দ সংরক্ষণ করুন", howEn: "Save 25 words" },
  { id: "level-3", emoji: "🎓", bn: "মনোযোগী শিক্ষার্থী", en: "Focused Learner", key: "level", need: 3, howBn: "লেভেল ৩-এ পৌঁছান", howEn: "Reach level 3" },
];

export function badgesFor(stats: BadgeStats): Badge[] {
  return DEFS.map((d) => {
    const have = Math.max(stats[d.key] || 0, 0);
    return {
      id: d.id,
      emoji: d.emoji,
      bn: d.bn,
      en: d.en,
      howBn: d.howBn,
      howEn: d.howEn,
      earned: have >= d.need,
      progress: Math.min(100, Math.round((have / d.need) * 100)),
    };
  });
}
