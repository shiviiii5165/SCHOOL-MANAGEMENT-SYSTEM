import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface DetainModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: { id: string; name: string; regId: string; className: string; percentage: number };
  threshold: number;
  onConfirm: (studentId: string, reason: string) => void;
  isDetaining: boolean;
}

export default function DetainModal({ isOpen, onClose, student, threshold, onConfirm, isDetaining }: DetainModalProps) {
  const [reason, setReason] = useState(`Low attendance - ${student.percentage.toFixed(1)}%`);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between bg-status-danger-bg/30">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            ⚠️ Detain Student
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <span className="text-text-secondary">Student:</span>
            <span className="col-span-2 font-medium text-text-primary">{student.name} ({student.regId})</span>
            
            <span className="text-text-secondary">Class:</span>
            <span className="col-span-2 font-medium text-text-primary">{student.className}</span>
            
            <span className="text-text-secondary">Attendance:</span>
            <span className="col-span-2 font-bold text-status-danger-text">{student.percentage.toFixed(1)}% <span className="text-text-muted font-normal text-xs ml-1">(Required: {threshold}%)</span></span>
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-text-primary mb-1">Detention Reason:</label>
            <input 
              type="text" 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="bg-background rounded-lg p-4 text-sm space-y-2 border border-border">
            <p className="font-medium text-text-primary mb-3">This will:</p>
            <div className="flex items-center gap-2 text-text-secondary">
              <div className="w-4 h-4 rounded bg-primary flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>
              Flag student as exam-ineligible
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <div className="w-4 h-4 rounded bg-primary flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>
              Notify parent via in-app notification
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <div className="w-4 h-4 rounded bg-primary flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>
              Show warning on student's dashboard
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <div className="w-4 h-4 rounded bg-primary flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>
              Block exam hall ticket generation
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-end gap-3 bg-background">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(student.id, reason)}
            disabled={isDetaining}
            className="flex items-center gap-2 px-4 py-2 bg-status-danger hover:bg-status-danger/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isDetaining ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm Detention
          </button>
        </div>
      </div>
    </div>
  );
}
