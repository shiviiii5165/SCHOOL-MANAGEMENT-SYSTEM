import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import MetricCard from "@/components/dashboard/MetricCard";
import { Users, UserCheck, IndianRupee, BellDot } from "lucide-react";

const getMetricsData = unstable_cache(
  async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalStudents,
      todayAttendanceCount,
      presentCount,
      totalClassesCount,
      classesMarked,
      pendingActionsCount,
      feeCollectionAgg
    ] = await Promise.all([
      prisma.student.count(),
      prisma.attendance.count({
        where: { date: { gte: today, lt: tomorrow } }
      }),
      prisma.attendance.count({
        where: { date: { gte: today, lt: tomorrow }, status: 'PRESENT' }
      }),
      prisma.class.count(),
      prisma.dailyAttendanceLog.count({
        where: { date: { gte: today, lt: tomorrow } }
      }),
      prisma.disciplineReport.count({
        where: { status: 'PENDING' }
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' }
      })
    ]);

    const attendancePercentage = todayAttendanceCount > 0 
      ? Math.round((presentCount / todayAttendanceCount) * 100) 
      : 100;
      
    const totalFeeCollection = feeCollectionAgg._sum.amount || 0;

    return {
      totalStudents,
      attendancePercentage,
      classesMarked,
      totalClassesCount,
      pendingActionsCount,
      totalFeeCollection
    };
  },
  ['admin-dashboard-metrics'],
  { revalidate: 60 } // Cache for 60 seconds
);

export default async function DashboardMetrics() {
  const data = await getMetricsData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Students"
        value={data.totalStudents}
        icon={<Users className="w-5 h-5 text-role-student" />}
        iconBg="bg-role-student/10"
        trend={{ value: 0, direction: "up", label: "Live data" }}
      />
      <MetricCard
        title="Attendance Today"
        value={`${data.attendancePercentage}%`}
        icon={<UserCheck className="w-5 h-5 text-status-success-text" />}
        iconBg="bg-status-success-bg"
        trend={{ value: 0, direction: "up", label: `${data.classesMarked}/${data.totalClassesCount} classes marked today` }}
      />
      <MetricCard
        title="Fee Collection"
        value={`₹${(data.totalFeeCollection / 100000).toFixed(2)}L`}
        icon={<IndianRupee className="w-5 h-5 text-role-teacher" />}
        iconBg="bg-role-teacher/10"
        trend={{ value: 5.4, direction: "up", label: "vs last month" }}
      />
      <MetricCard
        title="Pending Actions"
        value={data.pendingActionsCount}
        icon={<BellDot className="w-5 h-5 text-status-warning-text" />}
        iconBg="bg-status-warning-bg"
        trend={{ value: 0, direction: "up", label: "Live data" }}
      />
    </div>
  );
}
