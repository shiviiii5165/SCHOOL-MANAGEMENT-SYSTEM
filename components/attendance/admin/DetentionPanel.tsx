"use client";

import { useState } from "react";
import { X, ShieldAlert, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DetentionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  studentName: string;
  classNameName: string;
  attendance: number;
}

export default function DetentionPanel({ isOpen, onClose, onConfirm, studentName, classNameName, attendance }: DetentionPanelProps) {
  const [reason, setReason] = useState(`Low attendance (${attendance}%)`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm(reason);
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-text-primary/40 backdrop-blur-sm z-50 transition-opacity" onClick={onClose} />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface shadow-modal z-50 flex flex-col border-l border-border"
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-background/50">
              <h2 className="text-xl font-display font-bold text-text-primary flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
                DETENTION ACTION
              </h2>
              <button onClick={onClose} disabled={isSubmitting} className="p-1 hover:bg-border rounded transition-colors text-text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4">
                <p className="text-sm text-text-secondary mb-1">Student:</p>
                <p className="font-semibold text-text-primary text-lg">{studentName}</p>
                <p className="text-sm text-text-muted">Class: {classNameName}</p>
                
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-[#991B1B] font-medium">Current Attendance:</span>
                  <span className="font-mono font-bold text-[#DC2626]">{attendance}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Detention Reason:</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-primary mb-3">Effects (Automated):</label>
                <div className="space-y-2">
                  {[
                    "Block exam hall ticket",
                    "Mark exam ineligible",
                    "Notify parents",
                    "Show warning on student dashboard"
                  ].map((effect, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-text-secondary">
                      <div className="w-4 h-4 rounded border border-[#16A34A] bg-[#16A34A] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {effect}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-background/50 flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "CONFIRM DETENTION"}
              </button>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold text-text-secondary bg-surface border border-border hover:bg-background rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
