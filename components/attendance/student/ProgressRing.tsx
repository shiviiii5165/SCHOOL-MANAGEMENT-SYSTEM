"use client";

import { useEffect, useState, useRef } from "react";

interface ProgressRingProps {
  percentage: number;
  total?: number;
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({ percentage, total, size = 180, strokeWidth = 14 }: ProgressRingProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = total === 0 ? circumference : circumference - (animatedPercent / 100) * circumference;

  const color = total === 0 ? "#94A3B8" : percentage >= 90 ? "#16A34A" : percentage >= 75 ? "#D97706" : "#DC2626";

  useEffect(() => {
    if (total === 0) return;
    const timer = setTimeout(() => setAnimatedPercent(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage, total]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-bold" style={{ color: total === 0 ? "#64748B" : color }}>
            {total === 0 ? "—" : `${Math.round(animatedPercent)}%`}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-3">
        Attendance Rate
      </span>
    </div>
  );
}
