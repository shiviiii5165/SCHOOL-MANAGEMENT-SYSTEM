import React, { useState } from "react";
import { useAttendanceStore } from "@/hooks/useAttendanceStore";
import { X, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (headCount: number) => Promise<void>;
  classNameName: string;
  date: string;
  students: { id: string; rollNo: string; name: string }[];
}

export default function VerificationModal({ isOpen, onClose, onConfirm, classNameName, date, students }: VerificationModalProps) {
  const { presentCount, absentCount, lateCount, blockedCount, attendanceMap } = useAttendanceStore();
  const [headCountStr, setHeadCountStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = presentCount + absentCount + lateCount + blockedCount;
  const expectedHeadCount = presentCount + lateCount;
  
  const headCount = parseInt(headCountStr, 10);
  const isMismatch = !isNaN(headCount) && headCount !== expectedHeadCount;
  const isMatch = !isNaN(headCount) && headCount === expectedHeadCount;

  // Get absent roll numbers
  const absentRollNumbers = students
    .filter(s => attendanceMap[s.id] === 'ABSENT')
    .sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo))
    .map(s => s.rollNo)
    .join(", ");

  const handleConfirm = async () => {
    if (isMismatch || isNaN(headCount)) return;
    setIsSubmitting(true);
    await onConfirm(headCount);
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-surface w-full max-w-lg rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col max-h-[90dvh]"
          >
            <div className="flex items-center justify-between p-5 border-b border-border bg-background/50 shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-status-success-text" />
                <h2 className="text-lg font-display font-bold text-text-primary">Attendance Summary</h2>
              </div>
              <button onClick={onClose} disabled={isSubmitting} className="p-1 hover:bg-border rounded transition-colors text-text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm font-medium text-text-secondary bg-background p-3 rounded-lg border border-border">
                <span>Class: <strong className="text-text-primary">{classNameName}</strong></span>
                <span>Date: <strong className="text-text-primary">{new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="border border-border rounded-xl p-3 text-center bg-background">
                  <p className="text-xs text-text-secondary font-semibold uppercase tracking-wide mb-1">Total</p>
                  <p className="text-2xl font-bold text-text-primary">{total}</p>
                </div>
                <div className="border border-[#BBF7D0] rounded-xl p-3 text-center bg-[#F0FDF4]">
                  <p className="text-xs text-[#16A34A] font-semibold uppercase tracking-wide mb-1">Present</p>
                  <p className="text-2xl font-bold text-[#16A34A]">{presentCount}</p>
                </div>
                <div className="border border-[#FECACA] rounded-xl p-3 text-center bg-[#FEF2F2]">
                  <p className="text-xs text-[#DC2626] font-semibold uppercase tracking-wide mb-1">Absent</p>
                  <p className="text-2xl font-bold text-[#DC2626]">{absentCount}</p>
                </div>
              </div>

              <div className="flex justify-center gap-6 text-sm font-medium">
                <span className="text-[#D97706]">Late: {lateCount}</span>
                <span className="text-[#64748B]">Blocked: {blockedCount}</span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Absent Roll Numbers:</label>
                <div className="bg-background border border-border rounded-lg p-3 min-h-[44px] flex items-center">
                  <span className="font-mono text-sm text-[#DC2626] break-words">
                    {absentRollNumbers || "None"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Final Head Count (manual entry):</label>
                <input
                  type="number"
                  placeholder="Enter total students physically present..."
                  value={headCountStr}
                  onChange={(e) => setHeadCountStr(e.target.value)}
                  className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors font-mono ${
                    isMismatch 
                      ? "border-[#EF4444] bg-[#FEF2F2] focus:ring-1 focus:ring-[#EF4444]" 
                      : isMatch
                      ? "border-[#16A34A] bg-[#F0FDF4] focus:ring-1 focus:ring-[#16A34A]"
                      : "border-border focus:border-primary focus:ring-1 focus:ring-primary"
                  }`}
                />
              </div>

              <AnimatePresence>
                {isMismatch && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2 text-[#EF4444] bg-[#FEF2F2] p-3 rounded-lg border border-[#FECACA]"
                  >
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">Head count doesn't match ({expectedHeadCount} expected). Please recheck.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 sm:p-5 border-t border-border bg-background/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0 pb-[env(safe-area-inset-bottom,20px)]">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-border rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isMatch || isSubmitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "FINAL SUBMIT ✓"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
