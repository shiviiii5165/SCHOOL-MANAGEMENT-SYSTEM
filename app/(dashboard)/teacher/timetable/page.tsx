"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, AlertTriangle, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import TimetableGrid from "@/components/timetable/TimetableGrid";

export default function TeacherTimetablePage() {
  const queryClient = useQueryClient();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher-timetable"],
    queryFn: async () => {
      const res = await fetch("/api/timetable/teacher");
      if (!res.ok) throw new Error("Failed to fetch timetable");
      return res.json();
    }
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/timetable/seed", { method: "POST" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate timetable");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-timetable"] });
      setToastMessage(`Successfully added ${data.count || ''} periods to your timetable.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
  });

  // Manual seed only - automatic seed removed to prevent infinite loops on error

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-text-muted font-medium">Loading timetable...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-status-danger-bg rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-status-danger" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Failed to load timetable</h2>
        <p className="text-text-secondary text-sm">
          There was an error connecting to the server. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-status-success-bg border border-status-success text-status-success-text px-4 py-3 rounded-lg shadow-dropdown flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-medium text-sm">Timetable Generated</p>
              <p className="text-xs opacity-90">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary flex items-center gap-3">
            <div className="bg-primary-light/50 p-2 rounded-lg">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            Weekly Timetable
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage and view your weekly teaching schedule
          </p>
        </div>

        {/* Generate Dummy Data Button (Admin/Dev feature) */}
        {data?.periods?.length === 0 && !seedMutation.isPending && (
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Generate Demo Data
          </button>
        )}
      </div>

      {seedMutation.isPending && data?.periods?.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary">Generating Timetable...</h3>
          <p className="text-text-secondary text-sm mt-2">Setting up your classes, subjects, and periods</p>
        </div>
      ) : (
        <TimetableGrid periods={data?.periods || []} />
      )}
    </div>
  );
}
