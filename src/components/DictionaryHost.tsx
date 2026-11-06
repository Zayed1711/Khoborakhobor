"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import FocusDictionaryModal from "@/components/FocusDictionaryModal";
import { getCurrentSession } from "@/actions/auth";
import type { Student } from "@/types";

/** Open the site's dictionary from anywhere: window.dispatchEvent(new CustomEvent(DICTIONARY_EVENT, { detail: { word } })) */
export const DICTIONARY_EVENT = "khobor_open_dictionary";
export const openDictionary = (word = "") => window.dispatchEvent(new CustomEvent(DICTIONARY_EVENT, { detail: { word } }));

/** A story page tells the dictionary which story it is on, so looked-up words can be saved to it. */
export const STORY_SLUG_KEY = "__khoborStorySlug";

/**
 * The one dictionary popup for the whole site, plus a floating dictionary button on phones.
 * Not shown in the admin area or during the weekly exam.
 */
export default function DictionaryHost() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [nonce, setNonce] = useState(0);
  const [student, setStudent] = useState<Student | null>(null);
  const [slug, setSlug] = useState("");
  const hidden = pathname.startsWith("/admin") || pathname.startsWith("/exam");

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
      <button
        type="button"
        onClick={() => {
          const selected = window.getSelection()?.toString().trim() || "";
          openDictionary(selected.split(/\s+/).length <= 3 ? selected : "");
        }}
        aria-label="অভিধান (Dictionary)"
        title="অভিধান (Dictionary)"
        className="md:hidden print:hidden fixed right-4 bottom-[8.25rem] z-40 w-12 h-12 rounded-full bg-[#1e40af] text-white shadow-lg flex items-center justify-center active:scale-95 transition"
      >
        <BookOpen className="w-5 h-5" />
      </button>
      <FocusDictionaryModal key={nonce} isOpen={open} onClose={() => setOpen(false)} initialWord={word} articleSlug={slug} student={student} />
    </>
  );
}
