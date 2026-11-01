"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type LanguageMode = "bn" | "en";

interface LanguageContextType {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "bn",
  setLanguage: () => {},
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageMode>("bn");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Read from localStorage or Cookie
    const stored = localStorage.getItem("khobor_lang") as LanguageMode | null;
    if (stored === "en" || stored === "bn") {
      setLanguageState(stored);
      applyLanguage(stored);
    } else {
      // Check cookie
      const match = document.cookie.match(/khobor_lang=(bn|en)/);
      if (match && (match[1] === "bn" || match[1] === "en")) {
        setLanguageState(match[1]);
        applyLanguage(match[1]);
      } else {
        applyLanguage("bn");
      }
    }
  }, []);

  const applyLanguage = (lang: LanguageMode) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);
      document.cookie = `khobor_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    }
  };

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("khobor_lang", lang);
      applyLanguage(lang);
      window.dispatchEvent(new CustomEvent("khobor_language_change", { detail: lang }));
    }
  };

  const toggleLanguage = () => {
    const next = language === "bn" ? "en" : "bn";
    setLanguage(next);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

