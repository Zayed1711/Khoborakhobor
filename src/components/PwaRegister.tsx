"use client";

import { useEffect } from "react";

// The browser's "install this app" offer. Chrome hands it over once per page load; it is
// kept here so the "Install" button (Me page, download page) can show it on a tap.
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let installEvent: InstallPromptEvent | null = null;

export function canPromptInstall(): boolean {
  return installEvent !== null;
}

/** Show the browser's install dialog. True if the user installed. */
export async function promptInstall(): Promise<boolean> {
  const ev = installEvent;
  if (!ev) return false;
  installEvent = null;
  try {
    await ev.prompt();
    return (await ev.userChoice).outcome === "accepted";
  } catch {
    return false;
  }
}

// Registers the service worker (public/sw.js) that gives offline reading and notifications.
// Production only: in development it would keep serving saved files while you edit.
export default function PwaRegister() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      installEvent = e as InstallPromptEvent;
      window.dispatchEvent(new Event("kk-installable"));
    };
    const onInstalled = () => {
      installEvent = null;
      window.dispatchEvent(new Event("kk-installable"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const register = () => {
      if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("load", register);
    };
  }, []);
  return null;
}
