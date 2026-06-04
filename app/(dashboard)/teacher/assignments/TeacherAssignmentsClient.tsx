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
  fileUrl?: string | null;
}

const statusConfig: Record<string, { label: string, bg: string, text: string, dot: string }> = {
  ACTIVE: { label: "Active", bg: "bg-status-success-bg", text: "text-status-success-text", dot: "bg-status-success" },
  CLOSED: { label: "Closed", bg: "bg-[#F1F5F9]", text: "text-text-muted", dot: "bg-text-muted" },
  DRAFT: { label: "Draft", bg: "bg-status-warning-bg", text: "text-status-warning-text", dot: "bg-status-warning" },
};

interface TeacherAssignmentsClientProps {
  initialAssignments: Assignment[];
  subjects: {id: string, name: string}[];
  classes: {id: string, name: string, section: string}[];
}

export default function TeacherAssignmentsClient({ initialAssignments, subjects, classes }: TeacherAssignmentsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // For Submissions Modal
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<string | null>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  
  // Grading State
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const [classId, setClassId] = useState(classes[0]?.id || "");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("50");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setSubjectId(subjects[0]?.id || "");
    setClassId(classes[0]?.id || "");
    setDueDate("");
    setMaxMarks("50");
    setFile(null);
    setErrorMsg("");
    setShowModal(true);
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setTitle(assignment.title);
    // Since we don't have description in the client Assignment interface by default, it might be empty if we didn't fetch it, 
    // but we can try to find it or just leave blank to fetch later if needed. For now, empty is fine.
    setDescription(""); 
    
    // Reverse lookup subjectId and classId
    const s = subjects.find(s => s.name === assignment.subject);
    if (s) setSubjectId(s.id);
    const c = classes.find(c => `${c.name} - ${c.section}` === assignment.className);
    if (c) setClassId(c.id);
    
    setDueDate(assignment.dueDate.split('T')[0]); // format for input type="date"
    setMaxMarks(assignment.maxMarks.toString());
    setFile(null);
    setErrorMsg("");
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/teacher/assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete");
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (err) {
      alert("Failed to delete assignment");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewSubmissions = async (id: string) => {
    setViewingSubmissionsId(id);
    setIsLoadingSubmissions(true);
    setGradingSubId(null);
    try {
      const res = await fetch(`/api/teacher/assignments/${id}/submissions`);
      const data = await res.json();
      if (res.ok) {
        setSubmissionsList(data.submissions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleGradeSubmit = async (subId: string) => {
    if (!gradeMarks) return;
    setIsGrading(true);
    try {
      const res = await fetch(`/api/teacher/assignments/${viewingSubmissionsId}/submissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subId, marks: gradeMarks, feedback: gradeFeedback })
      });
      if (res.ok) {
        setSubmissionsList(submissionsList.map(s => 
          s.id === subId ? { ...s, marks: Number(gradeMarks), feedback: gradeFeedback } : s
        ));
        
        // Also update the graded count in the assignments list if it was previously ungraded
        const sub = submissionsList.find(s => s.id === subId);
        if (sub && sub.marks === null && viewingSubmissionsId) {
           setAssignments(assignments.map(a => 
             a.id === viewingSubmissionsId ? { ...a, graded: a.graded + 1 } : a
           ));
        }
        
        setGradingSubId(null);
      } else {
        alert("Failed to save grade");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving grade");
    } finally {
      setIsGrading(false);
    }
  };

  const getFileUrl = (url: string) => {
    return url;
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !classId || !dueDate || !maxMarks) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let fileUrl = "";
      
      // 1. Upload File if selected
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "File upload failed");
        }
        fileUrl = uploadData.url;
      }

      // 2. Create or Update Assignment
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/teacher/assignments/${editingId}` : "/api/teacher/assignments";

      const createRes = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subjectId,
          classId,
          dueDate,
          maxMarks: Number(maxMarks),
          fileUrl,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || "Failed to create assignment");
      }

      // Append locally formatted assignment to show immediate update
      const newAssignment = {
        id: createData.assignment.id,
        title: createData.assignment.title,
        subject: subjects.find(s => s.id === subjectId)?.name || "Subject",
        className: classes.find(c => c.id === classId) ? `${classes.find(c => c.id === classId)?.name} - ${classes.find(c => c.id === classId)?.section}` : "Class",
        dueDate: createData.assignment.dueDate,
        maxMarks: createData.assignment.maxMarks,
        totalStudents: editingId ? (assignments.find(a => a.id === editingId)?.totalStudents || 0) : 0,
        submitted: editingId ? (assignments.find(a => a.id === editingId)?.submitted || 0) : 0,
        graded: editingId ? (assignments.find(a => a.id === editingId)?.graded || 0) : 0,
        status: "ACTIVE" as const,
        createdAt: createData.assignment.createdAt,
        fileUrl: createData.assignment.fileUrl
      };
      
      if (editingId) {
        setAssignments(assignments.map(a => a.id === editingId ? newAssignment : a));
      } else {
        setAssignments([newAssignment, ...assignments]);
      }
      setShowModal(false);
      
      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onClick={openNewModal}
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
                      {assignment.fileUrl && (
                        <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                          <FileText className="w-3.5 h-3.5" />
                          View Attachment
                        </a>
                      )}
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
                      <button onClick={() => handleViewSubmissions(assignment.id)} className="p-2 text-text-muted hover:text-primary hover:bg-primary-light rounded-md transition-colors" title="View Submissions">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(assignment)} className="p-2 text-text-muted hover:text-role-teacher hover:bg-role-teacher/10 rounded-md transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(assignment.id)} 
                        disabled={isDeleting === assignment.id}
                        className="p-2 text-text-muted hover:text-status-danger-text hover:bg-status-danger-bg rounded-md transition-colors disabled:opacity-50" 
                        title="Delete"
                      >
                        {isDeleting === assignment.id ? <span className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin inline-block" /> : <Trash2 className="w-4 h-4" />}
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
              <h2 className="text-lg font-display font-bold text-text-primary">{editingId ? "Edit Assignment" : "New Assignment"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-background rounded transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {errorMsg && <div className="text-status-danger-text text-sm font-medium mb-3">{errorMsg}</div>}
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Chapter 5 Practice Problems"
                  className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Subject + Class Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Subject</label>
                  <select 
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-surface focus:outline-none focus:border-primary"
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Class</label>
                  <select 
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-surface focus:outline-none focus:border-primary"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm bg-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Max Marks</label>
                  <input
                    type="number"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    placeholder="50"
                    className="w-full border border-border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Attachment (Optional)</label>
                <div className="relative border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary-light/30 transition-colors group">
                  <input 
                    type="file" 
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {file ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle2 className="w-8 h-8 text-status-success mx-auto mb-2" />
                      <p className="text-sm font-medium text-text-primary">{file.name}</p>
                      <p className="text-xs text-text-muted mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-text-muted mx-auto mb-2 group-hover:text-primary transition-colors" />
                      <p className="text-sm text-text-secondary">Click to upload or drag and drop</p>
                      <p className="text-xs text-text-muted mt-1">PDF, DOCX, PNG up to 10MB</p>
                    </>
                  )}
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
              <button 
                onClick={handlePublish}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
              >
                {isSubmitting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : null}
                {isSubmitting ? (editingId ? "Saving..." : "Publishing...") : (editingId ? "Save Changes" : "Publish")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Submissions Modal */}
      {viewingSubmissionsId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-modal w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-display font-bold text-text-primary">Student Submissions</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {assignments.find(a => a.id === viewingSubmissionsId)?.title}
                </p>
              </div>
              <button onClick={() => setViewingSubmissionsId(null)} className="p-1 hover:bg-background rounded transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isLoadingSubmissions ? (
                <div className="flex justify-center items-center py-12">
                  <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
                </div>
              ) : submissionsList.length === 0 ? (
                <div className="text-center py-12 bg-background rounded-lg border border-border">
                  <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
                  <p className="text-text-primary font-medium">No submissions yet</p>
                  <p className="text-sm text-text-secondary mt-1">Students haven't submitted their work for this assignment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissionsList.map(sub => (
                    <div key={sub.id} className="flex flex-col p-4 border border-border rounded-lg hover:border-primary/50 transition-colors gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{sub.studentName}</p>
                          <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString()}
                            </span>
                            {sub.feedback && (
                              <span className="truncate max-w-[200px]" title={sub.feedback}>
                                Note: {sub.feedback}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {sub.marks !== null ? (
                            <span className="text-sm font-semibold text-status-success-text bg-status-success-bg px-2 py-1 rounded">
                              {sub.marks} marks
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-status-warning-text bg-status-warning-bg px-2 py-1 rounded">
                              Pending Grade
                            </span>
                          )}
                          
                          <button 
                            onClick={() => {
                              setGradingSubId(gradingSubId === sub.id ? null : sub.id);
                              setGradeMarks(sub.marks !== null ? sub.marks.toString() : "");
                              setGradeFeedback(sub.feedback || "");
                            }}
                            className="text-sm font-medium text-text-secondary hover:text-primary transition-colors border border-border px-3 py-1.5 rounded-md"
                          >
                            {sub.marks !== null ? "Edit Grade" : "Grade"}
                          </button>

                          {sub.fileUrl && (
                            <a href={getFileUrl(sub.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline bg-primary-light/50 px-3 py-1.5 rounded-md font-medium">
                              <FileText className="w-4 h-4" />
                              View File
                            </a>
                          )}
                        </div>
                      </div>

                      {gradingSubId === sub.id && (
                        <div className="bg-background border border-border p-4 rounded-lg mt-2 animate-in slide-in-from-top-2 flex flex-col sm:flex-row items-end gap-4">
                          <div className="w-full sm:w-1/3">
                            <label className="block text-xs font-bold text-text-secondary mb-1">Marks (out of {assignments.find(a => a.id === viewingSubmissionsId)?.maxMarks})</label>
                            <input 
                              type="number" 
                              value={gradeMarks}
                              onChange={(e) => setGradeMarks(e.target.value)}
                              className="w-full border border-border p-2 rounded-md text-sm focus:outline-none focus:border-primary"
                              placeholder="e.g. 45"
                            />
                          </div>
                          <div className="w-full sm:w-2/3">
                            <label className="block text-xs font-bold text-text-secondary mb-1">Feedback (Optional)</label>
                            <input 
                              type="text" 
                              value={gradeFeedback}
                              onChange={(e) => setGradeFeedback(e.target.value)}
                              className="w-full border border-border p-2 rounded-md text-sm focus:outline-none focus:border-primary"
                              placeholder="Great work on this..."
                            />
                          </div>
                          <button 
                            onClick={() => handleGradeSubmit(sub.id)}
                            disabled={isGrading || !gradeMarks}
                            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 shrink-0"
                          >
                            {isGrading ? "Saving..." : "Save"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-border bg-background/50 flex justify-end rounded-b-2xl">
              <button onClick={() => setViewingSubmissionsId(null)} className="px-4 py-2 border border-border bg-surface hover:bg-background rounded-md text-sm font-medium transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

