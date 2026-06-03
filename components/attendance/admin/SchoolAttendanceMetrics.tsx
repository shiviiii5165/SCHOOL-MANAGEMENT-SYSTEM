"use client";

import { Users, FileCheck2, AlertTriangle, Ban } from "lucide-react";

interface MetricsProps {
  schoolAvg: number;
  markedClasses: number;
  totalClasses: number;
  riskCount: number;
  detainedCount: number;
}

export default function SchoolAttendanceMetrics({ schoolAvg, markedClasses, totalClasses, riskCount, detainedCount }: MetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#F0FDF4] flex items-center justify-center">
            <Users className="w-6 h-6 text-[#16A34A]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">School Avg</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{schoolAvg}%</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center">
            <FileCheck2 className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Today Marked</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">
              {markedClasses} <span className="text-base text-text-muted font-medium">/ {totalClasses}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFFBEB] flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#D97706]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Risk (&lt;75%)</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{riskCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center">
            <Ban className="w-6 h-6 text-[#DC2626]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Detained</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{detainedCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
