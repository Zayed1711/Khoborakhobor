"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isInstalledApp } from "@/lib/pwa-client";
import { canPromptInstall, promptInstall } from "@/components/PwaRegister";

/**
 *  - "ready":     the browser can install with one tap (Android/desktop Chrome, Edge)
 *  - "manual":    no one-tap offer (iPhone, Firefox…): the button opens the guide at /app
 *  - "installed": already inside the installed app: show nothing
 *  - null:        not known yet (before the page has loaded in the browser)
 */
export type InstallState = "ready" | "manual" | "installed" | null;

/** One install button behaviour shared by the header, the home card and the bottom bar. */
export function useInstallApp(): { state: InstallState; install: () => Promise<void> } {
  const router = useRouter();
  const [state, setState] = useState<InstallState>(null);

  useEffect(() => {
    const sync = () => setState(isInstalledApp() ? "installed" : canPromptInstall() ? "ready" : "manual");
    const t = setTimeout(sync, 0);
    const onInstalled = () => setState("installed");
    window.addEventListener("kk-installable", sync);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearTimeout(t);
      window.removeEventListener("kk-installable", sync);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (canPromptInstall()) {
      const ok = await promptInstall();
      setState(ok ? "installed" : canPromptInstall() ? "ready" : "manual");
    } else {
      router.push("/app");
    }
  }, [router]);

  return { state, install };
}
