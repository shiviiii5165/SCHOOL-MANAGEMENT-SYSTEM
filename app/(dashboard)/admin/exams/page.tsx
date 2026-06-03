"use client";

import { useState, useEffect } from "react";
import { Plus, BookOpen, Calendar as CalendarIcon, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exams")
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">Draft</span>;
      case "SCHEDULED": return <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">Scheduled</span>;
      case "ONGOING": return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-xs font-medium">Ongoing</span>;
      case "MARKS_ENTRY": return <span className="px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-xs font-medium">Marks Entry</span>;
      case "COMPLETED": return <span className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Examination Management</h1>
          <p className="text-sm text-text-secondary">Create and manage all school examinations.</p>
        </div>
        <Link 
          href="/admin/exams/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          Create Exam
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface p-6 rounded-xl border border-border shadow-card animate-pulse h-48"></div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No Exams Found</h3>
          <p className="text-text-secondary max-w-sm mb-6">You haven't created any examinations yet. Start by creating a new exam schedule.</p>
          <Link 
            href="/admin/exams/create"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map(exam => (
            <Link key={exam.id} href={`/admin/exams/${exam.id}`}>
              <div className="bg-surface rounded-xl border border-border p-6 shadow-card hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-text-primary text-lg group-hover:text-primary transition-colors">{exam.name}</h3>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-mono mt-1">{exam.academicYear} • {exam.type.replace(/_/g, ' ')}</p>
                  </div>
                  {getStatusBadge(exam.status)}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <CalendarIcon className="w-4 h-4 text-text-muted" />
                    <span>{new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <FileText className="w-4 h-4 text-text-muted" />
                    <span>{exam.slots?.length || 0} Subjects Scheduled</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Results</p>
                    <p className="font-mono font-medium text-text-primary">{exam._count?.results || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Admit Cards</p>
                    <p className="font-mono font-medium text-text-primary">{exam._count?.hallTickets || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-text-muted mb-1">Summaries</p>
                    <p className="font-mono font-medium text-text-primary">{exam._count?.summaries || 0}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
