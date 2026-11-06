/**
 * The early-bird notice: from 28 November until the end of 2 December 2026 (Bangladesh
 * time) the site tells users about the 50% early-bird offer on Pro. Everything is free
 * until 2 December; payments come later.
 */
export const EARLY_BIRD_START = "2026-11-28";
export const TRIAL_END = "2026-12-02";

const dhakaDay = (now: number) => new Date(now + 6 * 3600_000).toISOString().slice(0, 10);

export function isEarlyBirdWindow(now: number = Date.now()): boolean {
  const day = dhakaDay(now);
  return day >= EARLY_BIRD_START && day <= TRIAL_END;
}

/** Whole days left of the free period, counting today (2 Dec itself = 1). */
export function trialDaysLeft(now: number = Date.now()): number {
  const today = Date.parse(dhakaDay(now) + "T00:00:00Z");
  const end = Date.parse(TRIAL_END + "T00:00:00Z");
  return Math.max(0, Math.round((end - today) / 86400_000) + 1);
}
