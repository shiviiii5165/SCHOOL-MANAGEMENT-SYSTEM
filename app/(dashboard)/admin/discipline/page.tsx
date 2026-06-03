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
}

export default function AdminDisciplinePage() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<DisciplineReport | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [durationDays, setDurationDays] = useState(1);
  const [showToast, setShowToast] = useState<{show: boolean, type: "review" | "suspend" | "dismiss" | "warning" | "lift", message?: string}>({show: false, type: "review"});

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

  // Review mutation (dismiss / warning)
  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: string; note: string }) => {
      const res = await fetch(`/api/discipline/reports/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNote: note }),
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
      setAdminNote("");
      const type = variables.action === "DISMISSED" ? "dismiss" : variables.action === "RESOLVED_WARNING" ? "warning" : "review";
      setShowToast({ show: true, type });
      setTimeout(() => setShowToast({ show: false, type: "review" }), 4000);
    },
  });

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: async ({ id, note, durationDays }: { id: string; note: string; durationDays: number }) => {
      const res = await fetch(`/api/discipline/reports/${id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNote: note, durationDays }),
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
      setAdminNote("");
      setDurationDays(1);
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

  const isProcessing = reviewMutation.isPending || suspendMutation.isPending || liftMutation.isPending;

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
          onView={(item) => setSelectedReport(item)}
        />
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
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
              <button onClick={() => { setSelectedReport(null); setDurationDays(1); }} className="p-2 hover:bg-background rounded-full transition-colors">
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
                  <div className="grid grid-cols-2 divide-x divide-y divide-border">
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
                  <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">Admin Action</h4>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Enter official remarks or action taken..."
                    rows={4}
                    className="w-full p-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none bg-surface mb-4"
                  />
                  
                  {/* Suspension Inputs */}
                  <div className="bg-background border border-border rounded-xl p-4 flex flex-col gap-4">
                    <div>
                      <label className="text-sm font-bold text-text-primary mb-1 block">Suspension Duration (Days)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="365"
                        value={durationDays} 
                        onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                        className="w-full sm:w-32 p-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                      <p className="text-xs text-text-muted mt-1">If suspending, this duration will be used to automatically unblock attendance later.</p>
                    </div>
                  </div>
                  
                  {/* Suspension Warning */}
                  <div className="mt-4 bg-status-danger-bg border border-status-danger/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-sm font-bold text-status-danger-text">Suspension Action</h5>
                      <p className="text-xs text-status-danger-text/80 mt-1 leading-relaxed">
                        Issuing a suspension will automatically activate the <strong>Suspension Chain</strong>. The student will be blocked from the attendance system and their portal access will be restricted for the specified duration.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {selectedReport.status === "PENDING" && (
              <div className="p-6 border-t border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <button
                  onClick={() => {
                    reviewMutation.mutate({ id: selectedReport.id, action: "DISMISSED", note: adminNote || "Dismissed by admin." });
                  }}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-5 py-3 text-text-secondary font-medium hover:bg-border/50 rounded-lg transition-colors border border-border disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Dismiss
                </button>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (!adminNote) return;
                      reviewMutation.mutate({ id: selectedReport.id, action: "RESOLVED_WARNING", note: adminNote });
                    }}
                    disabled={!adminNote || isProcessing}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface border border-border hover:bg-background text-text-primary px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                    Issue Warning
                  </button>
                  <button
                    onClick={() => {
                      if (!adminNote || durationDays < 1) return;
                      suspendMutation.mutate({ id: selectedReport.id, note: adminNote, durationDays });
                    }}
                    disabled={!adminNote || durationDays < 1 || isProcessing}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-status-danger hover:bg-status-danger/90 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {suspendMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Issue Suspension
                        <Lock className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Footer Actions for Suspended Reports (Lifting Suspension) */}
            {selectedReport.status === "SUSPENDED" && (
              <div className="p-6 border-t border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-text-secondary">This student is currently suspended.</p>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to lift this suspension early? Attendance and portal access will be restored immediately.")) {
                      liftMutation.mutate(selectedReport.id);
                    }
                  }}
                  disabled={liftMutation.isPending}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-status-success hover:bg-status-success/90 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
                >
                  {liftMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Lift Suspension
                      <Unlock className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
