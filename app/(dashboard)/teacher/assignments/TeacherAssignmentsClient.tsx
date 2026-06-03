"use client";

import { useState, useEffect } from "react";
import {
  FileText, Plus, Calendar, Clock, Users, CheckCircle2,
  AlertCircle, MoreVertical, Eye, Edit, Trash2, X,
  BookOpen, Upload, Filter, ChevronDown
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  maxMarks: number;
  totalStudents: number;
  submitted: number;
  graded: number;
  status: "ACTIVE" | "CLOSED" | "DRAFT";
  createdAt: string;
}

const statusConfig: Record<string, { label: string, bg: string, text: string, dot: string }> = {
  ACTIVE: { label: "Active", bg: "bg-status-success-bg", text: "text-status-success-text", dot: "bg-status-success" },
  CLOSED: { label: "Closed", bg: "bg-[#F1F5F9]", text: "text-text-muted", dot: "bg-text-muted" },
  DRAFT: { label: "Draft", bg: "bg-status-warning-bg", text: "text-status-warning-text", dot: "bg-status-warning" },
};

interface TeacherAssignmentsClientProps {
  initialAssignments: Assignment[];
}

export default function TeacherAssignmentsClient({ initialAssignments }: TeacherAssignmentsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [assignments] = useState<Assignment[]>(initialAssignments);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = filterStatus === "ALL"
    ? assignments
    : assignments.filter(a => a.status === filterStatus);

  const activeCount = assignments.filter(a => a.status === "ACTIVE").length;
  const closedCount = assignments.filter(a => a.status === "CLOSED").length;
  const draftCount = assignments.filter(a => a.status === "DRAFT").length;

  const getDaysRemaining = (dueDate: string) => {
    if (!mounted) return 0;
    const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Assignments</h1>
          <p className="text-sm text-text-secondary mt-1">Create, track, and grade student assignments</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 border border-border bg-surface hover:bg-background text-text-primary px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              <Filter className="w-4 h-4" />
              {filterStatus === "ALL" ? "All" : filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-surface border border-border rounded-lg shadow-dropdown z-20 py-1">
                  {["ALL", "ACTIVE", "CLOSED", "DRAFT"].map(s => (
                    <button
                      key={s}
                      onClick={() => { setFilterStatus(s); setShowFilterDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors ${filterStatus === s ? "text-primary font-medium bg-primary-light" : "text-text-primary"}`}
                    >
                      {s === "ALL" ? "All Assignments" : s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Assignment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 shadow-card">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{assignments.length}</p>
        </div>
        <div className="bg-status-success-bg border border-status-success/20 rounded-xl p-4">
          <p className="text-xs text-status-success-text font-medium uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-status-success-text mt-1">{activeCount}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 shadow-card">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Closed</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{closedCount}</p>
        </div>
        <div className="bg-status-warning-bg border border-status-warning/20 rounded-xl p-4">
          <p className="text-xs text-status-warning-text font-medium uppercase tracking-wider">Drafts</p>
          <p className="text-2xl font-bold text-status-warning-text mt-1">{draftCount}</p>
        </div>
      </div>

      {/* Assignment Cards */}
      <div className="space-y-4">
        {filtered.map((assignment) => {
          const days = getDaysRemaining(assignment.dueDate);
          const sc = statusConfig[assignment.status];
          const submissionPercent = Math.round((assignment.submitted / assignment.totalStudents) * 100);

          return (
            <div
              key={assignment.id}
              className="bg-surface border border-border rounded-xl shadow-card hover:shadow-dropdown transition-all group"
            >
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Assignment Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                      <span className="text-xs text-text-muted bg-background px-2 py-0.5 rounded font-medium">
                        {assignment.subject}
                      </span>
                      <span className="text-xs text-text-muted">
                        {assignment.className}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                      {assignment.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-secondary">
                      <span className="flex items-center gap-1.5" suppressHydrationWarning>
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        Due: {mounted ? formatDate(assignment.dueDate) : ""}
                      </span>
                      {assignment.status === "ACTIVE" && (
                        <span className={`flex items-center gap-1.5 font-medium ${
                          days <= 0 ? "text-status-danger-text" : days <= 3 ? "text-status-warning-text" : "text-status-success-text"
                        }`} suppressHydrationWarning>
                          <Clock className="w-3.5 h-3.5" />
                          {mounted ? (days <= 0 ? "Overdue" : `${days} day${days !== 1 ? "s" : ""} left`) : ""}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-text-muted" />
                        Max: {assignment.maxMarks} marks
                      </span>
                    </div>
                  </div>

                  {/* Right: Submission Stats + Actions */}
                  <div className="flex items-center gap-6">
                    {/* Submission Progress */}
                    <div className="flex items-center gap-5">
                      <div className="text-center">
                        <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Submitted</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-text-primary">{assignment.submitted}</span>
                          <span className="text-xs text-text-muted">/ {assignment.totalStudents}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Graded</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-primary">{assignment.graded}</span>
                          <span className="text-xs text-text-muted">/ {assignment.submitted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-md transition-colors" title="View Submissions">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-text-muted hover:text-role-teacher hover:bg-role-teacher/10 rounded-md transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-text-muted hover:text-status-danger-text hover:bg-status-danger-bg rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submission Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-primary-dark"
                      style={{ width: `${submissionPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1.5">{submissionPercent}% submissions received</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">No assignments found</h3>
          <p className="text-sm text-text-secondary">
            {filterStatus !== "ALL" ? "Try changing the filter." : "Create your first assignment to get started."}
          </p>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-display font-bold text-text-primary">New Assignment</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-background rounded transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Title</label>
                <input
                  type="text"
                  placeholder="e.g., Chapter 5 Practice Problems"
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Subject + Class Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Subject</label>
                  <select className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-surface focus:outline-none focus:border-primary">
                    <option>Mathematics</option>
                    <option>English</option>
                    <option>Chemistry</option>
                    <option>Computer Science</option>
                    <option>History</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Class</label>
                  <select className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-surface focus:outline-none focus:border-primary">
                    <option>Class 10 - A</option>
                    <option>Class 10 - B</option>
                    <option>Class 9 - C</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the assignment requirements..."
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              {/* Due Date + Max Marks */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Due Date</label>
                  <input
                    type="date"
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Max Marks</label>
                  <input
                    type="number"
                    placeholder="50"
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Attachment (Optional)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary-light/30 transition-colors cursor-pointer group">
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-sm text-text-secondary">Click to upload or drag and drop</p>
                  <p className="text-xs text-text-muted mt-1">PDF, DOCX, PNG up to 10MB</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2.5 bg-status-warning hover:bg-status-warning/90 text-white rounded-md text-sm font-medium transition-colors">
                Save as Draft
              </button>
              <button className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium transition-colors shadow-sm">
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
