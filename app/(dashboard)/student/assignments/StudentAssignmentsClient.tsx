"use client";

import { useState } from "react";
import {
  FileText, Calendar, Clock, BookOpen, Upload,
  CheckCircle2, AlertCircle, X, Download, Eye
} from "lucide-react";

export interface StudentAssignment {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  dueDate: string;
  maxMarks: number;
  description: string;
  fileUrl?: string;
  submission?: {
    submittedAt: string;
    fileUrl?: string;
    marks?: number;
    feedback?: string;
    gradedAt?: string;
  };
}

type Tab = "all" | "pending" | "submitted" | "graded";

interface StudentAssignmentsClientProps {
  initialAssignments: StudentAssignment[];
}

export default function StudentAssignmentsClient({ initialAssignments }: StudentAssignmentsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [showSubmitModal, setShowSubmitModal] = useState<string | null>(null);

  const assignments = initialAssignments; // Just alias for the rest of the code

  const getStatus = (a: StudentAssignment): "graded" | "submitted" | "pending" | "overdue" => {
    if (a.submission?.marks !== undefined) return "graded";
    if (a.submission) return "submitted";
    const days = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return "overdue";
    return "pending";
  };

  const filtered = activeTab === "all"
    ? assignments
    : assignments.filter(a => {
      const s = getStatus(a);
      if (activeTab === "pending") return s === "pending" || s === "overdue";
      return s === activeTab;
    });

  const pendingCount = assignments.filter(a => getStatus(a) === "pending" || getStatus(a) === "overdue").length;
  const submittedCount = assignments.filter(a => getStatus(a) === "submitted").length;
  const gradedCount = assignments.filter(a => getStatus(a) === "graded").length;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: assignments.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "submitted", label: "Submitted", count: submittedCount },
    { key: "graded", label: "Graded", count: gradedCount },
  ];

  const statusStyles = {
    graded: { label: "Graded", bg: "bg-primary-light", text: "text-primary", icon: CheckCircle2 },
    submitted: { label: "Submitted", bg: "bg-status-info-bg", text: "text-status-info-text", icon: CheckCircle2 },
    pending: { label: "Pending", bg: "bg-status-warning-bg", text: "text-status-warning-text", icon: Clock },
    overdue: { label: "Overdue", bg: "bg-status-danger-bg", text: "text-status-danger-text", icon: AlertCircle },
  };

  const selectedAssignment = assignments.find(a => a.id === showSubmitModal);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">My Assignments</h1>
        <p className="text-sm text-text-secondary mt-1">View assignments, submit work, and check your grades</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1.5 shadow-card overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary hover:bg-background"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.key
                ? "bg-white/20"
                : "bg-background"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {filtered.map((assignment) => {
          const status = getStatus(assignment);
          const st = statusStyles[status];
          const days = Math.ceil((new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const StatusIcon = st.icon;

          return (
            <div
              key={assignment.id}
              className="bg-surface border border-border rounded-xl shadow-card hover:shadow-dropdown transition-all"
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {st.label}
                      </span>
                      <span className="text-xs text-text-muted bg-background px-2 py-0.5 rounded font-medium">
                        {assignment.subject}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-text-primary">
                      {assignment.title}
                    </h3>

                    <p className="text-sm text-text-secondary mt-1.5 line-clamp-2">{assignment.description}</p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-text-muted" />
                        {assignment.teacher}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      {status === "pending" && days > 0 && (
                        <span className={`flex items-center gap-1.5 font-medium ${
                          days <= 2 ? "text-status-danger-text" : days <= 5 ? "text-status-warning-text" : "text-status-success-text"
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {days} day{days !== 1 ? "s" : ""} left
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-text-muted" />
                        {assignment.maxMarks} marks
                      </span>
                    </div>
                  </div>

                  {/* Right: Grades / Submit Button */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    {status === "graded" && assignment.submission?.marks !== undefined && (
                      <div className="text-center bg-primary-light rounded-xl p-4 min-w-[100px]">
                        <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1">Score</p>
                        <p className="text-2xl font-bold text-primary">
                          {assignment.submission.marks}
                          <span className="text-sm font-normal text-primary/60">/{assignment.maxMarks}</span>
                        </p>
                        <p className="text-xs text-primary/70 mt-1">
                          {Math.round((assignment.submission.marks / assignment.maxMarks) * 100)}%
                        </p>
                      </div>
                    )}
                    {status === "pending" && (
                      <button
                        onClick={() => setShowSubmitModal(assignment.id)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Submit
                      </button>
                    )}
                    {status === "overdue" && (
                      <button
                        onClick={() => setShowSubmitModal(assignment.id)}
                        className="flex items-center gap-2 bg-status-danger hover:bg-status-danger/90 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Submit Late
                      </button>
                    )}
                    {status === "submitted" && (
                      <div className="text-center bg-status-info-bg rounded-xl p-4 min-w-[100px]">
                        <CheckCircle2 className="w-6 h-6 text-status-info-text mx-auto mb-1" />
                        <p className="text-xs text-status-info-text font-medium">Awaiting Grade</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Graded Feedback */}
                {status === "graded" && assignment.submission?.feedback && (
                  <div className="mt-4 bg-primary-light/50 border border-primary/10 rounded-lg p-4">
                    <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Teacher Feedback</p>
                    <p className="text-sm text-text-primary">{assignment.submission.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No assignments</h3>
          <p className="text-sm text-text-secondary">No assignments match the current filter.</p>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-modal w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-display font-bold text-text-primary">Submit Assignment</h2>
              <button onClick={() => setShowSubmitModal(null)} className="p-1 hover:bg-background rounded transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-background rounded-lg p-4">
                <h3 className="font-medium text-text-primary text-sm">{selectedAssignment.title}</h3>
                <p className="text-xs text-text-muted mt-1">{selectedAssignment.subject} • {selectedAssignment.maxMarks} marks</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Upload your work</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 hover:bg-primary-light/30 transition-colors cursor-pointer group">
                  <Upload className="w-10 h-10 text-text-muted mx-auto mb-3 group-hover:text-primary transition-colors" />
                  <p className="text-sm font-medium text-text-primary">Click to upload or drag and drop</p>
                  <p className="text-xs text-text-muted mt-1">PDF, DOCX, PNG, PY up to 10MB</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any note for your teacher..."
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowSubmitModal(null)}
                className="px-4 py-2.5 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium transition-colors shadow-sm">
                Submit Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
