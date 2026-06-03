import { useAttendanceStore } from "@/hooks/useAttendanceStore";
import { CheckCircle2, XCircle, Ban, Users } from "lucide-react";
import { useState } from "react";

interface ClassOption {
  id: string;
  name: string;
  section: string;
}

export default function AttendanceToolbar({ classes }: { classes: ClassOption[] }) {
  const { selectedClass, setFilters, presentCount, absentCount, lateCount, blockedCount, markAllPresent, attendanceMap } = useAttendanceStore();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [cls, setCls] = useState("");
  const [subject, setSubject] = useState("");

  const total = presentCount + absentCount + lateCount + blockedCount;

  const handleFilterChange = (c: string, d: string) => {
    setCls(c);
    setDate(d);
    setFilters(c, null, new Date(d));
  };

  const handleMarkAll = () => {
    if (confirm(`Mark all ${total - blockedCount} eligible students as present?`)) {
      markAllPresent();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Class</label>
          <select
            value={cls}
            onChange={(e) => handleFilterChange(e.target.value, date)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-w-[120px] bg-surface shadow-sm h-[40px]"
          >
            <option value="">Select...</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Subject (Optional)</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-w-[140px] bg-surface shadow-sm h-[40px]"
          >
            <option value="">Select...</option>
            <option value="math">Mathematics</option>
            <option value="sci">Science</option>
            <option value="eng">English</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Date</label>
          <input
            type="date"
            max={new Date().toISOString().split("T")[0]}
            value={date}
            onChange={(e) => handleFilterChange(cls, e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-surface shadow-sm h-[40px]"
          />
        </div>
        
        <div className="flex flex-col gap-1.5 self-end mt-1 lg:mt-0 lg:ml-2">
            <button
              onClick={handleMarkAll}
              disabled={!cls || Object.keys(attendanceMap).length === 0}
              className="px-4 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2 h-[40px] shadow-sm"
              title={`Mark all ${total - blockedCount} students as present?`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark All Present
            </button>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
        <div className="flex flex-col justify-center px-4 py-2.5 bg-surface rounded-xl border border-border shadow-sm min-w-[110px]">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-text-secondary">Total Students</span>
          </div>
          <span className="text-xl font-bold text-text-primary leading-none">{total}</span>
        </div>

        <div className="flex flex-col justify-center px-4 py-2.5 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] min-w-[110px]">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
            <span className="text-[11px] font-semibold text-[#16A34A]">Present</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-[#16A34A] leading-none">{presentCount}</span>
            <span className="text-[11px] font-semibold text-[#16A34A] mb-0.5">{total > 0 ? Math.round((presentCount / total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="flex flex-col justify-center px-4 py-2.5 bg-[#FEF2F2] rounded-xl border border-[#FECACA] min-w-[110px]">
          <div className="flex items-center gap-1.5 mb-1">
            <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
            <span className="text-[11px] font-semibold text-[#DC2626]">Absent</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-[#DC2626] leading-none">{absentCount}</span>
            <span className="text-[11px] font-semibold text-[#DC2626] mb-0.5">{total > 0 ? Math.round((absentCount / total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="flex flex-col justify-center px-4 py-2.5 bg-[#F8FAFC] rounded-xl border border-border shadow-sm min-w-[110px] opacity-80">
          <div className="flex items-center gap-1.5 mb-1">
            <Ban className="w-3.5 h-3.5 text-text-secondary" />
            <span className="text-[11px] font-semibold text-text-secondary">Blocked</span>
          </div>
          <span className="text-xl font-bold text-text-primary leading-none">{blockedCount}</span>
        </div>
      </div>
    </div>
  );
}
