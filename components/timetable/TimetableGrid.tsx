"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, Users } from "lucide-react";

interface Period {
  id: string;
  dayOfWeek: number; // 1-6 (Mon-Sat)
  periodNumber: number; // 1-7
  startTime: string;
  endTime: string;
  roomNumber: string;
  className: string;
  subjectName: string;
  subjectCode: string;
}

interface TimetableGridProps {
  periods: Period[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIOD_TIMES = [
  { num: 1, start: "08:00", end: "08:45" },
  { num: 2, start: "08:45", end: "09:30" },
  { num: "BREAK", start: "09:30", end: "09:45" },
  { num: 3, start: "09:45", end: "10:30" },
  { num: 4, start: "10:30", end: "11:15" },
  { num: "LUNCH", start: "11:15", end: "11:45" },
  { num: 5, start: "11:45", end: "12:30" },
  { num: 6, start: "12:30", end: "13:15" },
  { num: 7, start: "13:15", end: "14:00" },
];

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-100 border-blue-300 text-blue-800",
  Physics: "bg-purple-100 border-purple-300 text-purple-800",
  Chemistry: "bg-green-100 border-green-300 text-green-800",
  Biology: "bg-emerald-100 border-emerald-300 text-emerald-800",
  English: "bg-amber-100 border-amber-300 text-amber-800",
  History: "bg-orange-100 border-orange-300 text-orange-800",
  Geography: "bg-teal-100 border-teal-300 text-teal-800",
  Computer: "bg-slate-100 border-slate-300 text-slate-800",
};

export default function TimetableGrid({ periods }: TimetableGridProps) {
  const [currentDay, setCurrentDay] = useState(1);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let day = now.getDay(); // 0 is Sunday, 1 is Monday
      if (day === 0) day = 1; // Default Sunday to Monday for display purposes
      setCurrentDay(day);
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const getSubjectColor = (subject: string) => {
    return SUBJECT_COLORS[subject] || "bg-gray-100 border-gray-300 text-gray-800";
  };

  const isCurrentPeriod = (dayIdx: number, start: string, end: string) => {
    if (dayIdx !== currentDay) return false;
    return currentTime >= start && currentTime < end;
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-sm custom-scrollbar">
      <div className="min-w-[900px]">
        {/* Header Row */}
        <div className="grid grid-cols-[100px_repeat(6,_1fr)] bg-background border-b border-border">
          <div className="p-4 font-semibold text-text-secondary text-sm flex items-center justify-center border-r border-border">
            Time
          </div>
          {DAYS.map((day, i) => (
            <div 
              key={day} 
              className={`p-4 text-center font-semibold text-sm ${
                currentDay === i + 1 ? "text-primary bg-primary-light/20" : "text-text-secondary"
              } ${i < 5 ? "border-r border-border" : ""}`}
            >
              {day}
              {currentDay === i + 1 && (
                <div className="text-[10px] uppercase text-primary mt-1 font-bold">Today</div>
              )}
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="divide-y divide-border">
          {PERIOD_TIMES.map((timeSlot, rowIdx) => {
            const isBreak = timeSlot.num === "BREAK" || timeSlot.num === "LUNCH";
            
            return (
              <div key={rowIdx} className="grid grid-cols-[100px_repeat(6,_1fr)] hover:bg-background/50 transition-colors">
                {/* Time Column */}
                <div className="p-3 border-r border-border flex flex-col items-center justify-center bg-background/30 text-center">
                  <span className="text-xs font-semibold text-text-primary">
                    {typeof timeSlot.num === "number" ? `Period ${timeSlot.num}` : timeSlot.num}
                  </span>
                  <span className="text-[10px] text-text-muted mt-1">
                    {timeSlot.start} - {timeSlot.end}
                  </span>
                </div>

                {/* Day Columns */}
                {isBreak ? (
                  <div className="col-span-6 bg-background/50 p-3 flex items-center justify-center">
                    <span className="text-sm font-semibold tracking-widest text-text-muted uppercase">
                      {timeSlot.num === "BREAK" ? "Short Break" : "Lunch Break"}
                    </span>
                  </div>
                ) : (
                  DAYS.map((_, dayIdx) => {
                    const dayNumber = dayIdx + 1;
                    const period = periods.find(p => p.dayOfWeek === dayNumber && p.periodNumber === timeSlot.num);
                    const active = isCurrentPeriod(dayNumber, timeSlot.start, timeSlot.end);

                    return (
                      <div 
                        key={dayIdx} 
                        className={`p-2 ${dayIdx < 5 ? "border-r border-border" : ""} relative`}
                      >
                        {period ? (
                          <div className={`h-full rounded-lg border p-3 flex flex-col justify-between transition-all hover:scale-[1.02] hover:shadow-md cursor-default ${getSubjectColor(period.subjectName)} ${active ? "ring-2 ring-primary ring-offset-2 animate-pulse" : ""}`}>
                            {active && (
                              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-status-success animate-ping" />
                            )}
                            <div>
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm leading-tight">{period.subjectName}</span>
                                <span className="text-[10px] font-semibold bg-white/50 px-1.5 py-0.5 rounded text-current">{period.subjectCode}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-2 opacity-80">
                                <Users className="w-3 h-3" />
                                <span className="text-xs font-medium">{period.className}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-current/20 opacity-80">
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs font-medium">{period.roomNumber}</span>
                            </div>
                          </div>
                        ) : (
                          <div className={`h-full rounded-lg border border-dashed border-border flex items-center justify-center p-3 text-text-muted/50 ${active ? "bg-background/80" : ""}`}>
                            <span className="text-xs font-medium uppercase tracking-wider">Free Period</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
