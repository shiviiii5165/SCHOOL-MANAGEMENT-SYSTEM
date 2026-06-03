"use client";

import { Users, IndianRupee, GraduationCap, ShieldAlert, TrendingUp, TrendingDown } from "lucide-react";

interface TopAnalyticsCardsProps {
  data: any;
  isLoading: boolean;
}

export default function TopAnalyticsCards({ data, isLoading }: TopAnalyticsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-6 shadow-sm animate-pulse">
            <div className="w-12 h-12 rounded-lg mb-4 bg-border/50" />
            <div className="w-24 h-4 mb-2 bg-border/50 rounded" />
            <div className="w-16 h-8 bg-border/50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const { attendance, fees, academic, discipline } = data;

  const isAttendanceGood = attendance.percentage >= 75;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Attendance */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-primary-light/50 p-3 rounded-lg text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${isAttendanceGood ? 'text-status-success' : 'text-status-danger'}`}>
            {isAttendanceGood ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {attendance.trend}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-text-secondary">Average Attendance</p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-3xl font-display font-bold text-text-primary">
              {attendance.percentage.toFixed(1)}%
            </h3>
          </div>
        </div>
      </div>

      {/* Fees */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-status-success-bg p-3 rounded-lg text-status-success-text">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-text-muted">Pending Dues</span>
            <span className="text-sm font-bold text-status-danger-text">₹{fees.pending.toLocaleString()}</span>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-text-secondary">Fee Collection</p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-3xl font-display font-bold text-text-primary">
              ₹{fees.collected.toLocaleString()}
            </h3>
            <span className="text-sm text-text-muted mb-1 block">({fees.collectionPercentage.toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* Academic */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-role-parent/10 p-3 rounded-lg text-role-parent">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="text-xs bg-surface border border-border px-2 py-1 rounded-md text-text-muted font-medium">
            Pass {academic.passPercentage.toFixed(0)}%
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-text-secondary">Avg. Academic Score</p>
          <div className="flex items-end gap-2 mt-1">
            <h3 className="text-3xl font-display font-bold text-text-primary">
              {academic.averagePercentage.toFixed(1)}%
            </h3>
          </div>
        </div>
      </div>

      {/* Discipline */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-status-warning-bg p-3 rounded-lg text-status-warning-text">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Suspended</span>
            <span className="text-sm font-bold text-status-danger">{discipline.suspendedStudentsCount} Students</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-secondary">Pending Reports</p>
            <h3 className="text-3xl font-display font-bold text-text-primary mt-1">
              {discipline.pending}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted mb-1">Resolved</p>
            <span className="text-lg font-semibold text-status-success-text">{discipline.resolved}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
