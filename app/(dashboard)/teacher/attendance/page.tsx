"use client";

import { useEffect, useState, useCallback } from "react";
import { useAttendanceStore } from "@/hooks/useAttendanceStore";
import AttendanceToolbar from "@/components/attendance/teacher/AttendanceToolbar";
import AttendanceGrid from "@/components/attendance/teacher/AttendanceGrid";
import SubmitBar from "@/components/attendance/teacher/SubmitBar";
import VerificationModal from "@/components/attendance/teacher/VerificationModal";
import { Loader2 } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
  section: string;
}

interface StudentData {
  id: string;
  name: string;
  rollNo: string;
  regId: string;
  avatar?: string | null;
  isSuspended: boolean;
  suspensionReason?: string;
  attendancePercentage: number;
  totalClassesHeld: number;
}

export default function TeacherAttendancePage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [classTotalClasses, setClassTotalClasses] = useState<number>(0);

  const { selectedClass, selectedDate, initAttendance, resetAttendance, attendanceMap } = useAttendanceStore();

  // Fetch teacher's classes
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("/api/attendance/teacher-classes");
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
        }
      } catch (err) {
        console.error("Failed to fetch classes:", err);
      }
    }
    fetchClasses();
  }, []);

  // Fetch students when class or date changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      resetAttendance();
      return;
    }

    async function fetchStudents() {
      setLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const res = await fetch(`/api/attendance/class/${selectedClass}/date/${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          const studentList: StudentData[] = (data.students || []).map((s: any) => ({
            id: s.id,
            name: s.user?.name || s.name || "Unknown",
            rollNo: s.rollNo,
            regId: s.user?.regId || s.regId || "",
            avatar: s.user?.avatar || null,
            isSuspended: s.isSuspended || false,
            suspensionReason: s.suspendedReason || "",
            suspendedUntil: s.suspendedUntil || null,
            attendancePercentage: s.attendancePercentage,
            totalClassesHeld: s.attendanceSummary?.totalClasses || 0,
          }));

          // Sort by roll number ascending
          studentList.sort((a, b) => {
            const aNum = parseInt(a.rollNo, 10);
            const bNum = parseInt(b.rollNo, 10);
            if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
            return a.rollNo.localeCompare(b.rollNo);
          });

          setStudents(studentList);
          setClassTotalClasses(data.totalClassesHeld || 0);

          // Build existing records map if attendance was already marked
          const existingRecords: Record<string, any> = {};
          if (data.existingAttendance) {
            data.existingAttendance.forEach((rec: any) => {
              existingRecords[rec.studentId] = rec.status;
            });
          }

          initAttendance(
            studentList.map((s) => ({ id: s.id, isSuspended: s.isSuspended })),
            Object.keys(existingRecords).length > 0 ? existingRecords : undefined
          );
        }
      } catch (err) {
        console.error("Failed to fetch students:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [selectedClass, selectedDate]);

  const handleSubmit = useCallback(async (headCount: number) => {
    if (!selectedClass) return;

    const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      const res = await fetch("/api/attendance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass,
          date: selectedDate.toISOString().split("T")[0],
          records,
          headCount,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setToastMsg("✅ Attendance saved successfully!");
        setTimeout(() => setToastMsg(null), 3000);
      } else {
        const err = await res.json();
        setToastMsg(`❌ ${err.error || "Failed to save"}`);
        setTimeout(() => setToastMsg(null), 4000);
      }
    } catch (err) {
      setToastMsg("❌ Network error. Please try again.");
      setTimeout(() => setToastMsg(null), 4000);
    }
  }, [selectedClass, selectedDate, attendanceMap]);

  const selectedClassName = classes.find((c) => c.id === selectedClass);
  const classLabel = selectedClassName ? `${selectedClassName.name} - ${selectedClassName.section}` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Mark Attendance</h1>
          <p className="text-sm text-text-secondary mt-1">Select a class and mark daily attendance</p>
        </div>
        {selectedClass && (
          <div className="flex gap-3">
            <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
              <span className="text-sm font-semibold text-primary">
                Classes Held: {classTotalClasses}
              </span>
            </div>
            <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
              <span className="text-sm font-semibold text-emerald-600">
                Avg: {students.length > 0 ? (students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        )}
      </div>

      <AttendanceToolbar classes={classes} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-text-secondary font-medium">Loading students...</span>
        </div>
      ) : !selectedClass ? (
        <div className="flex flex-col items-center justify-center p-16 bg-surface border border-border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">Select a Class</h3>
          <p className="text-sm text-text-secondary text-center max-w-sm">
            Choose a class from the toolbar above to view and mark student attendance.
          </p>
        </div>
      ) : (
        <AttendanceGrid students={students} />
      )}

      <SubmitBar
        classNameName={classLabel}
        date={selectedDate.toISOString().split("T")[0]}
        onSubmitClick={() => setShowModal(true)}
        students={students}
      />

      <VerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleSubmit}
        classNameName={classLabel}
        date={selectedDate.toISOString().split("T")[0]}
        students={students}
      />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-surface border border-border shadow-modal rounded-xl px-5 py-3 text-sm font-medium text-text-primary animate-slide-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
