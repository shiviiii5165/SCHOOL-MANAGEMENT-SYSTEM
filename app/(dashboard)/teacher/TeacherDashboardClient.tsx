"use client";

import { useEffect, useState } from "react";
import MetricCard from "@/components/dashboard/MetricCard";
import { Users, FileText, Calendar, Clock, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function TeacherDashboardClient({ 
  todaySchedule = [], 
  stats = { students: 0, classesToday: 0 },
  markedClassIds = []
}: { 
  todaySchedule: any[];
  stats: { students: number; classesToday: number };
  markedClassIds?: string[];
}) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (start: string, end: string) => {
    if (currentTime > end) return "completed";
    if (currentTime >= start && currentTime <= end) return "ongoing";
    return "upcoming";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-role-teacher to-purple-800 rounded-2xl p-8 text-white shadow-dropdown relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-bold mb-2">Welcome back, Rajesh Singh!</h1>
          <p className="text-white/80 max-w-lg">You have {stats.classesToday} classes today. Have a great day ahead!</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Students"
          value={stats.students}
          icon={<Users className="w-5 h-5 text-role-student" />}
          iconBg="bg-role-student/10"
        />
        <MetricCard
          title="Classes Today"
          value={stats.classesToday}
          icon={<Calendar className="w-5 h-5 text-role-teacher" />}
          iconBg="bg-role-teacher/10"
        />
        <MetricCard
          title="Pending Grading"
          value={0}
          icon={<FileText className="w-5 h-5 text-status-warning-text" />}
          iconBg="bg-status-warning-bg"
        />
        <MetricCard
          title="Next Class"
          value={todaySchedule.find(s => getStatus(s.startTime, s.endTime) === "upcoming")?.startTime || "None"}
          icon={<Clock className="w-5 h-5 text-primary" />}
          iconBg="bg-primary-light"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-xl shadow-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-text-primary">Today&apos;s Schedule</h3>
            <Link href="/teacher/timetable" className="text-sm text-primary font-medium hover:underline">View Timetable</Link>
          </div>
          <div className="space-y-4">
            {todaySchedule.length === 0 ? (
              <div className="text-center py-8 text-text-muted bg-background/50 rounded-xl border border-dashed border-border">
                <p>No classes scheduled for today.</p>
              </div>
            ) : (
              todaySchedule.map((cls, i) => {
                const status = getStatus(cls.startTime, cls.endTime);
                const isMarked = markedClassIds.includes(cls.classId);
                return (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${status === "ongoing" ? "border-primary bg-primary-light/10 shadow-sm animate-pulse" : "border-border hover:border-primary/50"}`}>
                    <div className={`w-2 h-12 rounded-full ${status === "completed" ? "bg-status-success" : status === "ongoing" ? "bg-primary" : "bg-border"}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-text-primary flex items-center gap-2">
                        {cls.subject.name}
                        {status === "ongoing" && <span className="text-[10px] uppercase font-bold bg-primary text-white px-1.5 py-0.5 rounded">Live Now</span>}
                        {isMarked && <span className="text-[10px] uppercase font-bold bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded flex items-center gap-1">✓ Marked</span>}
                      </h4>
                      <p className="text-sm text-text-secondary mt-0.5">{cls.class.name} {cls.class.section} • {cls.roomNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-text-primary block">{cls.startTime} - {cls.endTime}</span>
                      <span className={`text-xs ${status === "completed" ? "text-status-success" : status === "ongoing" ? "text-primary font-semibold" : "text-text-muted"}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions & Tasks */}
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-card border border-border">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/teacher/attendance" className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light transition-all group">
                <Users className="w-6 h-6 text-text-muted group-hover:text-primary mb-2 transition-colors" />
                <span className="text-xs font-medium text-text-primary">Attendance</span>
              </Link>
              <Link href="/teacher/assignments" className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light transition-all group">
                <FileText className="w-6 h-6 text-text-muted group-hover:text-primary mb-2 transition-colors" />
                <span className="text-xs font-medium text-text-primary">Assignments</span>
              </Link>
              <Link href="/teacher/results" className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-light transition-all group">
                <BookOpen className="w-6 h-6 text-text-muted group-hover:text-primary mb-2 transition-colors" />
                <span className="text-xs font-medium text-text-primary">Results</span>
              </Link>
              <Link href="/teacher/discipline" className="flex flex-col items-center justify-center p-4 rounded-xl border border-status-danger/30 hover:border-status-danger hover:bg-status-danger-bg transition-all group">
                <div className="w-6 h-6 rounded-full bg-status-danger/10 flex items-center justify-center mb-2 group-hover:bg-status-danger transition-colors">
                  <span className="text-status-danger font-bold text-xs group-hover:text-white transition-colors">!</span>
                </div>
                <span className="text-xs font-medium text-status-danger-text">Report</span>
              </Link>
            </div>
          </div>

          <div className="bg-surface p-6 rounded-xl shadow-card border border-border">
            <h3 className="font-display font-semibold text-lg text-text-primary mb-4">Recent Submissions</h3>
            <div className="space-y-3">
              {[
                { name: "Rahul Kumar", task: "Math Worksheet", time: "10 mins ago" },
                { name: "Priya Sharma", task: "Math Worksheet", time: "1 hour ago" },
                { name: "Aman Singh", task: "Physics Lab", time: "2 hours ago" },
              ].map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-background transition-colors cursor-pointer group">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary">{sub.name}</h4>
                    <p className="text-xs text-text-muted mt-0.5">{sub.task}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{sub.time}</span>
                    <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
