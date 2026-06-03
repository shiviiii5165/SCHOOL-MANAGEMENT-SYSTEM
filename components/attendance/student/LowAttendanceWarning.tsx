"use client";

import { AlertTriangle } from "lucide-react";

interface LowAttendanceWarningProps {
  percentage: number;
}

export default function LowAttendanceWarning({ percentage }: LowAttendanceWarningProps) {
  if (percentage >= 75) return null;

  return (
    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex items-start gap-4 mb-6 shadow-sm relative overflow-hidden animate-pulse-border">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D97706]" />
      <div className="bg-[#FEF3C7] p-2 rounded-full mt-0.5">
        <AlertTriangle className="w-5 h-5 text-[#D97706]" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-[#92400E] mb-1">Attendance below 75%</h4>
        <p className="text-sm text-[#B45309]">
          Current: {percentage.toFixed(1)}% &mdash; Minimum required: 75%.
          <br />
          Risk of detention. Please improve your attendance immediately.
        </p>
      </div>
    </div>
  );
}
