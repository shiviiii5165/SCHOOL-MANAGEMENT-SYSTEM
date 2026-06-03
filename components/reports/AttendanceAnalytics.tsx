"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, ReferenceLine, Cell
} from 'recharts';
import { AlertTriangle, Download, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { exportToExcel } from "@/lib/exportUtils";
import DetainModal from "./DetainModal";

interface AttendanceAnalyticsProps {
  data: any;
  isLoading: boolean;
}

export default function AttendanceAnalytics({ data, isLoading }: AttendanceAnalyticsProps) {
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const detainMutation = useMutation({
    mutationFn: async ({ studentId, reason }: { studentId: string, reason: string }) => {
      const res = await fetch(`/api/student/${studentId}/detain`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error("Failed to detain");
      return res.json();
    },
    onSettled: () => setSelectedStudent(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports-attendance"] });
    }
  });

  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { classWiseAttendance, dailyTrends, lowAttendanceStudents, threshold } = data;

  const handleExport = () => {
    exportToExcel(
      lowAttendanceStudents.map((s: any) => ({
        "Registration ID": s.regId,
        "Name": s.name,
        "Class": s.className,
        "Attendance %": s.percentage.toFixed(1),
        "Status": s.isDetained ? "DETAINED" : (s.percentage < 60 ? "CRITICAL" : s.percentage < 75 ? "HIGH" : "MEDIUM")
      })),
      "Low_Attendance_Report"
    );
  };

  const getRiskLevel = (percentage: number) => {
    if (percentage < 60) return { label: "CRITICAL", color: "text-status-danger-text", dot: "bg-status-danger-bg" };
    if (percentage < 75) return { label: "HIGH", color: "text-status-warning-text", dot: "bg-status-warning-text" };
    return { label: "MEDIUM", color: "text-yellow-600", dot: "bg-yellow-100" };
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 85) return "#16A34A"; // green
    if (percentage >= 75) return "#D97706"; // amber
    return "#DC2626"; // red
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class-wise Bar Chart */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary mb-6">Class-wise Attendance %</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classWiseAttendance} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="className" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--color-background)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <ReferenceLine y={threshold} stroke="#94A3B8" strokeDasharray="3 3" label={{ position: 'top', value: 'Min Required', fill: '#94A3B8', fontSize: 10 }} />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]} maxBarSize={40} name="Attendance %">
                  {classWiseAttendance.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Trend Line Chart */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary mb-6">7-Day Attendance Trend</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EFF6FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EFF6FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="present" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" dot={{ fill: '#2563EB', r: 4 }} activeDot={{ r: 6 }} name="Present %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Table: Low Attendance */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-text-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-status-danger-text" />
              Students Below Threshold ({threshold}%)
            </h3>
            <p className="text-sm text-text-secondary mt-1">Review and enforce detention policies for these students.</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-secondary">Showing {lowAttendanceStudents.length} students below threshold</span>
            <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors">
              <Download className="w-4 h-4" />
              Export List
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Student Info</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Class</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Attendance</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Risk Level</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Status</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lowAttendanceStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary">
                    No students currently below the {threshold}% threshold.
                  </td>
                </tr>
              ) : (
                lowAttendanceStudents.map((student: any) => {
                  const risk = getRiskLevel(student.percentage);
                  return (
                    <tr key={student.id} className="hover:bg-background/50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-text-primary">{student.name}</p>
                        <p className="text-xs text-text-muted">{student.regId}</p>
                      </td>
                      <td className="p-4 text-sm text-text-secondary">{student.className}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2" title={student.percentage === 0 ? "No attendance recorded yet. Verify with teacher." : ""}>
                          <span className="font-bold text-status-danger-text">
                            {student.percentage.toFixed(1)}%
                          </span>
                          <ArrowRight className="w-3 h-3 text-status-danger-text" />
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${risk.dot}`} />
                          <span className={`text-xs font-bold ${risk.color}`}>{risk.label}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {student.isDetained ? (
                          <span className="text-xs font-bold px-2 py-1 bg-status-danger text-white rounded-full uppercase tracking-wider">Detained</span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-1 bg-background text-text-secondary border border-border rounded-full uppercase tracking-wider">At Risk</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!student.isDetained && (
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="px-3 py-1.5 bg-white border border-status-danger hover:bg-status-danger-bg text-status-danger-text text-sm font-medium rounded-lg transition-colors shadow-sm"
                          >
                            Detain Student
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DetainModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent || { id: '', name: '', regId: '', className: '', percentage: 0 }}
        threshold={threshold}
        onConfirm={(id, reason) => detainMutation.mutate({ studentId: id, reason })}
        isDetaining={detainMutation.isPending}
      />
    </div>
  );
}
