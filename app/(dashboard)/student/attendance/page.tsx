"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import AttendanceOverviewCards from "@/components/attendance/student/AttendanceOverviewCards";
import ProgressRing from "@/components/attendance/student/ProgressRing";
import AttendanceCalendar from "@/components/attendance/student/AttendanceCalendar";
import AttendanceHistoryTable from "@/components/attendance/student/AttendanceHistoryTable";
import LowAttendanceWarning from "@/components/attendance/student/LowAttendanceWarning";
import DetentionBanner from "@/components/attendance/student/DetentionBanner";
import { Loader2 } from "lucide-react";

const AttendancePieChart = dynamic(
  () => import("@/components/attendance/student/AttendancePieChart"),
  { ssr: false, loading: () => <div className="h-64 bg-surface animate-pulse rounded-xl" /> }
);
const TrendLineChart = dynamic(
  () => import("@/components/attendance/student/TrendLineChart"),
  { ssr: false, loading: () => <div className="h-64 bg-surface animate-pulse rounded-xl" /> }
);
import { useRealtimeAttendance } from "@/hooks/useRealtimeAttendance";

export default function StudentAttendancePage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Connect to real-time events for this student
  useRealtimeAttendance(session?.user?.id ? `STUDENT_${session.user.id}` : undefined);

  useEffect(() => {
    async function fetchData() {
      if (!session?.user?.id) return;
      try {
        const [summaryRes, historyRes] = await Promise.all([
          fetch(`/api/attendance/student/${session.user.id}/summary`),
          fetch(`/api/attendance/student/${session.user.id}/history`),
        ]);

        if (summaryRes.ok && historyRes.ok) {
          const summaryData = await summaryRes.json();
          const historyData = await historyRes.json();
          setData(summaryData);
          setHistory(historyData.records || []);
        }
      } catch (error) {
        console.error("Failed to load attendance data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.summary) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="text-text-secondary">No attendance data found.</p>
      </div>
    );
  }

  const { summary, student } = data;
  const isDetained = !student?.examEligible;
  const percentage = summary.attendancePercentage;

  // Transform history data for the trend chart (group by week - simplified here as daily trend)
  const trendData = [...history].reverse().map(r => {
    const d = new Date(r.date);
    return {
      week: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      percentage: r.status === "PRESENT" ? 100 : 0 // Simplified: in a real app, this would be a cumulative running average or weekly average
    };
  });

  return (
    <div className="space-y-6 max-w-content mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">Attendance Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">Detailed overview of your daily attendance and trends</p>
      </div>

      <DetentionBanner isDetained={isDetained} percentage={percentage} reason={student?.detainedReason} />
      {!isDetained && <LowAttendanceWarning percentage={percentage} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (40%) */}
        <div className="lg:col-span-5 space-y-6">
          <AttendanceOverviewCards
            total={summary.totalClasses}
            present={summary.presentCount}
            absent={summary.absentCount}
            percentage={percentage}
          />
          
          <div className="bg-surface border border-border rounded-xl p-8 flex justify-center shadow-card">
            <ProgressRing percentage={percentage} total={summary.totalClasses} />
          </div>

          <AttendancePieChart
            present={summary.presentCount}
            absent={summary.absentCount}
            late={summary.lateCount}
          />
        </div>

        {/* Right Column (60%) */}
        <div className="lg:col-span-7 space-y-6">
          <AttendanceCalendar records={history} />
          <TrendLineChart data={trendData.length > 0 ? trendData : [{ week: "No Data", percentage: 0 }]} />
          <AttendanceHistoryTable records={history} />
        </div>
      </div>
    </div>
  );
}
