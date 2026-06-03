"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import SchoolAttendanceMetrics from "@/components/attendance/admin/SchoolAttendanceMetrics";
import ClassWiseTable from "@/components/attendance/admin/ClassWiseTable";
import AttendanceRiskList from "@/components/attendance/admin/AttendanceRiskList";
import DetentionPanel from "@/components/attendance/admin/DetentionPanel";
import { Loader2 } from "lucide-react";
import { useRealtimeAttendance } from "@/hooks/useRealtimeAttendance";

const AttendanceCharts = dynamic(
  () => import("@/components/attendance/admin/AttendanceCharts"),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-surface animate-pulse rounded-xl" /> }
);

export default function AdminAttendanceAnalyticsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [detainModal, setDetainModal] = useState<{ isOpen: boolean; student: any | null }>({ isOpen: false, student: null });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Connect to real-time events for admin
  useRealtimeAttendance(session?.user?.role === 'ADMIN' ? 'ADMIN' : undefined);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/attendance/analytics/school");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDetain = async (reason: string) => {
    if (!detainModal.student) return;
    try {
      const res = await fetch(`/api/student/${detainModal.student.id}/detain`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        setDetainModal({ isOpen: false, student: null });
        setToastMsg("✅ Student detained successfully.");
        fetchAnalytics(); // Refresh
      } else {
        setToastMsg("❌ Failed to detain student.");
      }
    } catch (e) {
      setToastMsg("❌ Network error.");
    }
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLiftDetention = async (student: any) => {
    if (!confirm(`Are you sure you want to lift detention for ${student.name}?`)) return;
    try {
      const res = await fetch(`/api/student/${student.id}/lift-detention`, {
        method: 'PUT',
      });
      if (res.ok) {
        setToastMsg("✅ Detention lifted successfully.");
        fetchAnalytics(); // Refresh
      } else {
        setToastMsg("❌ Failed to lift detention.");
      }
    } catch (e) {
      setToastMsg("❌ Network error.");
    }
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">Attendance Analytics</h1>
        <p className="text-sm text-text-secondary mt-1">School-wide attendance monitoring and detention management</p>
      </div>

      <SchoolAttendanceMetrics
        schoolAvg={data.schoolAvg}
        markedClasses={data.markedClasses}
        totalClasses={data.totalClasses}
        riskCount={data.riskStudents?.length || 0}
        detainedCount={data.detainedCount}
      />

      <AttendanceCharts trend={data.dailyTrend} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ClassWiseTable classes={data.classStats} />
        <AttendanceRiskList 
          students={data.riskStudents} 
          onDetainClick={(student) => setDetainModal({ isOpen: true, student })}
          onLiftClick={handleLiftDetention}
        />
      </div>

      {detainModal.student && (
        <DetentionPanel
          isOpen={detainModal.isOpen}
          onClose={() => setDetainModal({ isOpen: false, student: null })}
          onConfirm={handleDetain}
          studentName={detainModal.student.name}
          classNameName={detainModal.student.className}
          attendance={detainModal.student.attendance}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-surface border border-border shadow-modal rounded-xl px-5 py-3 text-sm font-medium text-text-primary animate-slide-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
