"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getTodayProgressAction, type TodayProgress } from "@/actions/progress";

// One shared copy of today's progress for the ring in the nav, the header and the
// mission panel, so they always show the same number and only one request is made.

let state: TodayProgress | null = null;
let loading = false;
// A refresh asked for while one was running (e.g. two MCQs answered quickly) runs right after
let again = false;
let lastFetch = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export async function refreshToday(force = false): Promise<void> {
  if (loading) {
    if (force) again = true;
    return;
  }
  if (!force && Date.now() - lastFetch < 15_000) return;
  loading = true;
  try {
    const before = state;
    state = await getTodayProgressAction();
    lastFetch = Date.now();
    // The goal was just completed: let the panel celebrate
    if (before && before.loggedIn && !before.done && state.done && typeof window !== "undefined") {
      window.dispatchEvent(new Event("kk-goal-done"));
    }
    emit();
  } catch {
    // offline or the server is restarting: keep what we had
  } finally {
    loading = false;
    if (again) {
      again = false;
      void refreshToday(true);
    }
  }
}

/** Call after something that counts towards the goal (story read, MCQ, word, look-up). */
export function notifyProgress(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("kk-progress"));
}

export function openTodayPanel(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("kk-open-today"));
}

let wired = false;
function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("kk-progress", () => void refreshToday(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshToday();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTodayProgress(): TodayProgress | null {
  const value = useSyncExternalStore(subscribe, () => state, () => null);
  useEffect(() => {
    wire();
    void refreshToday();
  }, []);
  return value;
}
