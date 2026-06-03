import React from "react";
import StudentCard from "./StudentCard";

interface Student {
  id: string;
  name: string;
  rollNo: string;
  regId: string;
  avatar?: string | null;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedUntil?: Date | null | string;
  attendancePercentage?: number;
  totalClassesHeld?: number;
}

export default function AttendanceGrid({ students }: { students: Student[] }) {
  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border rounded-xl">
        <p className="text-text-secondary font-medium">No students found for this class.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface border border-border rounded-xl shadow-sm mb-24 overflow-hidden relative">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[500px] md:min-w-0">
          {/* Table Header */}
          <div className="grid grid-cols-[120px_1fr_180px] md:grid-cols-[180px_1fr_240px] items-center px-4 md:px-6 py-3 bg-[#F8FAFC] border-b border-border text-[11px] md:text-xs font-semibold text-text-secondary uppercase tracking-wider sticky top-0 z-10">
            <div>REGISTRATION ID</div>
            <div>STUDENT NAME</div>
            <div className="text-center md:text-left">STATUS</div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                id={student.id}
                name={student.name}
                rollNo={student.rollNo}
                regId={student.regId}
                avatar={student.avatar}
                isSuspended={student.isSuspended}
                suspensionReason={student.suspensionReason}
                suspendedUntil={student.suspendedUntil}
                attendancePercentage={student.attendancePercentage}
                totalClassesHeld={student.totalClassesHeld}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
