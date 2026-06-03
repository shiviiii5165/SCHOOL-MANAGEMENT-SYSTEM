"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, AlertTriangle, ShieldAlert, Smartphone, Clock, MessageSquareX, Frown, CheckCircle2, ChevronRight, X, Loader2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  avatar: string;
}

const categories = [
  { id: "Attendance", title: "Attendance", icon: Clock, desc: "Late arrival, unauthorized absence" },
  { id: "Behavior", title: "Behavior", icon: Frown, desc: "Disruptive in class, disrespect" },
  { id: "Device Use", title: "Device Use", icon: Smartphone, desc: "Unauthorized phone/tablet use" },
  { id: "Academic", title: "Academic", icon: MessageSquareX, desc: "Cheating, plagiarism, not doing work" },
  { id: "Safety", title: "Safety", icon: ShieldAlert, desc: "Fighting, bullying, dangerous actions" },
];

export default function TeacherDisciplinePage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [incidentDetails, setIncidentDetails] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search students from API
  const { data: studentsData, isLoading: isSearching } = useQuery({
    queryKey: ["student-search", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return { students: [] };
      const res = await fetch(`/api/students/search?q=${encodeURIComponent(debouncedSearch)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedSearch.length >= 2,
  });

  const students: Student[] = studentsData?.students || [];

  // Submit report mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: { studentId: string; category: string; description: string }) => {
      const res = await fetch("/api/discipline/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit report");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discipline-reports"] });
      setShowToast(true);
      setToastError(null);
      setStep(1);
      setSelectedStudent(null);
      setSelectedCategory(null);
      setIncidentDetails("");
      setSearchTerm("");
      setTimeout(() => setShowToast(false), 4000);
    },
    onError: (error: Error) => {
      setToastError(error.message);
      setTimeout(() => setToastError(null), 5000);
    },
  });

  const handleNext = () => {
    if (selectedStudent) setStep(2);
  };

  const handleSubmit = () => {
    if (!selectedStudent || !selectedCategory || !incidentDetails) return;

    let apiCategory = "OTHER";
    if (selectedCategory === "Attendance") apiCategory = "ATTENDANCE";
    else if (selectedCategory === "Behavior") apiCategory = "BEHAVIORAL";
    else if (selectedCategory === "Academic") apiCategory = "ACADEMIC";

    submitMutation.mutate({
      studentId: selectedStudent.id,
      category: apiCategory,
      description: incidentDetails,
    });
  };

  return (
    <div className="space-y-6 relative max-w-3xl mx-auto">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-status-success-bg border border-status-success text-status-success-text px-4 py-3 rounded-lg shadow-dropdown flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-medium text-sm">Report Submitted</p>
              <p className="text-xs opacity-90">Forwarded to Admin for review</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {toastError && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-status-danger-bg border border-status-danger text-status-danger-text px-4 py-3 rounded-lg shadow-dropdown flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-medium text-sm">Submission Failed</p>
              <p className="text-xs opacity-90">{toastError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">Discipline Report</h1>
        <p className="text-sm text-text-secondary mt-1">Report student incidents securely to the administration</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border rounded-full -z-10" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500 -z-10" 
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
            step >= 1 ? "bg-primary text-white ring-4 ring-background" : "bg-surface border-2 border-border text-text-muted"
          }`}>
            1
          </div>
          <span className={`text-xs font-semibold ${step >= 1 ? "text-primary" : "text-text-muted"}`}>Select Student</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
            step >= 2 ? "bg-primary text-white ring-4 ring-background" : "bg-surface border-2 border-border text-text-muted ring-4 ring-background"
          }`}>
            2
          </div>
          <span className={`text-xs font-semibold ${step >= 2 ? "text-primary" : "text-text-muted"}`}>Incident Details</span>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-border overflow-hidden relative min-h-[500px]">
        {/* Step 1: Student Lookup */}
        <div className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out flex flex-col ${
          step === 1 ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
        }`}>
          <div className="w-full max-w-xl mx-auto flex flex-col h-full">
            <div className="text-center shrink-0 mb-6">
              <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Who is involved?</h2>
              <p className="text-sm text-text-secondary mt-1">Search by student name or roll number (min 2 characters)</p>
            </div>

            <div className="relative shrink-0 mb-6">
              <Search className="w-5 h-5 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {isSearching && (
                <Loader2 className="w-5 h-5 text-primary absolute right-4 top-1/2 -translate-y-1/2 animate-spin" />
              )}
            </div>

            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar mb-6">
              {isSearching ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-sm text-text-muted">Searching...</p>
                </div>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedStudent?.id === student.id
                        ? "border-primary bg-primary-light/30"
                        : "border-border hover:border-border-strong bg-surface"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      selectedStudent?.id === student.id ? "bg-primary text-white" : "bg-background text-text-secondary"
                    }`}>
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{student.name}</p>
                      <p className="text-xs text-text-secondary">{student.className} • Roll {student.rollNo}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedStudent?.id === student.id ? "border-primary" : "border-border"
                    }`}>
                      {selectedStudent?.id === student.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                    </div>
                  </button>
                ))
              ) : debouncedSearch.length >= 2 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted">No students found matching &quot;{debouncedSearch}&quot;</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted">Type at least 2 characters to search</p>
                </div>
              )}
            </div>

            <div className="pt-4 mt-auto shrink-0 flex justify-end border-t border-border">
              <button
                onClick={handleNext}
                disabled={!selectedStudent}
                className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Incident Details */}
        <div className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out flex flex-col ${
          step === 2 ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}>
          <div className="flex items-center gap-3 mb-6 bg-background p-3 rounded-xl border border-border">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary font-bold">
              {selectedStudent?.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-0.5">Reporting on</p>
              <p className="font-semibold text-text-primary">{selectedStudent?.name} <span className="text-sm font-normal text-text-secondary">({selectedStudent?.className})</span></p>
            </div>
            <button 
              onClick={() => setStep(1)}
              className="text-xs font-medium text-primary hover:underline px-3 py-1.5 bg-primary-light rounded-md transition-colors"
            >
              Change Student
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Violation Category <span className="text-status-danger">*</span></label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 text-center transition-all ${
                        selectedCategory === cat.id
                          ? "border-status-danger bg-status-danger-bg text-status-danger-text shadow-sm"
                          : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-background"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${selectedCategory === cat.id ? "text-status-danger" : "text-text-muted"}`} />
                      <span className="text-sm font-semibold mb-1">{cat.title}</span>
                      <span className={`text-[10px] leading-tight ${selectedCategory === cat.id ? "text-status-danger-text/80" : "text-text-muted"}`}>{cat.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Incident Details <span className="text-status-danger">*</span></label>
              <textarea
                value={incidentDetails}
                onChange={(e) => setIncidentDetails(e.target.value)}
                placeholder="Describe what happened in detail. Provide location, time, and any witnesses..."
                rows={5}
                className="w-full p-4 border border-border rounded-xl text-sm focus:outline-none focus:border-status-danger focus:ring-1 focus:ring-status-danger transition-all resize-none bg-background"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 text-text-secondary font-medium hover:bg-background rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedCategory || !incidentDetails || submitMutation.isPending}
              className="flex items-center gap-2 bg-status-danger hover:bg-status-danger/90 text-white px-8 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Report
                  <AlertTriangle className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
