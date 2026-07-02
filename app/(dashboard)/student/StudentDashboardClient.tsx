"use client";

import MetricCard from "@/components/dashboard/MetricCard";
import { FileText, Calendar, Award, Bell, Lock } from "lucide-react";
import Link from "next/link";

const formatDate = (date: Date | null) => date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export default function StudentDashboardClient({ student, unpaidFines = [] }: { student: any, unpaidFines?: any[] }) {
  return (
    <div className="space-y-6">
      {/* UNPAID FINES BANNER */}
      {unpaidFines.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-800">Unpaid Disciplinary Fines</p>
              <p className="text-sm text-orange-700 mt-0.5">
                You have {unpaidFines.length} unpaid fine(s) totaling <strong>₹{unpaidFines.reduce((sum, f) => sum + (f.fineAmount || 0), 0)}</strong>.
              </p>
              <p className="text-xs text-orange-600/80 mt-1">Please pay before the due date to avoid further restrictions.</p>
            </div>
          </div>
          <Link href="/student/fees" className="shrink-0 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors">
            Pay Now →
          </Link>
        </div>
      )}
      {/* SUSPENSION BANNER */}
      {student?.isSuspended && (
        <div className="flex gap-3 p-4 bg-status-danger-bg border border-status-danger/20 rounded-xl mb-6">
          <div className="w-10 h-10 rounded-full bg-status-danger/10 flex items-center justify-center flex-shrink-0">
            <Lock size={20} className="text-status-danger"/>
          </div>
          <div>
            <p className="text-sm font-semibold text-status-danger">Account Suspended</p>
            <p className="text-sm text-text-secondary mt-0.5">
              You are suspended from <strong>{formatDate(student.suspendedFrom)}</strong> to{' '}
              <strong>{formatDate(student.suspendedUntil)}</strong>.
            </p>
            <p className="text-xs text-text-muted mt-1">Reason: {student.suspendedReason}</p>
            <p className="text-xs text-status-success mt-1">
              ✓ Access automatically restores on {formatDate(student.suspendedUntil)}.
            </p>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-role-student to-cyan-700 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-white shadow-dropdown relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">Welcome back, {student?.user?.name || "Student"}!</h1>
            <p className="text-white/80 max-w-lg">You have 2 pending assignments due this week. Keep up the good work!</p>
          </div>
          <div className="shrink-0 bg-white/20 backdrop-blur-md rounded-xl p-4 text-center min-w-[120px]">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1">Attendance</p>
            <p className="text-3xl font-display font-bold">{student?.attendancePercentage?.toFixed(0) || 100}%</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Upcoming Classes"
          value={3}
          icon={<Calendar className="w-5 h-5 text-role-student" />}
          iconBg="bg-role-student/10"
        />
        <MetricCard
          title="Pending Assignments"
          value={2}
          icon={<FileText className="w-5 h-5 text-status-warning-text" />}
          iconBg="bg-status-warning-bg"
        />
        <MetricCard
          title="Recent Results"
          value="1 New"
          icon={<Award className="w-5 h-5 text-status-success-text" />}
          iconBg="bg-status-success-bg"
        />
        <MetricCard
          title="Unread Notices"
          value={4}
          icon={<Bell className="w-5 h-5 text-primary" />}
          iconBg="bg-primary-light"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl shadow-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-text-primary">Today&apos;s Classes</h3>
            <Link href="/student/exams" className="text-sm text-primary font-medium hover:underline">Full Timetable</Link>
          </div>
          <div className="space-y-4">
            {[
              { time: "08:30 AM", subject: "Mathematics", teacher: "Rajesh Singh", room: "Room 101", status: "completed" },
              { time: "09:30 AM", subject: "English", teacher: "Anita Desai", room: "Room 101", status: "completed" },
              { time: "10:30 AM", subject: "Chemistry", teacher: "Vikram Malhotra", room: "Lab 1", status: "now" },
              { time: "11:30 AM", subject: "Physics", teacher: "Ravi Sharma", room: "Lab 2", status: "upcoming" },
            ].map((cls, i) => (
              <div key={i} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-colors ${
                cls.status === "now" ? "border-primary bg-primary-light/30 shadow-sm" : "border-border hover:border-primary/50"
              }`}>
                <div className={`w-2 h-12 rounded-full ${
                  cls.status === "completed" ? "bg-status-success" : 
                  cls.status === "now" ? "bg-primary animate-pulse" : "bg-border-strong"
                }`} />
                <div className="w-16 sm:w-20 shrink-0">
                  <span className={`text-sm font-bold ${cls.status === "now" ? "text-primary" : "text-text-primary"}`}>{cls.time}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-text-primary">{cls.subject}</h4>
                  <p className="text-sm text-text-secondary mt-0.5">{cls.teacher} • {cls.room}</p>
                </div>
                {cls.status === "now" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-light px-2 py-1 rounded">
                    Live Now
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Due Soon */}
          <div className="bg-surface p-6 rounded-xl shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-display font-semibold text-lg text-text-primary">Due Soon</h3>
              <Link href="/student/assignments" className="text-sm text-primary font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {[
                { title: "Math Practice Set", subject: "Mathematics", due: "Tomorrow", priority: "high" },
                { title: "English Essay", subject: "English", due: "In 3 days", priority: "medium" },
              ].map((task, i) => (
                <div key={i} className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{task.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      task.priority === "high" ? "bg-status-danger-bg text-status-danger-text" : "bg-status-warning-bg text-status-warning-text"
                    }`}>
                      {task.due}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{task.subject}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-surface p-6 rounded-xl shadow-card border border-border">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/student/results" className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light transition-all group">
                <Award className="w-6 h-6 text-text-muted group-hover:text-primary mb-2 transition-colors" />
                <span className="text-xs font-medium text-text-primary">Report Card</span>
              </Link>
              <Link href="/student/notices" className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light transition-all group">
                <Bell className="w-6 h-6 text-text-muted group-hover:text-primary mb-2 transition-colors" />
                <span className="text-xs font-medium text-text-primary">Notices</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
