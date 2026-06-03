"use client";

import { useState, useEffect } from "react";
import { Award, ChevronRight, FileText, ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getGradeColor } from "@/lib/examUtils";

// Animated Circular Progress Ring Component
const CircularProgress = ({ percentage }: { percentage: number }) => {
  const [offset, setOffset] = useState(440); // 2 * pi * 70
  
  useEffect(() => {
    // Animate to value
    setTimeout(() => {
      setOffset(440 - (440 * percentage) / 100);
    }, 100);
  }, [percentage]);

  const color = percentage >= 50 ? "#16A34A" : percentage >= 33 ? "#D97706" : "#DC2626";

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80" cy="80" r="70"
          stroke="#E2E8F0"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="80" cy="80" r="70"
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 440,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 1s ease-out"
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono" style={{ color }}>
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export default function StudentResultsPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch("/api/student/results")
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          setSummaries(data.results);
          if (data.results.length > 0) {
            handleSelectExam(data.results[0].examId);
          }
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleSelectExam = async (examId: string) => {
    setSelectedExamId(examId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/student/results/${examId}`);
      const data = await res.json();
      if (data.summary) setExamDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading results...</div>;

  if (summaries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Results</h1>
          <p className="text-sm text-text-secondary">Track your academic performance.</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-12 text-center flex flex-col items-center shadow-card">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">No Results Published Yet</h3>
          <p className="text-text-secondary max-w-sm">Your examination results will appear here once they are published by the administration.</p>
        </div>
      </div>
    );
  }

  // Data for Recharts Trend
  const trendData = [...summaries].reverse().map(s => ({
    name: s.examName.substring(0, 10), // truncate for chart
    percentage: s.percentage
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Academic Results</h1>
        <p className="text-sm text-text-secondary">View your detailed marks, grades, and performance trends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-text-primary mb-2 px-1">Published Exams</h3>
          {summaries.map(s => (
            <button
              key={s.examId}
              onClick={() => handleSelectExam(s.examId)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedExamId === s.examId 
                  ? "bg-primary text-white border-primary shadow-md" 
                  : "bg-surface border-border hover:border-primary/50 text-text-primary"
              }`}
            >
              <h4 className="font-bold text-lg mb-1 truncate">{s.examName}</h4>
              <p className={`text-xs font-mono mb-2 ${selectedExamId === s.examId ? "text-primary-light" : "text-text-muted"}`}>
                {new Date(s.date).toLocaleDateString()}
              </p>
              <div className="flex justify-between items-center text-sm font-bold">
                <span>{s.percentage.toFixed(1)}%</span>
                <span>{s.grade}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-3 space-y-6">
          {detailLoading ? (
            <div className="bg-surface rounded-xl border border-border p-12 text-center shadow-card h-96 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : examDetail ? (
            <>
              {/* Hero Card */}
              <div className="bg-surface rounded-xl border border-border p-6 shadow-card flex flex-col md:flex-row items-center gap-8">
                <CircularProgress percentage={examDetail.summary.percentage} />
                
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">{examDetail.summary.examName}</h2>
                    <p className="text-text-secondary mt-1">Final Result Summary</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-border">
                      <p className="text-xs text-text-muted mb-1">Total Marks</p>
                      <p className="font-mono font-bold text-lg">{examDetail.summary.totalMarks} / {examDetail.summary.maxMarks}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-border">
                      <p className="text-xs text-text-muted mb-1">Overall Grade</p>
                      <p className={`font-bold text-lg ${getGradeColor(examDetail.summary.grade).split(' ')[0]}`}>{examDetail.summary.grade}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-border">
                      <p className="text-xs text-text-muted mb-1">Class Rank</p>
                      <p className="font-mono font-bold text-lg text-primary">#{examDetail.summary.rank}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-border">
                      <p className="text-xs text-text-muted mb-1">Status</p>
                      <p className={`font-bold text-lg ${examDetail.summary.isPassed ? "text-green-600" : "text-red-600"}`}>
                        {examDetail.summary.isPassed ? "PASSED" : "FAILED"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Trend Chart */}
              <div className="bg-surface rounded-xl border border-border p-6 shadow-card">
                <h3 className="font-bold text-lg text-text-primary mb-4">Performance Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="percentage" 
                        stroke="#2563EB" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#2563EB' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subject Cards Grid */}
              <div>
                <h3 className="font-bold text-lg text-text-primary mb-4 px-1">Subject-wise Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {examDetail.subjects.map((sub: any) => (
                    <div key={sub.id} className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      {/* Accent strip */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        sub.isAbsent ? "bg-slate-400" :
                        sub.marks >= sub.maxMarks * 0.9 ? "bg-emerald-500" :
                        sub.marks >= sub.maxMarks * 0.7 ? "bg-blue-500" :
                        sub.marks >= sub.maxMarks * 0.5 ? "bg-amber-500" : "bg-red-500"
                      }`} />
                      
                      <div className="flex justify-between items-start mb-4 pl-2">
                        <div>
                          <h4 className="font-bold text-text-primary text-lg">{sub.subject}</h4>
                          <p className="text-xs text-text-muted mt-0.5">Teacher: {sub.teacher}</p>
                        </div>
                        {sub.isAbsent ? (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">ABSENT</span>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(sub.grade)}`}>{sub.grade}</span>
                        )}
                      </div>

                      <div className="pl-2 space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-text-secondary">Obtained</span>
                            <span className="font-mono font-bold text-text-primary">{sub.isAbsent ? 0 : sub.marks} / {sub.maxMarks}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${sub.isAbsent ? 'bg-slate-300' : 'bg-primary'}`}
                              style={{ width: `${sub.isAbsent ? 0 : (sub.marks / sub.maxMarks) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-text-muted pt-2 border-t border-border border-dashed">
                          <span>Class Average</span>
                          <span className="font-mono font-medium">{sub.classAvg} / {sub.maxMarks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
