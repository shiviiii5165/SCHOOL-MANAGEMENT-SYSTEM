"use client";

import { useState } from "react";
import { Loader2, X, Check, Clock, AlertCircle } from "lucide-react";

interface ClassStat {
  id: string;
  name: string;
  section: string;
  teacherName: string;
  avgAttendance: number;
  todayMarked: boolean;
  studentCount: number;
}

interface ClassWiseTableProps {
  classes: ClassStat[];
}

export default function ClassWiseTable({ classes }: ClassWiseTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassStat | null>(null);
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  const handleView = async (cls: ClassStat) => {
    setSelectedClass(cls);
    setModalOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance/class/${cls.id}/today`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceData(data.records);
      } else {
        setAttendanceData([]);
      }
    } catch (err) {
      console.error(err);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-display font-semibold text-text-primary">Class-Wise Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="text-left font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Class</th>
                <th className="text-left font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Teacher</th>
                <th className="text-left font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Avg Att.</th>
                <th className="text-left font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Today Status</th>
                <th className="text-right font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => {
                const isLow = cls.avgAttendance < 75;
                return (
                  <tr key={cls.id} className={`border-b border-border last:border-0 hover:bg-background/50 transition-colors ${isLow ? "border-l-4 border-l-[#D97706]" : ""}`}>
                    <td className="px-6 py-4 font-semibold text-text-primary">{cls.name} - {cls.section}</td>
                    <td className="px-6 py-4 text-text-secondary">{cls.teacherName}</td>
                    <td className="px-6 py-4">
                      <span className={`font-mono font-medium ${isLow ? "text-[#D97706]" : "text-text-primary"}`}>
                        {cls.avgAttendance}%
                        {isLow && <span className="ml-1 text-[#D97706]">⚠</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {cls.todayMarked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#16A34A]">
                          ✅ Marked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#DC2626]">
                          ❌ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {cls.todayMarked ? (
                        <button 
                          onClick={() => handleView(cls)}
                          className="text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                          View
                        </button>
                      ) : (
                        <button 
                          onClick={() => alert('Reminder sent!')}
                          className="text-primary hover:text-primary-dark font-medium transition-colors"
                        >
                          Remind
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">No class records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-xl shadow-modal w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up overflow-hidden border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border bg-background/50">
              <div>
                <h3 className="text-xl font-display font-bold text-text-primary">Today's Attendance</h3>
                <p className="text-sm text-text-secondary">{selectedClass.name} - {selectedClass.section} • {new Date().toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-text-secondary">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p>Loading records...</p>
                </div>
              ) : attendanceData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attendanceData.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {record.rollNo}
                        </div>
                        <span className="font-medium text-sm text-text-primary">{record.name}</span>
                      </div>
                      <div>
                        {record.status === 'PRESENT' && <span className="flex items-center gap-1 text-xs font-bold text-status-success-text bg-status-success-bg px-2 py-1 rounded"><Check className="w-3 h-3"/> PRESENT</span>}
                        {record.status === 'ABSENT' && <span className="flex items-center gap-1 text-xs font-bold text-status-danger-text bg-status-danger-bg px-2 py-1 rounded"><AlertCircle className="w-3 h-3"/> ABSENT</span>}
                        {record.status === 'LATE' && <span className="flex items-center gap-1 text-xs font-bold text-status-warning-text bg-status-warning-bg px-2 py-1 rounded"><Clock className="w-3 h-3"/> LATE</span>}
                        {record.status === 'BLOCKED' && <span className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded"><X className="w-3 h-3"/> BLOCKED</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  No attendance records found for today.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
