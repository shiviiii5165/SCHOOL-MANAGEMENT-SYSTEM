import { useAttendanceStore } from "@/hooks/useAttendanceStore";
import { FileCheck2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubmitBarProps {
  classNameName: string;
  date: string;
  onSubmitClick: () => void;
  students?: { id: string; rollNo: string; name: string }[];
}

export default function SubmitBar({ classNameName, date, onSubmitClick, students = [] }: SubmitBarProps) {
  const { presentCount, absentCount, lateCount, blockedCount, attendanceMap } = useAttendanceStore();
  const total = presentCount + absentCount + lateCount + blockedCount;
  
  // Only show if there's actual attendance marked (initial load might be empty until filter selected)
  const isVisible = Object.keys(attendanceMap).length > 0;

  // Get absent roll numbers
  const absentRollNumbers = students
    .filter(s => attendanceMap[s.id] === 'ABSENT')
    .sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo))
    .map(s => s.rollNo)
    .join(", ");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-surface border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-30 lg:left-[240px] pb-[env(safe-area-inset-bottom)] md:pb-0"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between md:justify-between gap-4">
            {/* Left Section */}
            <div className="hidden md:flex flex-col min-w-[200px]">
              <span className="text-sm font-bold text-text-primary truncate">{classNameName}</span>
              <div className="flex items-center gap-3 text-[11px] font-semibold mt-1.5">
                <span className="text-text-secondary">{new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="text-border">|</span>
                <span className="text-[#16A34A] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#BBF7D0]">Present: {presentCount}</span>
                <span className="text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA]">Absent: {absentCount}</span>
              </div>
            </div>

            {/* Center Section: Absent Summary */}
            <div className="hidden md:flex flex-1 justify-center max-w-md">
              <div className="flex items-center gap-3 bg-[#F8FAFC] border border-border rounded-xl px-4 py-2.5 w-full">
                <span className="text-[11px] font-bold text-text-secondary uppercase whitespace-nowrap">Absent Roll Numbers (Auto)</span>
                <div className="flex-1 flex flex-wrap gap-1.5 max-h-[44px] overflow-y-auto">
                  {absentRollNumbers ? absentRollNumbers.split(', ').map((roll, idx) => (
                    <span key={idx} className="bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                      {roll}
                    </span>
                  )) : (
                    <span className="text-xs font-medium text-text-muted italic py-0.5">None</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Section */}
            <button
              onClick={onSubmitClick}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1e3a8a] text-white px-6 md:px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex-shrink-0 w-full md:w-auto md:min-w-[180px]"
            >
              Submit Attendance
              <FileCheck2 className="w-4 h-4 ml-1" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
