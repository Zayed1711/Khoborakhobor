"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

export type AppMode = "job_prep" | "english_learning";
export type LanguageMode = "bn" | "en";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  isEnglishMode: boolean;
  isJobPrepMode: boolean;
  // 100% backward compatibility for legacy useLanguage callers
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  toggleLanguage: () => void;
  /** Set while a story is open: the mode cannot be switched away from the story's mode */
  lockedMode: AppMode | null;
  /** Show the site in `mode` and keep it there (not saved as the reader's choice) */
  lockMode: (mode: AppMode) => void;
  /** End the lock and return to the reader's own saved mode */
  unlockMode: () => void;
}

const AppModeContext = createContext<AppModeContextType>({
  mode: "job_prep",
  setMode: () => {},
  toggleMode: () => {},
  isEnglishMode: false,
  isJobPrepMode: true,
  language: "bn",
  setLanguage: () => {},
  toggleLanguage: () => {},
  lockedMode: null,
  lockMode: () => {},
  unlockMode: () => {},
});

const langOf = (m: AppMode): LanguageMode => (m === "english_learning" ? "en" : "bn");

/** Page attributes only: used for a story's temporary mode, which is not saved */
function showMode(m: AppMode) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-mode", m);
    document.documentElement.setAttribute("lang", langOf(m));
  }
}

function applyDocAttributes(m: AppMode, l: LanguageMode) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-mode", m);
    document.documentElement.setAttribute("lang", l);
    document.cookie = `khobor_mode=${m}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `khobor_lang=${l}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("job_prep");
  const [language, setLanguageState] = useState<LanguageMode>("bn");
  const [lockedMode, setLockedMode] = useState<AppMode | null>(null);
  // Refs: a story page locks in its own effect, which React runs before this provider's
  // effect that reads the saved mode, so both need the latest values
  const lockedRef = useRef<AppMode | null>(null);
  const savedModeRef = useRef<AppMode>("job_prep");
  /** True when a switch to `target` must be ignored because a story is open */
  const blocked = (target: AppMode) => lockedRef.current !== null && lockedRef.current !== target;

  useEffect(() => {
    // 1. Resolve Mode & Language from localStorage
    const storedMode = localStorage.getItem("khobor_mode") as AppMode | null;
    const storedLang = localStorage.getItem("khobor_lang") as LanguageMode | null;

    if (storedMode === "english_learning" || storedMode === "job_prep") {
      const activeLang: LanguageMode = storedMode === "english_learning" ? "en" : (storedLang || "bn");
      savedModeRef.current = storedMode;
      if (lockedRef.current) return showMode(lockedRef.current);
      setModeState(storedMode);
      setLanguageState(activeLang);
      applyDocAttributes(storedMode, activeLang);
    } else {
      // 2. Fallback to Cookies
      const modeMatch = document.cookie.match(/khobor_mode=(job_prep|english_learning)/);
      const langMatch = document.cookie.match(/khobor_lang=(bn|en)/);

      const resolvedMode: AppMode = modeMatch
        ? (modeMatch[1] as AppMode)
        : langMatch?.[1] === "en"
        ? "english_learning"
        : "job_prep";

      const resolvedLang: LanguageMode =
        resolvedMode === "english_learning"
          ? "en"
          : (langMatch?.[1] as LanguageMode) || "bn";

      savedModeRef.current = resolvedMode;
      if (lockedRef.current) return showMode(lockedRef.current);
      setModeState(resolvedMode);
      setLanguageState(resolvedLang);
      applyDocAttributes(resolvedMode, resolvedLang);
    }
  }, []);

  const setMode = useCallback((newMode: AppMode) => {
    if (blocked(newMode)) return;
    savedModeRef.current = newMode;
    setModeState(newMode);
    const newLang: LanguageMode = newMode === "english_learning" ? "en" : "bn";
    setLanguageState(newLang);

    if (typeof window !== "undefined") {
      localStorage.setItem("khobor_mode", newMode);
      localStorage.setItem("khobor_lang", newLang);
      applyDocAttributes(newMode, newLang);
      window.dispatchEvent(new CustomEvent("khobor_mode_change", { detail: newMode }));
      window.dispatchEvent(new CustomEvent("khobor_language_change", { detail: newLang }));
    }
  }, []);

  const toggleMode = useCallback(() => {
    if (lockedRef.current) return;
    setModeState((prev) => {
      const next: AppMode = prev === "job_prep" ? "english_learning" : "job_prep";
      savedModeRef.current = next;
      const nextLang: LanguageMode = next === "english_learning" ? "en" : "bn";
      setLanguageState(nextLang);
      if (typeof window !== "undefined") {
        localStorage.setItem("khobor_mode", next);
        localStorage.setItem("khobor_lang", nextLang);
        applyDocAttributes(next, nextLang);
        window.dispatchEvent(new CustomEvent("khobor_mode_change", { detail: next }));
        window.dispatchEvent(new CustomEvent("khobor_language_change", { detail: nextLang }));
      }
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang: LanguageMode) => {
    if (blocked(lang === "en" ? "english_learning" : "job_prep")) return;
    savedModeRef.current = lang === "en" ? "english_learning" : "job_prep";
    setLanguageState(lang);
    const mappedMode: AppMode = lang === "en" ? "english_learning" : "job_prep";
    setModeState(mappedMode);

    if (typeof window !== "undefined") {
      localStorage.setItem("khobor_lang", lang);
      localStorage.setItem("khobor_mode", mappedMode);
      applyDocAttributes(mappedMode, lang);
      window.dispatchEvent(new CustomEvent("khobor_language_change", { detail: lang }));
      window.dispatchEvent(new CustomEvent("khobor_mode_change", { detail: mappedMode }));
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    if (lockedRef.current) return;
    setLanguageState((prev) => {
      const next: LanguageMode = prev === "bn" ? "en" : "bn";
      const mappedMode: AppMode = next === "en" ? "english_learning" : "job_prep";
      savedModeRef.current = mappedMode;
      setModeState(mappedMode);
      if (typeof window !== "undefined") {
        localStorage.setItem("khobor_lang", next);
        localStorage.setItem("khobor_mode", mappedMode);
        applyDocAttributes(mappedMode, next);
        window.dispatchEvent(new CustomEvent("khobor_language_change", { detail: next }));
        window.dispatchEvent(new CustomEvent("khobor_mode_change", { detail: mappedMode }));
      }
      return next;
    });
  }, []);

  const lockMode = useCallback((m: AppMode) => {
    lockedRef.current = m;
    setLockedMode(m);
    setModeState(m);
    setLanguageState(langOf(m));
    showMode(m);
  }, []);

  const unlockMode = useCallback(() => {
    if (!lockedRef.current) return;
    lockedRef.current = null;
    setLockedMode(null);
    // Back to the reader's own choice (the story's mode was never saved)
    const own = savedModeRef.current;
    setModeState(own);
    setLanguageState(langOf(own));
    showMode(own);
  }, []);

  return (
    <AppModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isEnglishMode: mode === "english_learning",
        isJobPrepMode: mode === "job_prep",
        language,
        setLanguage,
        toggleLanguage,
        lockedMode,
        lockMode,
        unlockMode,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}

export function useLanguage() {
  return useContext(AppModeContext);
}
