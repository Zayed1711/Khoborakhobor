"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

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
});

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

  useEffect(() => {
    // 1. Resolve Mode & Language from localStorage
    const storedMode = localStorage.getItem("khobor_mode") as AppMode | null;
    const storedLang = localStorage.getItem("khobor_lang") as LanguageMode | null;

    if (storedMode === "english_learning" || storedMode === "job_prep") {
      const activeLang: LanguageMode = storedMode === "english_learning" ? "en" : (storedLang || "bn");
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

      setModeState(resolvedMode);
      setLanguageState(resolvedLang);
      applyDocAttributes(resolvedMode, resolvedLang);
    }
  }, []);

  const setMode = useCallback((newMode: AppMode) => {
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
    setModeState((prev) => {
      const next: AppMode = prev === "job_prep" ? "english_learning" : "job_prep";
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
    setLanguageState((prev) => {
      const next: LanguageMode = prev === "bn" ? "en" : "bn";
      const mappedMode: AppMode = next === "en" ? "english_learning" : "job_prep";
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
