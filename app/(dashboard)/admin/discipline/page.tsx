"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DataTable from "@/components/shared/DataTable";
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Lock, Loader2, Ban, Unlock } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/dateUtils";

interface DisciplineReport {
  id: string;
  studentName: string;
  rollNo: string;
  className: string;
  reportedBy: string;
  category: string;
  date: string;
  status: string;
  description: string;
  adminNote?: string;
  actionTaken?: string;
  priorCount?: number;
  fineStatus?: string | null;
  fineAmount?: number | null;
  fineDueDate?: string | null;
  finePaidAt?: string | null;
  feeRecordId?: string | null;
}

export default function AdminDisciplinePage() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<DisciplineReport | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [durationDays, setDurationDays] = useState(1);
  const [selectedAction, setSelectedAction] = useState<"DISMISSED" | "WARNING" | "SUSPENSION" | "FINE_ONLY" | "">("");
  const [imposeFine, setImposeFine] = useState(false);
  const [fineAmount, setFineAmount] = useState<number | "">("");
  const [fineReason, setFineReason] = useState("");
  const [fineDueDate, setFineDueDate] = useState<string>("");
  const [showToast, setShowToast] = useState<{show: boolean, type: "review" | "suspend" | "dismiss" | "warning" | "lift" | "fine", message?: string}>({show: false, type: "review"});

  // Fetch reports with auto-polling every 5 seconds
  const { data, isLoading } = useQuery({
    queryKey: ["discipline-reports"],
    queryFn: async () => {
      const res = await fetch("/api/discipline/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
    refetchInterval: 5000,
  });

  const reports: DisciplineReport[] = data?.reports || [];
  const pendingCount = reports.filter(r => r.status === "PENDING").length;

  // Review mutation (dismiss / warning / fine only)
  const reviewMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...data } = payload;
      const res = await fetch(`/api/discipline/reports/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to review report");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["discipline-reports"] });
      setSelectedReport(null);
      resetModalState();
      const type = variables.action === "DISMISSED" ? "dismiss" : variables.action === "RESOLVED_WARNING" || variables.action === "WARNING_WITH_FINE" ? "warning" : variables.action === "FINE_ONLY" ? "fine" : "review";
      setShowToast({ show: true, type, message: variables.action === "FINE_ONLY" ? "Fine Imposed Successfully" : undefined });
      setTimeout(() => setShowToast({ show: false, type: "review" }), 4000);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { id, note, durationDays, imposeFine, fineAmount, fineReason, fineDueDate } = payload;
      const from = new Date();
      const until = new Date();
      until.setDate(until.getDate() + durationDays);
      const res = await fetch(`/api/discipline/reports/${id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "SUSPENSION", 
          suspendedFrom: from.toISOString(), 
          suspendedUntil: until.toISOString(), 
          reason: note,
          imposeFine, fineAmount, fineReason, fineDueDate
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to suspend student");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discipline-reports"] });
      setSelectedReport(null);
      resetModalState();
      setShowToast({ show: true, type: "suspend" });
      setTimeout(() => setShowToast({ show: false, type: "review" }), 4000);
    },
  });

  // Lift Suspension mutation
  const liftMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/discipline/reports/${id}/lift-suspension`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to lift suspension");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discipline-reports"] });
      setSelectedReport(null);
      setShowToast({ show: true, type: "lift" });
      setTimeout(() => setShowToast({ show: false, type: "review" }), 4000);
    },
  });

  const retroactiveFineMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...data } = payload;
      const res = await fetch(`/api/discipline/reports/${id}/fine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed fine action");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discipline-reports"] });
      setSelectedReport(null);
      resetModalState();
      setShowToast({ show: true, type: "fine", message: "Fine Action Completed Successfully" });
      setTimeout(() => setShowToast({ show: false, type: "review" }), 4000);
    }
  });

  const isProcessing = reviewMutation.isPending || suspendMutation.isPending || liftMutation.isPending || retroactiveFineMutation.isPending;

  const resetModalState = () => {
    setAdminNote("");
    setDurationDays(1);
    setSelectedAction("");
    setImposeFine(false);
    setFineAmount("");
    setFineReason("");
    setFineDueDate("");
  };

  const computeSuggestedFine = (report: DisciplineReport) => {
    const priorCount = report.priorCount || 0;
    const cat = report.category.toUpperCase();
    let amt = 500;
    let rank = priorCount === 0 ? "first" : "repeat";
    
    if (cat.includes("BEHAVIOR") || cat.includes("ABUSIVE") || cat.includes("FIGHTING") || cat.includes("BULLYING")) {
      amt = priorCount === 0 ? 500 : (priorCount >= 2 ? 2000 : 1000);
      if (priorCount >= 2) rank = "severe";
    } else if (cat.includes("CHEAT") || cat.includes("ACADEMIC")) {
      amt = 1500;
    } else if (cat.includes("ATTENDANCE") || cat.includes("BUNK")) {
      amt = priorCount >= 3 ? 500 : 200;
      if (priorCount >= 3) rank = "repeated";
    } else if (cat.includes("MOBILE") || cat.includes("DEVICE")) {
      amt = priorCount === 0 ? 300 : 750;
    } else if (cat.includes("VANDALISM") || cat.includes("DAMAGE")) {
      amt = 1000;
    }

    return {
      amount: amt,
      suggestionText: `💡 Suggested: ₹${amt} for ${rank} ${cat} offense (Student has ${priorCount} prior report${priorCount!==1?'s':''} in this category)`
    };
  };

  const handleOpenModal = (item: DisciplineReport) => {
    resetModalState();
    setSelectedReport(item);
    if (item.status === "PENDING") {
      const sug = computeSuggestedFine(item);
      setFineAmount(sug.amount);
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setFineDueDate(d.toISOString().split("T")[0]);
      setFineReason(`${item.category} Fine - ${item.description.substring(0, 50)}...`);
    }
  };

  const columns = [
    {
      header: "Student",
      accessorKey: "studentName",
      cell: (item: any) => (
        <div>
          <span className="font-medium text-text-primary block">{item.studentName}</span>
          <span className="text-xs text-text-muted">{item.className} • Roll: {item.rollNo}</span>
        </div>
      )
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (item: any) => {
        const isUrgent = item.category === "Safety" || item.category === "Behavior";
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
            isUrgent ? "bg-status-danger-bg text-status-danger-text border-status-danger/20" : "bg-status-warning-bg text-status-warning-text border-status-warning/20"
          }`}>
            {isUrgent && <AlertTriangle className="w-3 h-3" />}
            {item.category}
          </span>
        );
      }
    },
    {
      header: "Reported By",
      accessorKey: "reportedBy",
      cell: (item: any) => <span className="text-sm text-text-secondary">{item.reportedBy}</span>
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (item: any) => <span className="text-sm text-text-secondary" suppressHydrationWarning>{formatDateTime(item.date)}</span>
    },
    {
      header: "Fine",
      accessorKey: "fineStatus",
      cell: (item: any) => {
        if (!item.fineStatus) return <span className="text-text-muted text-sm">—</span>;
        
        const styles: Record<string, string> = {
          PENDING: "bg-orange-100 text-orange-700",
          PAID: "bg-green-100 text-green-700",
          OVERDUE: "bg-red-100 text-red-700",
          WAIVED: "bg-gray-100 text-gray-500",
        };
        
        const text = item.fineStatus === "WAIVED" ? "WAIVED" : `₹${item.fineAmount} ${item.fineStatus}`;
        
        return (
          <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${styles[item.fineStatus] || "bg-background text-text-muted"}`}>
            {text}
          </span>
        );
      }
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item: any) => {
        const styles: Record<string, string> = {
          PENDING: "bg-status-warning-bg text-status-warning-text",
          REVIEWED: "bg-status-success-bg text-status-success-text",
          RESOLVED_WARNING: "bg-status-warning-bg text-status-warning-text",
          DISMISSED: "bg-background text-text-muted",
          SUSPENDED: "bg-status-danger text-white",
        };
        return (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${styles[item.status] || "bg-background text-text-muted"}`}>
            {item.status === "RESOLVED_WARNING" ? "WARNING" : item.status}
          </span>
        );
      }
    },
  ];

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {showToast.show && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={`border px-4 py-3 rounded-lg shadow-dropdown flex flex-col gap-1 ${
            showToast.type === "suspend" 
              ? "bg-status-danger border-status-danger-text text-white" 
              : showToast.type === "dismiss"
              ? "bg-background border-border text-text-primary"
              : showToast.type === "lift"
              ? "bg-status-success border-status-success text-white"
              : "bg-status-success-bg border-status-success text-status-success-text"
          }`}>
            <div className="flex items-center gap-3">
              {showToast.type === "suspend" ? <Lock className="w-5 h-5" /> : showToast.type === "dismiss" ? <Ban className="w-5 h-5" /> : showToast.type === "lift" ? <Unlock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              <p className="font-medium text-sm">
                {showToast.type === "suspend" ? "Student Suspended" : showToast.type === "dismiss" ? "Report Dismissed" : showToast.type === "warning" ? "Warning Issued" : showToast.type === "lift" ? "Suspension Lifted" : "Report Reviewed"}
              </p>
            </div>
            {showToast.type === "suspend" && (
              <p className="text-xs opacity-90 ml-8">Suspension chain activated. Attendance & portal access blocked.</p>
            )}
            {showToast.type === "lift" && (
              <p className="text-xs opacity-90 ml-8">Attendance and portal access have been restored.</p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Discipline Center</h1>
          <p className="text-sm text-text-secondary mt-1">Review incident reports and manage suspensions</p>
        </div>
        
        {pendingCount > 0 && (
          <div className="bg-status-danger-bg border border-status-danger/20 text-status-danger-text px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-bold">{pendingCount} Action{pendingCount !== 1 ? 's' : ''} Required</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-3 text-text-secondary">Loading reports...</span>
        </div>
      ) : (
        <DataTable
          data={reports}
          columns={columns}
          searchPlaceholder="Search by student, teacher, or category..."
          emptyStateIcon={ShieldAlert}
          emptyStateTitle="No discipline records"
          emptyStateDesc="There are no incident reports to display."
          onView={(item) => handleOpenModal(item)}
        />
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3 sm:p-6 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className={`p-6 border-b flex items-center justify-between ${
              selectedReport.status === "SUSPENDED" ? "bg-status-danger/5 border-status-danger/20" : "border-border"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedReport.status === "SUSPENDED" ? "bg-status-danger/10 text-status-danger" : "bg-status-warning-bg text-status-warning-text"
                }`}>
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-text-primary">Incident Review</h2>
                  <p className="text-sm text-text-secondary" suppressHydrationWarning>Reported on {formatDate(selectedReport.date)}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedReport(null); resetModalState(); }} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <XCircle className="w-6 h-6 text-text-muted" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              
              {/* Student Info */}
              <div className="flex items-center justify-between bg-background p-4 rounded-xl border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center font-bold text-primary text-lg border border-primary/20">
                    {selectedReport.studentName.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-base">{selectedReport.studentName}</h3>
                    <p className="text-sm text-text-secondary">{selectedReport.className} • Roll {selectedReport.rollNo}</p>
                  </div>
                </div>
                {selectedReport.status === "SUSPENDED" && (
                  <div className="bg-status-danger text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Suspended
                  </div>
                )}
              </div>

              {/* Incident Details */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Incident Details</h4>
                <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-x sm:divide-y-0 divide-border">
                    <div className="p-3">
                      <p className="text-xs text-text-muted mb-1">Category</p>
                      <p className="text-sm font-medium text-text-primary">{selectedReport.category}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-text-muted mb-1">Reported By</p>
                      <p className="text-sm font-medium text-text-primary">{selectedReport.reportedBy}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-background/50 border-t border-border">
                    <p className="text-sm text-text-primary leading-relaxed">{selectedReport.description}</p>
                  </div>
                </div>
              </div>

              {/* Previous action details */}
              {selectedReport.status !== "PENDING" && selectedReport.adminNote && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Admin Decision</h4>
                  <div className="bg-background border border-border rounded-xl p-4">
                    <p className="text-xs text-text-muted mb-1">Action: <span className="font-bold text-text-primary">{selectedReport.actionTaken}</span></p>
                    <p className="text-sm text-text-primary mt-2">{selectedReport.adminNote}</p>
                  </div>
                </div>
              )}

                  {/* Admin Action Form (only if pending) */}
              {selectedReport.status === "PENDING" && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Admin Decision</h4>
                  
                  <div className="bg-surface border border-border rounded-xl p-4 mb-6">
                    <p className="text-sm font-bold text-text-primary mb-3">Step 1 — Choose Action</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["DISMISSED", "WARNING", "SUSPENSION", "FINE_ONLY"].map((act) => (
                        <button
                          key={act}
                          onClick={() => { setSelectedAction(act as any); if (act === "FINE_ONLY") setImposeFine(true); else if (act === "DISMISSED") setImposeFine(false); }}
                          className={`p-3 rounded-lg border text-sm font-medium transition-colors ${selectedAction === act ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-text-secondary hover:border-primary/50"}`}
                        >
                          {act === "DISMISSED" ? "Dismiss" : act === "WARNING" ? "Warning" : act === "SUSPENSION" ? "Suspend" : "Fine Only"}
                          {act === "DISMISSED" && <span className="block text-xs font-normal opacity-80 mt-1">(no fine)</span>}
                        </button>
                      ))}
                    </div>

                    {selectedAction === "SUSPENSION" && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <label className="text-sm font-bold text-text-primary mb-2 block">Suspension Duration (Days)</label>
                        <input 
                          type="number" min="1" max="365"
                          value={durationDays} 
                          onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                          className="w-full sm:w-32 p-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background"
                        />
                      </div>
                    )}
                  </div>

                  <div className={`bg-surface border border-border rounded-xl p-4 mb-6 transition-opacity ${selectedAction === "DISMISSED" ? "opacity-50 pointer-events-none" : ""}`}>
                    <p className="text-sm font-bold text-text-primary mb-3">Step 2 — Impose Fine? <span className="font-normal text-text-secondary text-xs">(optional for Warning/Suspend, required for Fine Only)</span></p>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={imposeFine}
                        onChange={(e) => setImposeFine(e.target.checked)}
                        disabled={selectedAction === "FINE_ONLY"}
                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-text-primary">Add Monetary Fine</span>
                    </label>

                    {imposeFine && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4">
                        <div className="bg-status-success-bg/30 border border-status-success/20 p-3 rounded-lg text-sm text-status-success-text flex items-start gap-2">
                          <span className="text-lg leading-none">💡</span>
                          <span dangerouslySetInnerHTML={{__html: computeSuggestedFine(selectedReport).suggestionText.replace('💡 ', '')}} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-text-secondary mb-1 block">Fine Amount (₹)</label>
                            <input 
                              type="number" min="1"
                              value={fineAmount} onChange={(e) => setFineAmount(parseInt(e.target.value) || "")}
                              className="w-full p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-text-secondary mb-1 block">Due Date</label>
                            <input 
                              type="date"
                              value={fineDueDate} onChange={(e) => setFineDueDate(e.target.value)}
                              className="w-full p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-text-secondary mb-1 block">Fine Reason (appears on invoice)</label>
                          <input 
                            type="text"
                            value={fineReason} onChange={(e) => setFineReason(e.target.value)}
                            className="w-full p-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-surface border border-border rounded-xl p-4">
                    <label className="text-sm font-bold text-text-primary mb-2 block">Admin Note (Required)</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Type reason for decision..."
                      rows={3}
                      className="w-full p-3 border border-border rounded-lg text-sm focus:outline-none focus:border-primary bg-background resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions for Pending */}
            {selectedReport.status === "PENDING" && (
              <div className="p-6 border-t border-border bg-background flex items-center justify-between gap-4">
                <button
                  onClick={() => setSelectedReport(null)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 text-text-secondary font-medium hover:bg-border/50 rounded-lg transition-colors border border-border disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!selectedAction || !adminNote) return;
                    if (imposeFine && (!fineAmount || !fineReason || !fineDueDate)) return;

                    const payload = {
                      id: selectedReport.id,
                      adminNote,
                      imposeFine, fineAmount, fineReason, fineDueDate
                    };

                    if (selectedAction === "DISMISSED") {
                      reviewMutation.mutate({ ...payload, action: "DISMISSED" });
                    } else if (selectedAction === "WARNING") {
                      reviewMutation.mutate({ ...payload, action: imposeFine ? "WARNING_WITH_FINE" : "RESOLVED_WARNING" });
                    } else if (selectedAction === "FINE_ONLY") {
                      reviewMutation.mutate({ ...payload, action: "FINE_ONLY" });
                    } else if (selectedAction === "SUSPENSION") {
                      suspendMutation.mutate({ ...payload, durationDays });
                    }
                  }}
                  disabled={!selectedAction || !adminNote || isProcessing || (imposeFine && (!fineAmount || !fineReason || !fineDueDate))}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Apply Decision →
                </button>
              </div>
            )}
            
            {/* Footer Actions for ALREADY REVIEWED / SUSPENDED Reports */}
            {selectedReport.status !== "PENDING" && (
              <div className="p-6 border-t border-border bg-background flex flex-col gap-4">
                {selectedReport.fineStatus && (
                  <div className="bg-surface border border-border rounded-lg p-3 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Fine: ₹{selectedReport.fineAmount} — <span className={`font-bold ${selectedReport.fineStatus === "PENDING" ? "text-orange-600" : selectedReport.fineStatus === "PAID" ? "text-green-600" : selectedReport.fineStatus === "OVERDUE" ? "text-red-600" : "text-gray-500"}`}>{selectedReport.fineStatus}</span>
                      </p>
                      {selectedReport.fineDueDate && <p className="text-xs text-text-muted">Due {formatDate(selectedReport.fineDueDate)}</p>}
                    </div>
                    <div className="flex gap-2">
                      {selectedReport.fineStatus === "PENDING" || selectedReport.fineStatus === "OVERDUE" ? (
                        <>
                          <button
                            onClick={() => {
                              if(confirm("Waive this fine?")) retroactiveFineMutation.mutate({ id: selectedReport.id, action: "WAIVE" });
                            }}
                            disabled={isProcessing}
                            className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            Waive Fine
                          </button>
                          <button
                            onClick={() => {
                              if(confirm("Record offline cash/cheque payment for this fine?")) retroactiveFineMutation.mutate({ id: selectedReport.id, action: "MARK_PAID" });
                            }}
                            disabled={isProcessing}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                          >
                            Mark Fine Paid
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                  {!selectedReport.fineStatus && (
                    <button
                      onClick={() => {
                        const amt = prompt("Enter Fine Amount (₹):", "500");
                        if (!amt) return;
                        const reason = prompt("Enter Fine Reason:", `${selectedReport.category} Fine`);
                        if (!reason) return;
                        const d = new Date(); d.setDate(d.getDate() + 15);
                        const dueDate = prompt("Enter Due Date (YYYY-MM-DD):", d.toISOString().split('T')[0]);
                        if (!dueDate) return;
                        retroactiveFineMutation.mutate({ id: selectedReport.id, action: "ADD", fineAmount: parseInt(amt), fineReason: reason, fineDueDate: dueDate });
                      }}
                      disabled={isProcessing}
                      className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                      Add Fine Now
                    </button>
                  )}

                  {selectedReport.status === "SUSPENDED" && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to lift this suspension early?")) {
                          liftMutation.mutate(selectedReport.id);
                        }
                      }}
                      disabled={isProcessing}
                      className="flex items-center gap-2 bg-status-success hover:bg-status-success/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      {liftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                      Lift Suspension
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
