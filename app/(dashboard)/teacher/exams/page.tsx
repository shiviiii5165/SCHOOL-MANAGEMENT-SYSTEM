"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar as CalendarIcon, CheckCircle2, Lock, PenTool } from "lucide-react";
import Link from "next/link";
import { formatExamDate } from "@/lib/examUtils";

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teacher/exams")
      .then(res => res.json())
      .then(data => {
        if (data.exams) setExams(data.exams);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-text-secondary animate-pulse">Loading exams...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Examinations</h1>
        <p className="text-sm text-text-secondary">View your assigned subjects and enter marks.</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No Exams Assigned</h3>
          <p className="text-text-secondary max-w-sm mb-6">You don't have any exams scheduled for your subjects currently.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {exams.map(exam => (
            <div key={exam.id} className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-6 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-text-primary text-xl">{exam.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-text-secondary font-mono bg-slate-200 px-2 py-0.5 rounded">{exam.academicYear}</span>
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <CalendarIcon className="w-4 h-4 text-text-muted" />
                      <span>{formatExamDate(exam.startDate)} - {formatExamDate(exam.endDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-md text-sm font-bold uppercase ${
                    exam.status === "MARKS_ENTRY" ? "bg-purple-100 text-purple-700" :
                    exam.status === "ONGOING" ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {exam.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="text-sm font-bold text-text-primary mb-4 uppercase tracking-wider">Your Assigned Slots</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exam.slots.map((slot: any) => (
                    <div key={slot.id} className="border border-border rounded-lg p-4 relative group hover:border-primary/50 transition-colors">
                      {slot.isLocked && (
                        <div className="absolute top-4 right-4">
                          <Lock className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      <h5 className="font-bold text-text-primary">{slot.subjectName}</h5>
                      <p className="text-sm text-text-secondary mb-3">{slot.className}</p>
                      
                      <div className="space-y-1.5 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Date</span>
                          <span className="font-medium text-text-primary">{formatExamDate(slot.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Time</span>
                          <span className="font-medium text-text-primary">{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Marks Progress</span>
                          <span className={`font-medium ${slot.isComplete ? 'text-green-600' : 'text-primary'}`}>
                            {slot.marksEntered}/{slot.totalStudents}
                          </span>
                        </div>
                      </div>

                      {exam.status === "MARKS_ENTRY" ? (
                        <Link
                          href={`/teacher/exams/${exam.id}/marks/${slot.id}`}
                          className={`w-full py-2 rounded-md font-medium flex items-center justify-center gap-2 transition-colors ${
                            slot.isLocked 
                              ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200" 
                              : "bg-primary text-white hover:bg-primary/90"
                          }`}
                        >
                          {slot.isLocked ? (
                            <><CheckCircle2 className="w-4 h-4" /> View Submission</>
                          ) : (
                            <><PenTool className="w-4 h-4" /> Enter Marks</>
                          )}
                        </Link>
                      ) : (
                        <button disabled className="w-full py-2 bg-slate-100 text-slate-400 rounded-md font-medium text-sm border border-slate-200">
                          {exam.status === "SCHEDULED" ? "Pending Start" : "Not Open for Marks"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
