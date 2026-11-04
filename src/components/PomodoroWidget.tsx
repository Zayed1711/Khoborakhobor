"use client";

import { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, X, Bell, Coffee, ChevronUp, ChevronDown } from "lucide-react";

export default function PomodoroWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // Default custom duration in minutes: 15, 20, 25, 30, 45, 60 or custom
  const [customMinutes, setCustomMinutes] = useState(20);
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timer when user adjusts custom duration while timer is paused
  const handleDurationChange = (minutes: number) => {
    const validMinutes = Math.max(1, Math.min(120, minutes));
    setCustomMinutes(validMinutes);
    if (!isActive) {
      setSecondsLeft(validMinutes * 60);
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsActive(false);

            // Handle transition between focus and short break
            if (!isBreak) {
              setCompletedSessions((s) => s + 1);
              setIsBreak(true);
              return 5 * 60; // 5-minute break
            } else {
              setIsBreak(false);
              return customMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isBreak, customMinutes]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setSecondsLeft(customMinutes * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = isBreak
    ? ((5 * 60 - secondsLeft) / (5 * 60)) * 100
    : ((customMinutes * 60 - secondsLeft) / (customMinutes * 60)) * 100;

  return (
    <div id="tutorial-pomodoro-widget" className="fixed bottom-16 lg:bottom-5 right-4 sm:right-5 z-40">
      {/* Minimized Floating Pill */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border transition-all ${
            isActive
              ? "bg-[#842323] text-white border-[#842323] animate-pulse"
              : isBreak
              ? "bg-[#2d5a40] text-white border-[#2d5a40]"
              : "bg-[#ffffff] text-[#1c1d21] border-[#ded8cb] hover:bg-[#faf8f4]"
          }`}
          title="পমোডোরো স্টাডি টাইমার"
        >
          <Timer className="w-4 h-4 text-current" />
          <span className="font-mono text-xs font-bold">{formatTime(secondsLeft)}</span>
          <span className="text-xs uppercase font-semibold tracking-wider opacity-85">
            {isBreak ? "বিরতি" : "ফোকাস"}
          </span>
        </button>
      ) : (
        /* Expanded Full Widget */
        <div className="w-72 bg-[#ffffff] border border-[#ded8cb] rounded-xl shadow-xl overflow-hidden animate-fade-in text-[#1c1d21]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#faf8f4] border-b border-[#ece7dc]">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-[#842323]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1c1d21]">
                {isBreak ? "বিশ্রাম ও বিরতি" : "পমোডোরো স্টাডি টাইমার"}
              </h4>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded text-[#8e95a2] hover:text-[#1c1d21] transition"
                title="মিনিমাইজ করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 text-center">
            {/* Countdown Display */}
            <div>
              <div className="font-mono text-3xl font-black text-[#17191d] tracking-tight">
                {formatTime(secondsLeft)}
              </div>
              <p className="text-xs text-[#717887] mt-0.5">
                {isBreak
                  ? "৫ মিনিটের চোখ ও মনের বিশ্রাম নিন"
                  : `মনোযোগের সাথে পাঠ্য অনুশীলন (${customMinutes} মিনিট)`}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-[#eee9df] h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isBreak ? "bg-[#2d5a40]" : "bg-[#842323]"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
            </div>

            {/* Custom Duration Selector (Student Decides Time) */}
            {!isActive && !isBreak && (
              <div className="pt-2 border-t border-[#f2ede4]">
                <label className="block text-xs font-medium text-[#525964] mb-1.5">
                  পড়ার সময়কাল নির্ধারণ করুন (মিনিট):
                </label>
                <div className="flex items-center justify-center gap-1.5">
                  {[10, 15, 20, 25, 30, 45].map((m) => (
                    <button
                      key={m}
                      onClick={() => handleDurationChange(m)}
                      className={`text-xs font-semibold px-2 py-1 rounded transition border ${
                        customMinutes === m
                          ? "bg-[#842323] text-white border-[#842323] shadow-2xs"
                          : "bg-[#faf8f4] text-[#4b5563] border-[#ded8cb] hover:bg-[#ede7da]"
                      }`}
                    >
                      {m}মি
                    </button>
                  ))}
                </div>

                {/* Direct Fine-tuning input */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs text-[#8e95a2]">কাস্টম মিনিট:</span>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customMinutes}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                    className="w-12 text-center text-xs p-1 bg-[#faf8f4] border border-[#dcd7cb] rounded font-mono font-bold outline-none focus:border-[#842323]"
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={toggleTimer}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-md text-xs font-bold transition shadow-xs ${
                  isActive
                    ? "bg-[#454c59] hover:bg-[#343a46] text-white"
                    : "bg-[#842323] hover:bg-[#6e1c1c] text-white"
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>বিরতি দিন</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>শুরু করুন</span>
                  </>
                )}
              </button>

              <button
                onClick={resetTimer}
                className="p-2 rounded-md bg-[#faf8f4] border border-[#ded8cb] hover:bg-[#ede7da] text-[#4b5563] transition"
                title="রিসেট করুন"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Session Counter */}
            {completedSessions > 0 && (
              <p className="text-xs text-[#2d5a40] font-semibold bg-[#edf7ed] py-1 px-2 rounded border border-[#c8e6c9]">
                আজকে সম্পন্ন সেশন: {completedSessions}টি
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

