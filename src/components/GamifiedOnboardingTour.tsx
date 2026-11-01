"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, History, Globe, HelpCircle, 
  Timer, BookOpen, Award, ArrowRight, ArrowLeft, 
  X, CheckCircle2, Compass, ShieldCheck 
} from "lucide-react";

interface TourStep {
  targetId?: string;
  badge: string;
  title: string;
  description: string;
  icon: any;
  position?: "bottom" | "top" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    badge: "অভিযান শুরু",
    title: "স্বাগতম অভিযাত্রী!",
    description:
      "খবরাখবর ডিজিটাল প্ল্যাটফর্মে আপনার অ্যাকাডেমিক প্রস্তুতি শুরু হচ্ছে। বিসিএস, ব্যাংক ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার প্রস্তুতিকে সুশৃঙ্খল ও গতিশীল করতে প্রধান ফিচারগুলো এক নজরে দেখে নেওয়া যাক।",
    icon: Compass,
    position: "center",
  },
  {
    targetId: "tutorial-date-archive",
    badge: "ফিচার ১: ৭ দিনের আর্কাইভ",
    title: "সংবাদ আর্কাইভ নির্বাচন",
    description:
      "আজকের সংবাদের পাশাপাশি বিগত ৭ দিনের যেকোনো নির্দিষ্ট দিনের সংবাদ ও বিষয়ভিত্তিক সম্পাদকীয় এক ক্লিকে বাছাই করে রিভিশন দিতে পারবেন।",
    icon: History,
    position: "bottom",
  },
  {
    targetId: "tutorial-feed-language",
    badge: "ফিচার ২: দ্বিভাষিক পড়াশোনা",
    title: "বাংলা সংবাদ ও English Studies",
    description:
      "বাংলা পাঠকদের জন্য খাঁটি বাংলা সংবাদ এবং ভাষা দক্ষতা বৃদ্ধির জন্য ইংরেজি আর্টিকেলের মাঝে সহজে পরিবর্তন করুন। যেকোনো ইংরেজি আর্টিকেলে পাবেন তাৎক্ষণিক ভাবানুবাদ।",
    icon: Globe,
    position: "bottom",
  },
  {
    targetId: "tutorial-daily-quiz",
    badge: "ফিচার ৩: সক্রিয় স্মরণ",
    title: "দৈনিক কুইজ চ্যালেঞ্জ ও স্ট্রিক",
    description:
      "প্রতিদিনের সমসাময়িক ঘটনাবলি থেকে তৈরি মাইক্রো-কুইজ সমাধান করে 'ডেইলি স্টাডি স্ট্রিক' ধরে রাখুন। ধারাবাহিকতাই প্রতিযোগিতামূলক পরীক্ষার সাফল্যের মূল চাবিকাঠি।",
    icon: HelpCircle,
    position: "top",
  },
  {
    targetId: "tutorial-pomodoro-widget",
    badge: "ফিচার ৪: গভীর ফোকাস",
    title: "পমোডোরো স্টাডি টাইমার",
    description:
      "স্ক্রিনের নিচে ডানে সার্বজনীন ভাসমান টাইমার রয়েছে। ১০ থেকে ৪৫ মিনিটের গভীর মনোযোগের পাঠ সেশন এবং ৫ মিনিটের সক্রিয় বিরতি নিয়ে পড়াশোনায় ক্লান্তি দূর করুন।",
    icon: Timer,
    position: "top",
  },
  {
    targetId: "tutorial-smart-reading",
    badge: "ফিচার ৫: স্মার্ট রিডিং",
    title: "অভিধান ও স্টাডি হাব নোটবুক",
    description:
      "নিবন্ধ পড়ার সময় যেকোনো কঠিন শব্দে ডাবল-ক্লিক করলেই দেখতে পাবেন অ্যাকাডেমিক অভিধান। পরীক্ষার জন্য প্রয়োজনীয় উপাত্ত এক ক্লিকে স্টাডি হাব নোটবুকে সংরক্ষণ করতে পারবেন।",
    icon: BookOpen,
    position: "bottom",
  },
  {
    badge: "মিশন সম্পন্ন",
    title: "প্রাথমিক সংকলক পদক আনলক!",
    description:
      "অভিনন্দন! আপনি খবরাখবর প্ল্যাটফর্মের প্রতিটি ফিচারের সাথে সফলভাবে পরিচিত হয়েছেন। এখন আপনার অ্যাকাডেমিক অনুসন্ধান ও জ্ঞানার্জনের যাত্রা শুরু করুন।",
    icon: Award,
    position: "center",
  },
];

export default function GamifiedOnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Initialize and check first-time visitor
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeenTour = localStorage.getItem("khobor_onboarding_completed");
    if (!hasSeenTour) {
      // Auto launch after 800ms delay so DOM is fully settled
      const timer = setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for manual restart events (e.g. from LeftNavSidebar)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleRestart = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener("khobor_restart_tour", handleRestart);
    return () => window.removeEventListener("khobor_restart_tour", handleRestart);
  }, []);

  // Track target element bounding rect on step change
  const updateTargetPosition = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    if (step && step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
        }, 300);
        return;
      }
    }
    setTargetRect(null);
  }, [currentStep]);

  useEffect(() => {
    if (isOpen) {
      updateTargetPosition();
      window.addEventListener("resize", updateTargetPosition);
      window.addEventListener("scroll", updateTargetPosition);
      return () => {
        window.removeEventListener("resize", updateTargetPosition);
        window.removeEventListener("scroll", updateTargetPosition);
      };
    }
  }, [isOpen, currentStep, updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const completeTour = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("khobor_onboarding_completed", "true");
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isFinalStep = currentStep === TOUR_STEPS.length - 1;
  const isCenterModal = step.position === "center" || !targetRect;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 1. Translucent Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity duration-300"
        onClick={completeTour}
      />

      {/* 2. Spotlight Cutout Overlay on Target Element if active */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl ring-4 ring-[#842323] ring-offset-4 ring-offset-[#fbf9f5] transition-all duration-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] z-50"
          style={{
            top: Math.max(8, targetRect.top - 6),
            left: Math.max(8, targetRect.left - 6),
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* 3. Floating Guidance Dialogue Card */}
      <div
        className={`relative z-50 w-full max-w-md bg-white border border-[#ded8cb] rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 animate-fade-in text-[#1c1d21] ${
          isCenterModal ? "my-auto" : "mt-auto sm:my-auto"
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f4efe4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f5ebeb] text-[#842323] flex items-center justify-center border border-red-100 shadow-2xs">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#842323] uppercase tracking-wider block">
                {step.badge}
              </span>
              <h3 className="text-sm font-bold text-[#1c1d21]">
                {step.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={completeTour}
            className="p-1.5 rounded-lg text-[#8e95a2] hover:text-[#1c1d21] hover:bg-[#faf8f4] transition"
            title="টিউটোরিয়াল স্কিপ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <p className="text-xs sm:text-sm text-[#404652] leading-relaxed font-sans">
          {step.description}
        </p>

        {/* Achievement Badge Visual on Final Step */}
        {isFinalStep && (
          <div className="p-3 bg-[#fdf8ee] border border-[#f2e2be] rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#842323] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#842323] block">
                প্রাথমিক সংকলক পদক (Novice Scholar)
              </span>
              <span className="text-[10px] text-[#786b52] block">
                সফল পরিচিতি পর্ব সম্পন্ন করার জন্য আপনার প্রোফাইলে যুক্ত হলো।
              </span>
            </div>
          </div>
        )}

        {/* Bottom Navigation & Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f4efe4]">
          {/* Step Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? "w-4 bg-[#842323]"
                    : "w-1.5 bg-[#ded8cc]"
                }`}
              />
            ))}
            <span className="text-[10px] text-[#8e95a2] font-mono ml-1.5">
              {currentStep + 1}/{TOUR_STEPS.length}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && !isFinalStep && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-lg border border-[#ded8cb] bg-[#faf8f4] hover:bg-[#ede7da] text-[#404652] text-xs font-semibold transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>পূর্ববর্তী</span>
              </button>
            )}

            {!isFinalStep ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-lg bg-[#842323] hover:bg-[#6c1c1c] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <span>পরবর্তী ধাপ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={completeTour}
                className="px-5 py-2 rounded-lg bg-[#842323] hover:bg-[#6c1c1c] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <span>পড়াশোনা শুরু করুন</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

