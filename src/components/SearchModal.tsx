"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { searchArticlesAction } from "@/actions/search";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categoryName: string;
  examTags?: string | null;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  // Keyboard shortcut listener (Ctrl+K or Cmd+K to toggle, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    startTransition(async () => {
      try {
        const found = await searchArticlesAction(val);
        setResults(found);
      } catch (err) {
        console.error(err);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-3 sm:pt-20 px-2.5 sm:px-4 bg-black/50 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl max-h-[88vh] bg-[#ffffff] rounded-2xl shadow-2xl border border-[#ded8cc] overflow-hidden z-10 flex flex-col animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#ece7dc] bg-[#faf8f4]">
          {isPending ? (
            <Loader2 className="w-4 h-4 text-[#842323] animate-spin shrink-0 mr-3" />
          ) : (
            <Search className="w-4 h-4 text-[#842323] shrink-0 mr-3" />
          )}
          <input
            type="text"
            autoFocus
            placeholder="বিষয়, শিরোনাম বা পরীক্ষা ট্র্যাক খুঁজুন... (যেমন: এআই, বিসিএস, অর্থনীতি)"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full text-sm bg-transparent outline-none text-[#1f2328] placeholder-[#8a929e]"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-[#737b88] hover:text-[#1f2328] hover:bg-[#ede8dc] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results / Suggestion Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-2 bg-[#fdfcf9]">
          {query.trim() === "" ? (
            <div className="py-8 text-center text-xs text-[#737b88]">
              <p>শিক্ষার্থী ও গবেষকদের সুবিধার্থে যেকোনো বিষয় বা প্রাসঙ্গিক শব্দ লিখুন।</p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="text-[11px] bg-[#ede7dc] px-2.5 py-1 rounded text-[#4b5563]">
                  কী-বোর্ড শর্টকাট: Esc বন্ধ করতে
                </span>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-[#737b88] uppercase tracking-wider mb-2">
                ফলাফল ({results.length}টি নিবন্ধ পাওয়া গেছে)
              </p>
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={`/article/${item.slug}`}
                  onClick={onClose}
                  className="flex items-start justify-between p-3 rounded-md border border-transparent hover:border-[#ded8cc] hover:bg-[#f6f2e9] transition group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-[#842323] uppercase">
                        {item.categoryName}
                      </span>
                      {item.examTags && (
                        <span className="text-[9px] text-[#6b7280] bg-[#eee9df] px-1.5 py-0.5 rounded">
                          {item.examTags.split(",")[0]}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-[#1f2328] group-hover:text-[#842323] leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#525964] line-clamp-1 mt-0.5">
                      {item.summary}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#8c94a0] group-hover:text-[#842323] shrink-0 mt-1 transition" />
                </Link>
              ))}
            </div>
          ) : !isPending ? (
            <div className="py-8 text-center text-xs text-[#737b88]">
              <p>&ldquo;{query}&rdquo; সম্পর্কিত কোনো নিবন্ধ পাওয়া যায়নি।</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
