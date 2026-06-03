"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AttendanceRecord {
  date: string;
  status: string;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AttendanceCalendar({ records }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const recordMap = useMemo(() => {
    const map: Record<string, string> = {};
    records.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      map[key] = r.status;
    });
    return map;
  }, [records]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => {
    const nextDate = new Date(year, month + 1, 1);
    if (nextDate <= today) setCurrentDate(nextDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-[#16A34A]";
      case "ABSENT": return "bg-[#DC2626]";
      case "LATE": return "bg-[#D97706]";
      case "BLOCKED": return "bg-[#94A3B8]";
      default: return "bg-[#E2E8F0]";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PRESENT": return "Present";
      case "ABSENT": return "Absent";
      case "LATE": return "Late";
      case "BLOCKED": return "Blocked";
      default: return "";
    }
  };

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="h-10" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const cellDate = new Date(year, month, day);
    const isFuture = cellDate > today;
    const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
    const status = recordMap[dateKey];

    cells.push(
      <div
        key={day}
        className={`h-10 flex flex-col items-center justify-center rounded-lg relative group cursor-default ${
          isFuture ? "opacity-30" : ""
        }`}
      >
        <span className={`text-xs font-medium ${status ? "text-text-primary" : "text-text-muted"}`}>{day}</span>
        {status && !isFuture && (
          <div className={`w-2 h-2 rounded-full mt-0.5 ${getStatusColor(status)}`} />
        )}
        {isWeekend && !status && !isFuture && (
          <div className="w-2 h-2 rounded-full mt-0.5 bg-[#E2E8F0]" />
        )}
        {/* Tooltip */}
        {status && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-primary text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
            {dateKey} — {getStatusLabel(status)}
          </div>
        )}
      </div>
    );
  }

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 hover:bg-background rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <h3 className="text-sm font-display font-semibold text-text-primary">{monthName}</h3>
        <button onClick={nextMonth} className="p-1.5 hover:bg-background rounded-lg transition-colors" disabled={new Date(year, month + 1, 1) > today}>
          <ChevronRight className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-text-muted uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" /><span className="text-[10px] text-text-muted">Present</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" /><span className="text-[10px] text-text-muted">Absent</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#D97706]" /><span className="text-[10px] text-text-muted">Late</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#E2E8F0]" /><span className="text-[10px] text-text-muted">Holiday</span></div>
      </div>
    </div>
  );
}
