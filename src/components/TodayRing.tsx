"use client";

import { Flame, Check } from "lucide-react";

// The "Today" ring: fills up as the day's goal gets done. Gold when complete.
export default function TodayRing({
  percent,
  done,
  size = 48,
  stroke = 4,
  accent = "#842323",
  children,
}: {
  percent: number;
  done: boolean;
  size?: number;
  stroke?: number;
  accent?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, percent));
  const color = done ? "#c98a1b" : accent;
  return (
    <span className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ece7dc" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          style={{ transition: "stroke-dashoffset 700ms ease, stroke 300ms" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color }}>
        {children ?? (done ? <Check style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={3} /> : <Flame style={{ width: size * 0.42, height: size * 0.42 }} />)}
      </span>
    </span>
  );
}
