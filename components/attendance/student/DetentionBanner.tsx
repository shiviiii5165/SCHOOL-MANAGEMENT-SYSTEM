"use client";

import { Ban } from "lucide-react";

interface DetentionBannerProps {
  isDetained: boolean;
  percentage: number;
  reason?: string;
}

export default function DetentionBanner({ isDetained, percentage, reason }: DetentionBannerProps) {
  if (!isDetained) return null;

  return (
    <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-5 flex items-start gap-4 mb-6 shadow-sm relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#DC2626]" />
      <div className="bg-[#FEE2E2] p-2.5 rounded-full mt-0.5">
        <Ban className="w-6 h-6 text-[#DC2626]" />
      </div>
      <div>
        <h4 className="text-base font-bold text-[#991B1B] mb-1">You are currently DETAINED</h4>
        <p className="text-sm text-[#B91C1C] leading-relaxed">
          You may not be eligible for upcoming exams.
          <br />
          <strong>Reason:</strong> {reason || `Low attendance (${percentage.toFixed(1)}%)`}
          <br />
          Please contact your class teacher or the administration office immediately.
        </p>
      </div>
    </div>
  );
}
