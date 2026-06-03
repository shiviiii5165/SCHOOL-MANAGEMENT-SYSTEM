"use client";

import { useState } from "react";
import { XCircle, AlertTriangle, Lock, Loader2 as Spinner } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminReviewPanelProps {
  reportId: string;
  onSuccess?: () => void;
}

export default function AdminReviewPanel({ reportId, onSuccess }: AdminReviewPanelProps) {
  const [action, setAction] = useState<'WARNING' | 'SUSPENSION' | null>(null);
  const [warningNote, setWarningNote] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState<'1'|'3'|'7'|'custom'>('3');
  
  const today = new Date().toISOString().split('T')[0];
  const [customFrom, setCustomFrom] = useState(today);
  const [customUntil, setCustomUntil] = useState(today);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suspendedFrom = new Date(customFrom);
  const suspendedUntil = suspensionDuration === 'custom'
    ? new Date(customUntil)
    : new Date(new Date().setDate(new Date().getDate() + parseInt(suspensionDuration)));

  const formatDate = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleAction = (type: 'DISMISS' | 'WARNING' | 'SUSPENSION') => {
    if (type === 'DISMISS') {
      handleConfirmDismiss();
    } else {
      setAction(type);
    }
  };

  const handleConfirmDismiss = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/discipline/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DISMISS' })
      });
      if (res.ok && onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const payload: any = { action };
      if (action === 'WARNING') {
        payload.warningNote = warningNote;
      } else if (action === 'SUSPENSION') {
        payload.suspendedFrom = suspendedFrom.toISOString();
        payload.suspendedUntil = suspendedUntil.toISOString();
        payload.reason = reason;
      }

      const res = await fetch(`/api/admin/discipline/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok && onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {/* ADMIN ACTION SECTION */}
      <section>
        <label className="text-sm font-semibold mb-2 block">Official Remarks / Action Taken</label>
        <textarea 
          value={reason} 
          onChange={e => setReason(e.target.value)}
          placeholder="Enter official remarks..." 
          rows={3} 
          className="w-full rounded-md border border-border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
        />
      </section>

      {/* ACTION SELECTOR */}
      <section className="grid grid-cols-3 gap-3">
        {/* Dismiss */}
        <button onClick={() => handleAction('DISMISS')}
          className="flex flex-col items-center justify-center p-3 gap-1 rounded-xl border border-border bg-surface hover:bg-slate-50 transition-colors">
          <XCircle size={20} className="text-text-muted"/>
          <span className="text-sm font-semibold">Dismiss</span>
          <span className="text-xs text-text-muted">No action</span>
        </button>

        {/* Issue Warning */}
        <button onClick={() => setAction('WARNING')}
          className={cn("flex flex-col items-center justify-center p-3 gap-1 rounded-xl border-2 transition-all",
            action==='WARNING' ? "border-warning bg-warning-bg" : "border-border bg-surface hover:border-warning/50")}>
          <AlertTriangle size={20} className="text-warning"/>
          <span className="text-sm font-semibold">Issue Warning</span>
          <span className="text-xs text-text-muted">No attendance block</span>
        </button>

        {/* Issue Suspension */}
        <button onClick={() => setAction('SUSPENSION')}
          className={cn("flex flex-col items-center justify-center p-3 gap-1 rounded-xl border-2 transition-all",
            action==='SUSPENSION' ? "border-danger bg-danger-bg" : "border-border bg-surface hover:border-danger/50")}>
          <Lock size={20} className="text-danger"/>
          <span className="text-sm font-semibold">Suspend</span>
          <span className="text-xs text-text-muted">Blocks attendance</span>
        </button>
      </section>

      {/* CONDITIONAL: Warning note input */}
      {action === 'WARNING' && (
        <div className="p-4 bg-warning-bg border border-warning/20 rounded-lg">
          <label className="text-sm font-semibold mb-2 block">Warning Note (shown to student & parent)</label>
          <input 
            value={warningNote} 
            onChange={e => setWarningNote(e.target.value)}
            className="w-full rounded-md border border-warning/30 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50 bg-white" 
            placeholder="Describe the warning..."
          />
        </div>
      )}

      {/* CONDITIONAL: Suspension duration picker */}
      {action === 'SUSPENSION' && (
        <div className="p-4 bg-danger-bg border border-danger/20 rounded-lg space-y-4">
          <label className="text-sm font-semibold block">Suspension Duration</label>
          <div className="grid grid-cols-4 gap-2">
            {['1','3','7','custom'].map(d => (
              <button key={d}
                onClick={() => setSuspensionDuration(d as any)}
                className={cn("py-2 px-3 rounded-md border text-sm font-medium transition-all",
                  suspensionDuration === d
                    ? "bg-danger text-white border-danger"
                    : "bg-white border-border text-text-secondary hover:border-danger")}>
                {d === 'custom' ? 'Custom' : `${d} Day${d!=='1'?'s':''}`}
              </button>
            ))}
          </div>

          {suspensionDuration === 'custom' ? (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs font-semibold mb-1 block">From</label>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-full rounded-md border border-border p-2 text-sm bg-white"/>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Until</label>
                <input type="date" value={customUntil} onChange={e => setCustomUntil(e.target.value)} className="w-full rounded-md border border-border p-2 text-sm bg-white" min={customFrom}/>
              </div>
            </div>
          ) : (
            <div className="text-sm text-danger mt-3 bg-white rounded-md p-3 border border-danger/20">
              📅 Suspended from <strong>{formatDate(suspendedFrom)}</strong> until <strong>{formatDate(suspendedUntil)}</strong>
              <br/>
              <span className="text-text-muted text-xs">Attendance will auto-unblock on {formatDate(suspendedUntil)} at midnight.</span>
            </div>
          )}

          {/* Suspension Chain Warning */}
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
            <AlertTriangle size={16} className="text-danger flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-danger-text">
              <strong>Suspension Chain Active.</strong> Student attendance will be blocked.
              Portal access restricted. Parents notified immediately.
              Auto-unblocks on {formatDate(suspendedUntil)}.
            </p>
          </div>
        </div>
      )}

      {/* CONFIRM BUTTON */}
      {action && (
        <button
          onClick={handleConfirm}
          disabled={isLoading || (action==='WARNING' && !warningNote) || (action==='SUSPENSION' && !reason)}
          className={cn("w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50", 
            action==='SUSPENSION' ? "bg-danger hover:bg-danger/90" : "bg-warning hover:bg-warning/90")}
        >
          {isLoading ? <Spinner className="w-5 h-5 animate-spin"/> : action === 'WARNING' ? '⚠️ Confirm Warning' : '🔒 Confirm Suspension'}
        </button>
      )}
    </div>
  );
}
