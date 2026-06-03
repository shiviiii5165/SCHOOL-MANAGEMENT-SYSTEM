"use client";

interface OverviewCardProps {
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
}

function OverviewCard({ label, value, color = "#0F172A", bgColor = "#F8FAFC" }: OverviewCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center shadow-card hover:shadow-dropdown transition-shadow">
      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-mono font-bold" style={{ color }}>{value}</p>
    </div>
  );
}

interface AttendanceOverviewCardsProps {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export default function AttendanceOverviewCards({ total, present, absent, percentage }: AttendanceOverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <OverviewCard label="Total Days" value={total} />
      <OverviewCard label="Present" value={present} color="#16A34A" />
      <OverviewCard label="Absent" value={absent} color="#DC2626" />
      <OverviewCard 
        label="Rate" 
        value={total === 0 ? "No Data" : `${percentage.toFixed(1)}%`} 
        color={total === 0 ? "#94A3B8" : percentage >= 75 ? "#16A34A" : "#DC2626"} 
      />
    </div>
  );
}
