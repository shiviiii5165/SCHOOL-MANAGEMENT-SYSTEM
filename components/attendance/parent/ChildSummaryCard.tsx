"use client";

import Image from "next/image";

interface ChildSummaryCardProps {
  name: string;
  className: string;
  rollNo: string;
  regId: string;
  avatar?: string | null;
  todayStatus?: string;
  percentage: number;
}

export default function ChildSummaryCard({ name, className, rollNo, regId, avatar, todayStatus, percentage }: ChildSummaryCardProps) {
  const getStatusBadge = () => {
    switch (todayStatus) {
      case "PRESENT": return <span className="bg-[#16A34A] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">✅ Present Today</span>;
      case "ABSENT": return <span className="bg-[#DC2626] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">❌ Absent Today</span>;
      case "LATE": return <span className="bg-[#D97706] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">🕐 Late Today</span>;
      default: return <span className="bg-[#94A3B8] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">Pending</span>;
    }
  };

  const progressColor = percentage >= 75 ? "bg-[#16A34A]" : "bg-[#DC2626]";

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-border flex items-center justify-center overflow-hidden flex-shrink-0 relative">
          {avatar ? (
            <Image src={avatar} alt={name} fill sizes="64px" className="object-cover" />
          ) : (
            <span className="text-xl font-bold text-text-secondary">{name.substring(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-text-primary mb-0.5">{name}</h2>
          <p className="text-sm text-text-secondary font-medium">{className} <span className="text-border mx-1">|</span> <span className="font-mono text-xs">Roll: {rollNo}</span></p>
          <p className="text-xs font-mono text-text-muted mt-0.5">{regId}</p>
        </div>
      </div>

      <div className="flex flex-col md:items-end gap-3 min-w-[200px]">
        <div>{getStatusBadge()}</div>
        <div className="w-full mt-1">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-text-secondary">Attendance Rate</span>
            <span className="text-text-primary">{percentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-background rounded-full overflow-hidden">
            <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
