"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  onSuccess: () => void;
}

export default function DeleteConfirmModal({ isOpen, onClose, student, onSuccess }: DeleteConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !student) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/students/${student.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deactivate student");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-2 shadow-sm">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Deactivate {student.name}?</h2>
          
          <div className="text-sm text-slate-600 text-left bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
            <p><strong>This action will:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Set student status to <strong>INACTIVE</strong></li>
              <li>Revoke login access immediately</li>
              <li>Remove them from active class messaging groups</li>
              <li>Keep all historical data intact (attendance, fees, results)</li>
            </ul>
            <p className="pt-2 text-xs text-slate-500 italic">This action can be reversed later by editing the student and setting them active.</p>
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="p-4 border-t border-border bg-surface flex gap-3">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Yes, Deactivate"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
