"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle2, Lock, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { calculateGrade, getGradeColor } from "@/lib/examUtils";

export default function TeacherMarksEntryClient({ examId, slotId }: { examId: string; slotId: string }) {
  const router = useRouter();
  const [slot, setSlot] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // References for auto-saving
  const entriesRef = useRef(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    fetchData();
  }, [examId, slotId]);

  useEffect(() => {
    if (!slot || slot.isLocked) return;

    // Auto-save every 120 seconds
    const interval = setInterval(() => {
      saveDraft(entriesRef.current, true);
    }, 120000);

    return () => clearInterval(interval);
  }, [slot]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/slots/${slotId}/marks`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setSlot(data.slot);
      // Initialize forms with empty string instead of null for uncontrolled inputs
      setEntries(data.entries.map((e: any) => ({
        ...e,
        marks: e.marks === null ? "" : e.marks,
      })));
    } catch (err: any) {
      toast.error(err.message || "Failed to load marks");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, field: string, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    
    // Auto-calculate grade
    if (field === "marks" || field === "isAbsent") {
      const isAbsent = field === "isAbsent" ? value : newEntries[index].isAbsent;
      const marksVal = field === "marks" ? value : newEntries[index].marks;
      
      if (isAbsent) {
        newEntries[index].grade = "AB";
      } else if (marksVal !== "" && !isNaN(Number(marksVal))) {
        newEntries[index].grade = calculateGrade(Number(marksVal), slot.maxMarks);
      } else {
        newEntries[index].grade = null;
      }
    }
    
    setEntries(newEntries);
  };

  const saveDraft = async (currentEntries: any[], silent = false) => {
    if (!silent) setSavingDraft(true);
    try {
      // Format before sending (convert empty string back to null)
      const payload = currentEntries.map(e => ({
        studentId: e.studentId,
        marks: e.marks === "" ? null : Number(e.marks),
        isAbsent: e.isAbsent,
        remarks: e.remarks,
      }));

      const res = await fetch(`/api/exams/${examId}/slots/${slotId}/marks/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setLastSaved(new Date());
      if (!silent) toast.success("Draft saved");
    } catch (err: any) {
      if (!silent) toast.error(err.message || "Failed to save draft");
    } finally {
      if (!silent) setSavingDraft(false);
    }
  };

  const submitFinal = async () => {
    // Validate all entered
    const missing = entries.filter(e => !e.isAbsent && e.marks === "");
    if (missing.length > 0) {
      toast.error(`Please enter marks or mark absent for all students (${missing.length} missing)`);
      setShowSubmitModal(false);
      return;
    }

    setSubmitting(true);
    try {
      const payload = entries.map(e => ({
        studentId: e.studentId,
        marks: e.isAbsent ? null : Number(e.marks),
        isAbsent: e.isAbsent,
        remarks: e.remarks,
      }));

      const res = await fetch(`/api/exams/${examId}/slots/${slotId}/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Marks submitted and locked successfully!");
      router.push("/teacher/exams");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit marks");
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
  if (!slot) return <div className="p-8 text-center text-text-secondary">Slot not found</div>;

  const enteredCount = entries.filter(e => e.isAbsent || e.marks !== "").length;
  const progressPct = (enteredCount / entries.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/teacher/exams" className="p-2 bg-surface border border-border rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Marks Entry: {slot.subjectName}</h1>
            <p className="text-sm text-text-secondary">{slot.className} • {slot.examName} • Max Marks: {slot.maxMarks}</p>
          </div>
        </div>
        
        {slot.isLocked ? (
          <div className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4" /> Submitted & Locked
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-text-muted">Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
            <button 
              onClick={() => saveDraft(entries)}
              disabled={savingDraft}
              className="px-4 py-2 bg-surface border border-border text-text-primary font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button 
              onClick={() => setShowSubmitModal(true)}
              disabled={enteredCount < entries.length}
              className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Final Submit
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="font-medium text-text-primary">Completion Progress</span>
            <span className="text-text-secondary">{enteredCount} of {entries.length} Students</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${enteredCount === entries.length ? 'bg-green-500' : 'bg-primary'}`} 
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background text-text-muted text-xs uppercase border-b border-border">
              <tr>
                <th className="px-4 py-3 w-16">Roll No</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3 w-24 text-center">Absent</th>
                <th className="px-4 py-3 w-32">Marks ({slot.maxMarks})</th>
                <th className="px-4 py-3 w-24">Grade</th>
                <th className="px-4 py-3">Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry, index) => (
                <tr key={entry.studentId} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-text-secondary">{entry.rollNo}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{entry.name}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={entry.isAbsent}
                      disabled={slot.isLocked}
                      onChange={(e) => handleInputChange(index, "isAbsent", e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary disabled:opacity-50"
                      tabIndex={-1}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max={slot.maxMarks}
                      step="0.5"
                      disabled={entry.isAbsent || slot.isLocked}
                      value={entry.marks}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (Number(val) > slot.maxMarks) val = slot.maxMarks.toString();
                        if (Number(val) < 0) val = "0";
                        handleInputChange(index, "marks", val);
                      }}
                      className="w-full p-2 border border-border rounded outline-none focus:border-primary disabled:bg-slate-100 font-mono"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {entry.grade ? (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(entry.grade)}`}>
                        {entry.grade}
                      </span>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      disabled={slot.isLocked}
                      value={entry.remarks || ""}
                      onChange={(e) => handleInputChange(index, "remarks", e.target.value)}
                      className="w-full p-2 border border-border rounded outline-none focus:border-primary disabled:bg-slate-100"
                      placeholder="Optional remark..."
                      tabIndex={-1} // Skip in tab sequence to keep fast entry
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Confirm Final Submission</h3>
              <p className="text-text-secondary mb-6">
                Are you sure you want to submit these marks? Once submitted, the slot will be locked and you will not be able to make further changes without an admin override.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Total Students</span>
                  <span className="font-medium text-text-primary">{entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Marks Entered</span>
                  <span className="font-medium text-text-primary">{entries.filter(e => e.marks !== "").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Marked Absent</span>
                  <span className="font-medium text-red-600">{entries.filter(e => e.isAbsent).length}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-surface border border-border text-text-secondary font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFinal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                  Submit & Lock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
