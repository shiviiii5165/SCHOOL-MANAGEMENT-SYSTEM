"use client";

import { useState } from "react";
import {
  FileText, Calendar, Clock, BookOpen, User,
  CheckCircle2, AlertCircle, TrendingUp, Trophy, GraduationCap, XCircle
} from "lucide-react";

export interface ParentAssignment {
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

export interface ParentAssignmentData {
  childId: string;
  childName: string;
  className: string;
  assignments: ParentAssignment[];
}

type Tab = "all" | "pending" | "submitted" | "graded";

interface ParentAssignmentsClientProps {
  initialData: ParentAssignmentData[];
}

export default function ParentAssignmentsClient({ initialData }: ParentAssignmentsClientProps) {
  const [activeChildId, setActiveChildId] = useState<string>(initialData[0]?.childId || "");
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const activeChild = initialData.find(c => c.childId === activeChildId);
  const assignments = activeChild?.assignments || [];

  const getStatus = (a: ParentAssignment): "graded" | "submitted" | "pending" | "overdue" => {
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
    graded: { label: "Graded", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-700", icon: CheckCircle2 },
    submitted: { label: "Submitted", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-700", icon: CheckCircle2 },
    pending: { label: "Pending", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-700", icon: Clock },
    overdue: { label: "Overdue", bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-700", icon: AlertCircle },
  };

  // Stats calculation
  const totalGraded = assignments.filter(a => getStatus(a) === "graded");
  const averagePercentage = totalGraded.length > 0 
    ? totalGraded.reduce((acc, curr) => acc + ((curr.submission?.marks || 0) / curr.maxMarks) * 100, 0) / totalGraded.length
    : 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Child Selection */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Assignments Overview
          </h1>
          <p className="text-sm text-text-secondary mt-2">Track homework, projects, and grades for your children.</p>
        </div>
        
        {initialData.length > 1 && (
          <div className="flex bg-surface border border-border p-1.5 rounded-xl shadow-sm overflow-x-auto hide-scrollbar">
            {initialData.map(child => (
              <button
                key={child.childId}
                onClick={() => setActiveChildId(child.childId)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  activeChildId === child.childId 
                    ? "bg-primary text-white shadow-md" 
                    : "text-text-secondary hover:bg-background hover:text-text-primary"
                }`}
              >
                <User className="w-4 h-4" />
                {child.childName}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeChild && (
        <>
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-text-secondary">Average Score</h3>
              </div>
              <p className="text-3xl font-bold text-primary">
                {totalGraded.length > 0 ? `${averagePercentage.toFixed(1)}%` : "N/A"}
              </p>
              <p className="text-xs text-primary/70 mt-1 font-medium">Based on {totalGraded.length} graded assignments</p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-status-success-bg p-2 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-status-success-text" />
                </div>
                <h3 className="text-sm font-medium text-text-secondary">Completed</h3>
              </div>
              <p className="text-3xl font-bold text-text-primary">{submittedCount + gradedCount}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">Assignments handed in</p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-status-warning-bg p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-status-warning-text" />
                </div>
                <h3 className="text-sm font-medium text-text-secondary">Pending Work</h3>
              </div>
              <p className="text-3xl font-bold text-text-primary">{pendingCount}</p>
              <p className="text-xs text-text-muted mt-1 font-medium">Needs to be submitted</p>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 shadow-card hover:shadow-md transition-shadow flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-1">
                <GraduationCap className="w-5 h-5 text-text-muted" />
                <span className="text-sm font-medium text-text-secondary">Class</span>
              </div>
              <p className="text-lg font-bold text-text-primary">{activeChild.className}</p>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-text-muted font-medium">Total Assignments</span>
                <span className="text-sm font-bold text-text-primary">{assignments.length}</span>
              </div>
            </div>
          </div>

          {/* Navigation & Filters */}
          <div className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "bg-surface text-text-muted border border-border"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Assignments List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filtered.map((assignment) => {
              const status = getStatus(assignment);
              const st = statusStyles[status];
              const days = Math.ceil((new Date(assignment.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const StatusIcon = st.icon;

              return (
                <div
                  key={assignment.id}
                  className="group bg-surface border border-border rounded-2xl shadow-sm hover:shadow-card hover:border-primary/30 transition-all overflow-hidden flex flex-col h-full"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${st.bg} ${st.border} ${st.text}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {st.label}
                          </span>
                          <span className="text-xs font-semibold tracking-wide text-text-muted bg-background border border-border px-2 py-1 rounded-md uppercase">
                            {assignment.subject}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-text-primary leading-tight group-hover:text-primary transition-colors">
                          {assignment.title}
                        </h3>
                      </div>
                      
                      {/* Score Badge */}
                      {status === "graded" && assignment.submission?.marks !== undefined && (
                        <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                          <span className="text-xl font-black text-primary leading-none">{assignment.submission.marks}</span>
                          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-1">/{assignment.maxMarks}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-text-secondary line-clamp-2 mb-6 flex-1">
                      {assignment.description}
                    </p>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-auto pt-4 border-t border-border/60">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <BookOpen className="w-4 h-4 text-text-muted" />
                        <span className="truncate">{assignment.teacher}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <FileText className="w-4 h-4 text-text-muted" />
                        <span>{assignment.maxMarks} max marks</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </div>
                      {status === "pending" && days > 0 && (
                        <div className={`flex items-center gap-2 font-medium ${
                          days <= 2 ? "text-red-600" : days <= 5 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          <Clock className="w-4 h-4" />
                          <span>{days} day{days !== 1 ? "s" : ""} left</span>
                        </div>
                      )}
                      {status === "overdue" && (
                        <div className="flex items-center gap-2 font-medium text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span>Late by {Math.abs(days)} days</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback Section */}
                  {status === "graded" && assignment.submission?.feedback && (
                    <div className="bg-primary-light/30 border-t border-primary/10 p-5">
                      <div className="flex gap-3">
                        <div className="bg-primary/10 p-2 rounded-full h-fit shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Teacher's Feedback</p>
                          <p className="text-sm text-text-primary italic leading-relaxed text-pretty">
                            "{assignment.submission.feedback}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="bg-surface border border-border rounded-3xl p-16 text-center shadow-sm">
              <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-5 border border-border">
                <FileText className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">No Assignments Found</h3>
              <p className="text-text-secondary max-w-sm mx-auto">
                We couldn't find any assignments matching the "{tabs.find(t => t.key === activeTab)?.label}" filter for {activeChild.childName}.
              </p>
              {activeTab !== "all" && (
                <button 
                  onClick={() => setActiveTab("all")}
                  className="mt-6 px-6 py-2.5 bg-background border border-border rounded-full text-sm font-medium text-text-primary hover:bg-surface transition-colors"
                >
                  View All Assignments
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
