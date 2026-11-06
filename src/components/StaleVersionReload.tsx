"use client";

import { useEffect } from "react";

// A page opened before a deploy asks for code files and server actions of the old version,
// which no longer exist ("ChunkLoadError", "Server Action … was not found"). Reloading gets
// the new version. Once per minute at most, so a real outage can never cause a reload loop.
const STALE = /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|Server Action .* was not found|Failed to find Server Action|failed-to-find-server-action/i;
const KEY = "khobor_stale_reload_at";

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < 60_000) return;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // storage blocked: still reload, the browser's own cache keeps this rare
  }
  window.location.reload();
}

export function isStaleVersionError(message: string): boolean {
  return STALE.test(message || "");
}

export default function StaleVersionReload() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (isStaleVersionError(`${e.message} ${e.error?.name || ""} ${e.error?.message || ""}`)) reloadOnce();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { name?: string; message?: string } | undefined;
      if (isStaleVersionError(`${r?.name || ""} ${r?.message || String(e.reason || "")}`)) reloadOnce();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
