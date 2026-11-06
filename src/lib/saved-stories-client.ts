"use client";

import { getMySavedArticleIdsAction } from "@/actions/student";

/** One request per page for "which stories has this student saved", shared by every card. */
let pending: Promise<Set<string>> | null = null;
export function savedStoryIds(): Promise<Set<string>> {
  pending ||= getMySavedArticleIdsAction()
    .then((ids) => new Set(ids))
    .catch(() => new Set<string>());
  return pending;
}
export function rememberSaved(id: string, saved: boolean) {
  if (pending) pending = pending.then((s) => (saved ? s.add(id) : s.delete(id), s));
}
