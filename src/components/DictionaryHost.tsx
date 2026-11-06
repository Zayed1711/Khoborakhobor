"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import FocusDictionaryModal from "@/components/FocusDictionaryModal";
import { getCurrentSession } from "@/actions/auth";
import { useAppMode } from "@/context/LanguageContext";
import type { Student } from "@/types";

/** Open the site's dictionary from anywhere: window.dispatchEvent(new CustomEvent(DICTIONARY_EVENT, { detail: { word } })) */
export const DICTIONARY_EVENT = "khobor_open_dictionary";
export const openDictionary = (word = "") => window.dispatchEvent(new CustomEvent(DICTIONARY_EVENT, { detail: { word } }));

/** A story page tells the dictionary which story it is on, so looked-up words can be saved to it. */
export const STORY_SLUG_KEY = "__khoborStorySlug";

/**
 * The one dictionary popup for the whole site. On story pages (/article/...) a small tab on the
 * right edge opens it, looking up the word the student selected, if any. The popup itself can be
 * opened from anywhere with openDictionary() (e.g. the vocabulary deck). Never in admin or the exam.
 */
export default function DictionaryHost() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [nonce, setNonce] = useState(0);
  const [student, setStudent] = useState<Student | null>(null);
  const [slug, setSlug] = useState("");
  const { isEnglishMode } = useAppMode();
  const picked = useRef("");
  const hidden = pathname.startsWith("/admin") || pathname.startsWith("/exam");
  const onStory = pathname.startsWith("/article/");

  useEffect(() => {
    const onOpen = (e: Event) => {
      const w = ((e as CustomEvent).detail?.word || "").toString().slice(0, 40);
      setWord(w);
      setNonce((n) => n + 1);
      setSlug(((window as unknown as Record<string, string>)[STORY_SLUG_KEY] || "").toString());
      setOpen(true);
      getCurrentSession()
        .then((s) => setStudent((s?.student as Student | null) ?? null))
        .catch(() => setStudent(null));
    };
    window.addEventListener(DICTIONARY_EVENT, onOpen);
    return () => window.removeEventListener(DICTIONARY_EVENT, onOpen);
  }, []);

  if (hidden) return null;

  return (
    <>
      {onStory && (
        <button
          type="button"
          // Read the selection before the tap clears it (phones clear it on touch)
          onPointerDown={(e) => {
            e.preventDefault();
            picked.current = window.getSelection()?.toString().trim() || "";
          }}
          onClick={() => {
            const selected = picked.current || window.getSelection()?.toString().trim() || "";
            picked.current = "";
            openDictionary(selected && selected.split(/\s+/).length <= 3 ? selected : "");
          }}
          aria-label={isEnglishMode ? "Open the dictionary" : "অভিধান খুলুন"}
          title={isEnglishMode ? "Dictionary: select a word, then tap here" : "অভিধান: শব্দ সিলেক্ট করে এখানে চাপুন"}
          data-dictionary-tab
          className="print:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 rounded-l-xl bg-[#1e40af] text-white shadow-lg px-1 py-2.5 sm:px-1.5 sm:py-3 hover:bg-[#1a3796] active:scale-95 transition"
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="[writing-mode:vertical-rl] text-[11px] sm:text-xs font-semibold tracking-wide leading-none">{isEnglishMode ? "Dictionary" : "অভিধান"}</span>
        </button>
      )}
      <FocusDictionaryModal key={nonce} isOpen={open} onClose={() => setOpen(false)} initialWord={word} articleSlug={slug} student={student} />
    </>
  );
}
