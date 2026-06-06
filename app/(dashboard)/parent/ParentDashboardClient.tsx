"use client";

import { useState } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import { Users, IndianRupee, Bell, Award, ChevronRight, GraduationCap, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";

type ChildData = {
  id: string;
  name: string;
  class: string;
  attendance: string;
  lastScore: string | null;
  isSuspended?: boolean;
  suspendedUntil?: string | null;
  suspendedReason?: string | null;
  pendingFees?: number;
  recentGrades?: { subject: string, grade: string }[];
  upcomingFees?: { type: string, title: string, statusText: string, isOverdue: boolean }[];
};

export default function ParentDashboardClient({ childrenData, parentName, newNoticesCount }: { childrenData: ChildData[], parentName: string, newNoticesCount?: number }) {
  const [selectedChild, setSelectedChild] = useState(childrenData[0] || null);

  if (!selectedChild) {
    return <div className="p-6">No children found for this parent.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Child Selector */}
      <div className="bg-gradient-to-r from-role-parent to-emerald-700 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-white shadow-dropdown relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">Welcome, {parentName}!</h1>
            <p className="text-white/80 max-w-lg">Track your children&apos;s academic progress, attendance, and fee payments.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-sm overflow-x-auto">
            {childrenData.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  selectedChild.id === child.id ? "bg-white text-role-parent shadow-sm font-bold" : "text-white hover:bg-white/10 font-medium"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                  selectedChild.id === child.id ? "bg-role-parent/10" : "bg-white/20"
                }`}>
                  {child.name.substring(0,2).toUpperCase()}
                </div>
                {child.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SUSPENSION BANNER */}
      {selectedChild.isSuspended && (
        <div className="flex gap-3 p-4 bg-warning-bg border border-warning/20 rounded-xl mb-4">
          <AlertTriangle size={20} className="text-warning flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-semibold text-warning-text">Suspension Notice</p>
            <p className="text-sm text-text-secondary">
              {selectedChild.name} is suspended until <strong>{selectedChild.suspendedUntil ? new Date(selectedChild.suspendedUntil).toLocaleDateString() : 'Unknown'}</strong>.
            </p>
            <p className="text-xs text-text-muted mt-1">Reason: {selectedChild.suspendedReason}</p>
            <button className="text-xs text-primary hover:underline mt-1">
              Contact school →
            </button>
          </div>
        </div>
      )}

      {/* Metrics for Selected Child */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Attendance"
          value={selectedChild.attendance}
          icon={<Users className="w-5 h-5 text-status-success-text" />}
          iconBg="bg-status-success-bg"
        />
        <MetricCard
          title="Last Exam Grade"
          value={selectedChild.lastScore || "N/A"}
          icon={<Award className="w-5 h-5 text-role-parent" />}
          iconBg="bg-role-parent/10"
        />
        <MetricCard
          title="Pending Fees"
          value={`₹${selectedChild.pendingFees?.toLocaleString() || 0}`}
          icon={<IndianRupee className="w-5 h-5 text-status-danger-text" />}
          iconBg="bg-status-danger-bg"
        />
        <MetricCard
          title="New Notices"
          value={newNoticesCount || 0}
          icon={<Bell className="w-5 h-5 text-primary" />}
          iconBg="bg-primary-light"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Snapshot */}
          <div className="bg-surface p-6 rounded-xl shadow-card border border-border">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-role-parent" />
              {selectedChild.name}&apos;s Academic Snapshot
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border rounded-xl p-4">
                <p className="text-sm font-medium text-text-primary mb-3">Recent Grades</p>
                <div className="space-y-3">
                  {selectedChild.recentGrades?.length ? selectedChild.recentGrades.map((rg, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{rg.subject}</span>
                      <span className="text-sm font-bold text-text-primary">{rg.grade}</span>
                    </div>
                  )) : (
                    <div className="text-sm text-text-secondary">No recent grades available.</div>
                  )}
                </div>
                <Link href="/parent/results" className="text-xs text-primary font-medium hover:underline mt-4 inline-block">View Full Report Card</Link>
              </div>

              <div className="border border-border rounded-xl p-4">
                <p className="text-sm font-medium text-text-primary mb-3">Upcoming Due Dates</p>
                <div className="space-y-3">
                  {selectedChild.upcomingFees?.length ? selectedChild.upcomingFees.map((fee, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${fee.isOverdue ? 'bg-status-danger-bg' : 'bg-status-warning-bg'} flex items-center justify-center`}>
                        <IndianRupee className={`w-4 h-4 ${fee.isOverdue ? 'text-status-danger-text' : 'text-status-warning-text'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{fee.title}</p>
                        <p className={`text-xs font-medium ${fee.isOverdue ? 'text-status-danger-text' : 'text-text-muted'}`}>{fee.statusText}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-sm text-text-secondary">No upcoming dues.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="bg-surface p-6 rounded-xl shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg text-text-primary">This Week&apos;s Attendance</h3>
              <Link href="/parent/attendance" className="text-sm text-primary font-medium hover:underline">View All</Link>
            </div>
            <div className="flex gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
                <div key={day} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-text-muted mb-2">{day}</span>
                  <div className={`w-full h-10 rounded-md flex items-center justify-center font-bold text-xs ${
                    i === 2 ? "bg-status-danger-bg text-status-danger-text" : "bg-status-success-bg text-status-success-text"
                  }`}>
                    {i === 2 ? "A" : "P"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-card border border-border">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link href="/parent/fees" className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary-light transition-colors group">
                <div className="flex items-center gap-3">
                  <IndianRupee className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-text-primary">Pay Fees</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              </Link>
              <Link href="/parent/results" className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary-light transition-colors group">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-text-primary">Report Cards</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              </Link>
              <Link href="/parent/messages" className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary-light transition-colors group">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-text-primary">Contact Teachers</span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
