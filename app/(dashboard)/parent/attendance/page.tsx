"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ChildSummaryCard from "@/components/attendance/parent/ChildSummaryCard";
import AttendanceOverviewCards from "@/components/attendance/student/AttendanceOverviewCards";
import ProgressRing from "@/components/attendance/student/ProgressRing";
import AttendanceCalendar from "@/components/attendance/student/AttendanceCalendar";
import AttendanceHistoryTable from "@/components/attendance/student/AttendanceHistoryTable";
import LowAttendanceWarning from "@/components/attendance/student/LowAttendanceWarning";
import DetentionBanner from "@/components/attendance/student/DetentionBanner";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const AttendancePieChart = dynamic(
  () => import("@/components/attendance/student/AttendancePieChart"),
  { ssr: false, loading: () => <div className="h-64 bg-surface animate-pulse rounded-xl" /> }
);
import { useRealtimeAttendance } from "@/hooks/useRealtimeAttendance";

export default function ParentAttendancePage() {
  const { data: session } = useSession();
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Connect to real-time events for this parent
  useRealtimeAttendance(session?.user?.id ? `PARENT_${session.user.id}` : undefined);

  useEffect(() => {
    async function fetchChildren() {
      // Note: A specific API for parents to fetch their children's data is needed.
      // Assuming we have `/api/parent/children` returning an array of student IDs
      try {
        const res = await fetch(`/api/parent/children`);
        if (res.ok) {
          const { children } = await res.json();
          if (children && children.length > 0) {
            
            // Fetch detailed attendance for each child
            const detailedData = await Promise.all(
              children.map(async (child: any) => {
                const [summaryRes, historyRes] = await Promise.all([
                  fetch(`/api/attendance/student/${child.id}/summary`),
                  fetch(`/api/attendance/student/${child.id}/history`),
                ]);
                const summaryData = await summaryRes.json();
                const historyData = await historyRes.json();
                
                // Find today's status
                const today = new Date().toISOString().split('T')[0];
                const todayRecord = historyData.records?.find((r: any) => r.date.startsWith(today));

                return {
                  ...child,
                  summary: summaryData.summary,
                  studentDetails: summaryData.student,
                  history: historyData.records || [],
                  todayStatus: todayRecord ? todayRecord.status : undefined
                };
              })
            );
            
            setChildrenData(detailedData);
            setSelectedChildId(detailedData[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load children data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchChildren();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (childrenData.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="text-text-secondary">No linked children found.</p>
      </div>
    );
  }

  const selectedChild = childrenData.find(c => c.id === selectedChildId);
  if (!selectedChild || !selectedChild.summary) return null;

  const percentage = selectedChild.summary.attendancePercentage;
  const isDetained = !selectedChild.studentDetails?.examEligible;

  return (
    <div className="space-y-6 max-w-content mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">Child Attendance</h1>
        <p className="text-sm text-text-secondary mt-1">Monitor your child's attendance records</p>
      </div>

      {childrenData.length > 1 && (
        <div className="flex gap-2 border-b border-border pb-1">
          {childrenData.map(child => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                selectedChildId === child.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-text-muted hover:text-text-primary hover:border-border"
              }`}
            >
              {child.user.name} — {child.class.name}{child.class.section}
            </button>
          ))}
        </div>
      )}

      <ChildSummaryCard
        name={selectedChild.user.name}
        className={`${selectedChild.class.name} - ${selectedChild.class.section}`}
        rollNo={selectedChild.rollNo}
        regId={selectedChild.user.regId}
        avatar={selectedChild.user.avatar}
        todayStatus={selectedChild.todayStatus}
        percentage={percentage}
      />

      <DetentionBanner isDetained={isDetained} percentage={percentage} reason={selectedChild.studentDetails?.detainedReason} />
      {!isDetained && <LowAttendanceWarning percentage={percentage} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <AttendanceOverviewCards
            total={selectedChild.summary.totalClasses}
            present={selectedChild.summary.presentCount}
            absent={selectedChild.summary.absentCount}
            percentage={percentage}
          />
          <div className="bg-surface border border-border rounded-xl p-8 flex justify-center shadow-card">
            <ProgressRing percentage={percentage} total={selectedChild.summary.totalClasses} />
          </div>
          <AttendancePieChart
            present={selectedChild.summary.presentCount}
            absent={selectedChild.summary.absentCount}
            late={selectedChild.summary.lateCount}
          />
        </div>
        <div className="lg:col-span-7 space-y-6">
          <AttendanceCalendar records={selectedChild.history} />
          <AttendanceHistoryTable records={selectedChild.history} />
        </div>
      </div>
    </div>
  );
}
