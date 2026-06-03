"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar as CalendarIcon, ShieldAlert, GraduationCap } from "lucide-react";
import { formatExamDate } from "@/lib/examUtils";

export default function ParentExamsPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parent/exams")
      .then(res => res.json())
      .then(data => {
        if (data.children) {
          setChildren(data.children);
          if (data.children.length > 0) setActiveChildId(data.children[0].id);
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-text-secondary animate-pulse">Loading exams...</div>;
  }

  const activeChild = children.find(c => c.id === activeChildId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Children's Examinations</h1>
        <p className="text-sm text-text-secondary">View exam schedules and eligibility for your children.</p>
      </div>

      {children.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setActiveChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all whitespace-nowrap ${
                activeChildId === child.id 
                  ? "bg-primary text-white border-primary" 
                  : "bg-surface border-border text-text-secondary hover:border-primary/50"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              {child.name}
            </button>
          ))}
        </div>
      )}

      {!activeChild ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center shadow-card">
          <p className="text-text-secondary">No children profiles found.</p>
        </div>
      ) : activeChild.exams.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center shadow-card">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No Upcoming Exams</h3>
          <p className="text-text-secondary max-w-sm">There are no exams scheduled for {activeChild.name}'s class at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeChild.exams.map((exam: any) => (
            <div key={exam.id} className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
              <div className="p-6 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-text-primary text-xl">{exam.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                    <span className="font-mono bg-slate-200 px-2 py-0.5 rounded">{exam.type.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-4 h-4 text-text-muted" />
                      <span>{formatExamDate(exam.startDate)} - {formatExamDate(exam.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {exam.isBlocked ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-xs">
                      <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-bold">Admit Card Withheld</p>
                        <p className="text-xs leading-tight opacity-90 mt-0.5">{exam.blockReason}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-bold">
                      Eligible to Appear
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <h4 className="font-bold text-text-primary mb-4">Timetable</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exam.slots.map((slot: any) => (
                    <div key={slot.id} className="border border-border rounded-lg p-4 bg-background">
                      <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{formatExamDate(slot.date)}</div>
                      <h5 className="font-bold text-text-primary mb-2">{slot.subjectName}</h5>
                      <div className="space-y-1 text-sm text-text-secondary">
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span className="font-medium text-text-primary">{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Room:</span>
                          <span className="font-medium text-text-primary">{slot.room}</span>
                        </div>
                      </div>
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
