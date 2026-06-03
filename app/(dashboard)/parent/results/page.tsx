"use client";

import { useState, useEffect } from "react";
import { Award, ChevronRight, FileText, Trophy, GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getGradeColor } from "@/lib/examUtils";
import toast from "react-hot-toast";

export default function ParentResultsPage() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    // Fetch children list first (we can use the same endpoint or extract from session/parent profile)
    // For simplicity, we'll fetch from parent/exams to get the list, then fetch results
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

  useEffect(() => {
    if (activeChildId) {
      setResultsLoading(true);
      fetch(`/api/parent/results/${activeChildId}`)
        .then(res => res.json())
        .then(data => {
          if (data.results) setResults(data.results);
          setResultsLoading(false);
        })
        .catch(() => setResultsLoading(false));
    }
  }, [activeChildId]);

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading...</div>;

  const activeChild = children.find(c => c.id === activeChildId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Children's Academic Results</h1>
        <p className="text-sm text-text-secondary">Track performance and download report cards.</p>
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
      ) : resultsLoading ? (
        <div className="p-8 text-center text-text-secondary animate-pulse">Loading results for {activeChild.name}...</div>
      ) : results.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center shadow-card">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No Results Published Yet</h3>
          <p className="text-text-secondary max-w-sm">There are no published results for {activeChild.name} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(result => (
            <div key={result.examId} className="bg-surface rounded-xl border border-border p-6 shadow-card hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-text-primary">{result.examName}</h3>
                  <p className="text-xs text-text-muted mt-1">{result.academicYear} • {new Date(result.date).toLocaleDateString()}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                  result.percentage >= 50 ? "border-green-500 text-green-700 bg-green-50" : 
                  result.percentage >= 33 ? "border-amber-500 text-amber-700 bg-amber-50" : "border-red-500 text-red-700 bg-red-50"
                }`}>
                  <span className="font-bold font-mono text-sm">{result.percentage.toFixed(0)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                <div className="bg-slate-50 p-3 rounded-lg border border-border text-center">
                  <p className="text-xs text-text-muted mb-1">Marks</p>
                  <p className="font-mono font-bold text-text-primary">{result.totalMarks}/{result.maxMarks}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-border text-center">
                  <p className="text-xs text-text-muted mb-1">Grade</p>
                  <p className={`font-bold ${getGradeColor(result.grade).split(' ')[0]}`}>{result.grade}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-border text-center">
                  <p className="text-xs text-text-muted mb-1">Rank</p>
                  <p className="font-mono font-bold text-primary">#{result.rank}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-border text-center">
                  <p className="text-xs text-text-muted mb-1">Status</p>
                  <p className={`font-bold text-sm ${result.isPassed ? "text-green-600" : "text-red-600"}`}>
                    {result.isPassed ? "PASSED" : "FAILED"}
                  </p>
                </div>
              </div>

              <Link
                href={`/parent/results`} // Note: For a real app, you might link to a detailed parent view, but the prompt spec relies on the main student view logic or just showing summaries. We will use a simple alert or redirect to student's results if possible. For now, it stays as summary.
                className="w-full py-2.5 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  // The prompt didn't request a detailed subject-wise view for parents, just the page.
                  // But we can just show a toast that detailed view is coming soon, or it's enough.
                  toast.success("Detailed view would open here");
                }}
              >
                View Detailed Report <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
