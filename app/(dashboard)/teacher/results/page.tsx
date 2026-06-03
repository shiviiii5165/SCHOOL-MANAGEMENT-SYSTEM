"use client";

import { useState } from "react";
import {
  Award, CheckCircle2, Save, ChevronDown, Users,
  BookOpen, ClipboardList, TrendingUp, AlertTriangle
} from "lucide-react";

interface StudentResult {
  id: string;
  name: string;
  rollNo: string;
  marks: string;
  grade: string;
  remarks: string;
}

const gradeFromMarks = (marks: number, maxMarks: number): string => {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
};

const gradeColors: Record<string, string> = {
  "A+": "bg-status-success text-white",
  "A": "bg-status-success/80 text-white",
  "B+": "bg-primary text-white",
  "B": "bg-primary/80 text-white",
  "C": "bg-status-warning text-white",
  "D": "bg-status-warning/70 text-white",
  "F": "bg-status-danger text-white",
  "": "bg-background text-text-muted",
};

const initialStudents: StudentResult[] = [
  { id: "1", name: "Rahul Kumar", rollNo: "01", marks: "", grade: "", remarks: "" },
  { id: "2", name: "Priya Sharma", rollNo: "02", marks: "", grade: "", remarks: "" },
  { id: "3", name: "Aman Singh", rollNo: "03", marks: "", grade: "", remarks: "" },
  { id: "4", name: "Neha Gupta", rollNo: "04", marks: "", grade: "", remarks: "" },
  { id: "5", name: "Vikram Das", rollNo: "05", marks: "", grade: "", remarks: "" },
  { id: "6", name: "Anjali Patel", rollNo: "06", marks: "", grade: "", remarks: "" },
  { id: "7", name: "Rohan Mehta", rollNo: "07", marks: "", grade: "", remarks: "" },
  { id: "8", name: "Kavya Reddy", rollNo: "08", marks: "", grade: "", remarks: "" },
  { id: "9", name: "Arjun Nair", rollNo: "09", marks: "", grade: "", remarks: "" },
  { id: "10", name: "Simran Kaur", rollNo: "10", marks: "", grade: "", remarks: "" },
];

export default function TeacherResultsPage() {
  const [students, setStudents] = useState<StudentResult[]>(initialStudents);
  const [selectedClass, setSelectedClass] = useState("Class 10 - A");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [examType, setExamType] = useState("Unit Test 1");
  const [maxMarks, setMaxMarks] = useState("50");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const maxMarksNum = parseInt(maxMarks) || 100;
  const filledCount = students.filter(s => s.marks !== "").length;
  const allFilled = filledCount === students.length;

  const avgMarks = filledCount > 0
    ? Math.round(students.filter(s => s.marks !== "").reduce((acc, s) => acc + parseFloat(s.marks), 0) / filledCount)
    : 0;
  const passCount = students.filter(s => s.marks !== "" && (parseFloat(s.marks) / maxMarksNum) * 100 >= 40).length;
  const failCount = students.filter(s => s.marks !== "" && (parseFloat(s.marks) / maxMarksNum) * 100 < 40).length;

  const handleMarksChange = (id: string, value: string) => {
    setStudents(students.map(s => {
      if (s.id === id) {
        const marks = value === "" ? "" : value;
        const numMarks = parseFloat(marks);
        const grade = marks !== "" && !isNaN(numMarks) ? gradeFromMarks(numMarks, maxMarksNum) : "";
        return { ...s, marks, grade };
      }
      return s;
    }));
  };

  const handleRemarksChange = (id: string, value: string) => {
    setStudents(students.map(s =>
      s.id === id ? { ...s, remarks: value } : s
    ));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-status-success-bg border border-status-success text-status-success-text px-4 py-3 rounded-lg shadow-dropdown flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-medium text-sm">Results Saved</p>
              <p className="text-xs opacity-90">Draft saved successfully</p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Result Entry</h1>
          <p className="text-sm text-text-secondary mt-1">Enter marks and publish results for your classes</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-surface p-5 rounded-xl shadow-card border border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-text-primary text-sm focus:outline-none focus:border-primary font-medium"
            >
              <option>Class 10 - A</option>
              <option>Class 10 - B</option>
              <option>Class 9 - C</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-text-primary text-sm focus:outline-none focus:border-primary font-medium"
            >
              <option>Mathematics</option>
              <option>English</option>
              <option>Chemistry</option>
              <option>Computer Science</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-text-primary text-sm focus:outline-none focus:border-primary font-medium"
            >
              <option>Unit Test 1</option>
              <option>Unit Test 2</option>
              <option>Mid Term</option>
              <option>Final</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">Max Marks</label>
            <input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-text-primary text-sm focus:outline-none focus:border-primary font-medium"
            />
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium">Entered</p>
            <p className="text-lg font-bold text-text-primary">{filledCount}<span className="text-sm font-normal text-text-muted">/{students.length}</span></p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 bg-status-info-bg rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-status-info-text" />
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium">Average</p>
            <p className="text-lg font-bold text-text-primary">{avgMarks}<span className="text-sm font-normal text-text-muted">/{maxMarksNum}</span></p>
          </div>
        </div>
        <div className="bg-status-success-bg border border-status-success/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-status-success/10 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-status-success-text" />
          </div>
          <div>
            <p className="text-xs text-status-success-text font-medium">Passed</p>
            <p className="text-lg font-bold text-status-success-text">{passCount}</p>
          </div>
        </div>
        <div className="bg-status-danger-bg border border-status-danger/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-status-danger/10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-status-danger-text" />
          </div>
          <div>
            <p className="text-xs text-status-danger-text font-medium">Failed</p>
            <p className="text-lg font-bold text-status-danger-text">{failCount}</p>
          </div>
        </div>
      </div>

      {/* Result Entry Table */}
      <div className="bg-surface rounded-xl shadow-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-text-muted text-xs uppercase border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium w-16">Roll</th>
                <th className="px-4 py-3 font-medium">Student Name</th>
                <th className="px-4 py-3 font-medium w-32">Marks (out of {maxMarksNum})</th>
                <th className="px-4 py-3 font-medium w-20 text-center">Grade</th>
                <th className="px-4 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const isInvalid = student.marks !== "" && (parseFloat(student.marks) > maxMarksNum || parseFloat(student.marks) < 0);
                return (
                  <tr
                    key={student.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      idx % 2 === 0 ? "" : "bg-background/40"
                    } ${isInvalid ? "bg-status-danger-bg/40" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-text-muted">{student.rollNo}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary">{student.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={student.marks}
                        onChange={(e) => handleMarksChange(student.id, e.target.value)}
                        min={0}
                        max={maxMarksNum}
                        placeholder="—"
                        className={`w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none transition-all font-mono text-center ${
                          isInvalid
                            ? "border-status-danger bg-status-danger-bg focus:border-status-danger focus:ring-1 focus:ring-status-danger"
                            : "border-border focus:border-primary focus:ring-1 focus:ring-primary"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold ${gradeColors[student.grade] || gradeColors[""]}`}>
                        {student.grade || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={student.remarks}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        placeholder="Optional remarks..."
                        className="w-full border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-6 flex items-center justify-between bg-surface border border-border rounded-xl p-4 shadow-dropdown">
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">{filledCount}</span> of <span className="font-medium text-text-primary">{students.length}</span> students marked
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={filledCount === 0 || isSaving}
            className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-text-primary hover:bg-background disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => setShowPublishConfirm(true)}
            disabled={!allFilled}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shadow-sm"
          >
            <Award className="w-4 h-4" />
            Publish Results
          </button>
        </div>
      </div>

      {/* Publish Confirm Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-modal w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-status-warning-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-status-warning-text" />
              </div>
              <h3 className="text-lg font-display font-bold text-text-primary mb-2">Publish Results?</h3>
              <p className="text-sm text-text-secondary">
                This will make results visible to all students and parents of <span className="font-medium text-text-primary">{selectedClass}</span> for <span className="font-medium text-text-primary">{examType}</span>. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 p-6 pt-0 justify-center">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="px-6 py-2.5 border border-border rounded-md text-sm font-medium text-text-primary hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowPublishConfirm(false); handleSave(); }}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Publish Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
