"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Article } from "@/types";
import { ChevronLeft, ChevronRight, Clock, Sparkles, HelpCircle, ArrowRight } from "lucide-react";

interface HighlightCarouselProps {
  articles: Article[];
}

export default function HighlightCarousel({ articles }: HighlightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll every 5.5 seconds unless hovered/paused
  useEffect(() => {
    if (!isPaused && articles.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % articles.length);
      }, 5500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, articles.length]);

  if (!articles || articles.length === 0) return null;

  const current = articles[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  };

  return (
    <div
      className="relative bg-white border border-[#ded8cb] rounded-xl shadow-xs overflow-hidden transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex flex-col md:flex-row items-stretch">
        {/* Visual Media Half */}
        <div className="md:w-1/2 aspect-video md:aspect-auto min-h-[260px] md:min-h-[340px] relative overflow-hidden bg-[#eee9df]">
          <img
            src={current.featuredImage}
            alt={current.title}
            className="w-full h-full object-cover transition-all duration-700 brightness-[0.98]"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-[#842323] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
              {current.category.name}
            </span>
            {current.examTags && (
              <span className="bg-[#1f2733]/85 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-xs">
                {current.examTags.split(",")[0]}
              </span>
            )}
          </div>
          <div className="absolute bottom-3 left-3 bg-[#17191d]/80 text-[#faf8f4] text-xs px-2.5 py-1 rounded backdrop-blur-xs flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" />
            <span>{current.readTime} পাঠ</span>
          </div>
        </div>

        {/* Story Details Half */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between bg-[#ffffff]">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#842323]">
                ক্যাপসুল হাইলাইট #{currentIndex + 1} / {articles.length}
              </span>
              <div className="flex items-center gap-1.5">
                {articles.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => setCurrentIndex(dotIdx)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentIndex === dotIdx ? "w-6 bg-[#842323]" : "w-1.5 bg-[#ded8cb]"
                    }`}
                    aria-label={`Slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            </div>

            <Link href={`/article/${current.slug}`}>
              <h3 className="text-xl sm:text-2xl font-bold text-[#17191d] hover:text-[#842323] font-serif leading-snug transition-colors line-clamp-2">
                {current.title}
              </h3>
            </Link>

            <p className="mt-3 text-xs sm:text-sm text-[#4e5564] leading-relaxed line-clamp-3 font-sans">
              {current.summary}
            </p>

            {/* Micro Takeaways (Clean, max 2 points) */}
            {current.keyTakeaways && current.keyTakeaways.length > 0 && (
              <div className="mt-4 p-3 bg-[#faf8f4] border border-[#ece7dc] rounded-md text-xs space-y-1">
                <span className="text-xs font-bold uppercase text-[#1c1d21] block tracking-wider">
                  মূল শিক্ষণীয় পয়েন্ট:
                </span>
                <p className="text-[#3b414d] line-clamp-2 leading-relaxed">
                  • {current.keyTakeaways[0]}
                </p>
              </div>
            )}
          </div>

          {/* Action Row & Nav Controls */}
          <div className="mt-6 pt-4 border-t border-[#f2ede4] flex items-center justify-between">
            <Link
              href={`/article/${current.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#842323] hover:bg-[#6e1c1c] text-white text-xs font-semibold rounded-md transition shadow-2xs"
            >
              <span>বিস্তারিত পড়ুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Left / Right Carousel Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-full border border-[#ded8cb] bg-[#faf8f4] hover:bg-[#ede7da] text-[#404652] transition shadow-2xs"
                title="পূর্ববর্তী স্লাইড"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-full border border-[#ded8cb] bg-[#faf8f4] hover:bg-[#ede7da] text-[#404652] transition shadow-2xs"
                title="পরবর্তী স্লাইড"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

