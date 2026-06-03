"use client";

import useSWR from "swr";
import { CheckCircle2, Clock, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function TodayAttendanceTable() {
  const { data, error, isLoading } = useSWR("/api/attendance/today", fetcher, {
    refreshInterval: 10000, // Poll every 10 seconds
  });
  const [reminding, setReminding] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-6 bg-surface border border-border rounded-xl animate-pulse h-[400px]">Loading attendance data...</div>;
  }

  if (error || !data) {
    return <div className="p-6 bg-surface border border-border rounded-xl text-status-danger-text">Failed to load attendance data.</div>;
  }

  const submittedCount = data.filter((c: any) => c.status === "SUBMITTED").length;
  const totalClasses = data.length;

  const handleRemind = async (teacherId: string) => {
    setReminding(teacherId);
    // Dummy notification API
    setTimeout(() => {
      setReminding(null);
      alert("Reminder sent successfully!");
    }, 1000);
  };

  return (
    <div className="bg-surface rounded-xl shadow-card border border-border h-full flex flex-col">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg text-text-primary">Today's Attendance</h3>
        <span className="text-sm font-medium text-text-secondary bg-background px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-muted uppercase bg-background sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-medium">Class</th>
              <th className="px-6 py-3 font-medium">Teacher</th>
              <th className="px-6 py-3 font-medium">Time</th>
              <th className="px-6 py-3 font-medium text-center">Present</th>
              <th className="px-6 py-3 font-medium text-center">Absent</th>
              <th className="px-6 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, i: number) => (
              <tr key={i} className={`border-b border-border last:border-0 ${row.status === 'SUBMITTED' ? 'bg-white' : 'bg-status-warning-bg/30'}`}>
                <td className="px-6 py-4 font-medium text-text-primary">{row.className}</td>
                <td className="px-6 py-4">
                  <Link href={`/admin/teachers/${row.teacherId}`} className="text-primary hover:underline">
                    {row.teacherName}
                  </Link>
                </td>
                <td className="px-6 py-4 text-text-secondary">
                  {row.status === 'SUBMITTED' ? new Date(row.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-6 py-4 text-center font-medium text-status-success-text">
                  {row.status === 'SUBMITTED' ? row.present : '—'}
                </td>
                <td className="px-6 py-4 text-center font-medium text-status-danger-text">
                  {row.status === 'SUBMITTED' ? row.absent : '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  {row.status === 'SUBMITTED' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-success-bg text-status-success-text border border-status-success-text/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Submitted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-status-warning-bg text-status-warning-text border border-status-warning-text/20">
                      <Clock className="w-3.5 h-3.5" />
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">
                  No classes assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border bg-background/50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-xl">
        <div className="flex items-center gap-2">
          <div className="w-full bg-border rounded-full h-2 w-32 sm:w-48 overflow-hidden">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: `${totalClasses > 0 ? (submittedCount / totalClasses) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-medium text-text-primary">
            {submittedCount} / {totalClasses} classes submitted today
          </span>
        </div>
        
        {submittedCount < totalClasses && (
          <button 
            onClick={() => handleRemind('all')}
            disabled={reminding === 'all'}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {reminding === 'all' ? 'Sending...' : 'Send Reminder'}
          </button>
        )}
      </div>
    </div>
  );
}
