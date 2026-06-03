import { Suspense } from "react";
import DashboardMetrics from "@/components/admin/dashboard/DashboardMetrics";
import RecentActivityFeed from "@/components/admin/dashboard/RecentActivityFeed";
import DisciplineCenterWidget from "@/components/admin/dashboard/DisciplineCenterWidget";
import FeeDefaultersWidget from "@/components/admin/dashboard/FeeDefaultersWidget";
import TodayAttendanceTable from "@/components/admin/dashboard/TodayAttendanceTable";
import {
  MetricCardsSkeleton,
  RecentActivitySkeleton,
  DisciplineCenterSkeleton,
  FeeDefaultersSkeleton
} from "@/components/admin/dashboard/skeletons";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Top Section - Metric Cards */}
      <Suspense fallback={<MetricCardsSkeleton />}>
        <DashboardMetrics />
      </Suspense>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px]">
          <TodayAttendanceTable />
        </div>
        <div className="lg:col-span-1">
          <Suspense fallback={<RecentActivitySkeleton />}>
            <RecentActivityFeed />
          </Suspense>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<DisciplineCenterSkeleton />}>
          <DisciplineCenterWidget />
        </Suspense>

        <Suspense fallback={<FeeDefaultersSkeleton />}>
          <FeeDefaultersWidget />
        </Suspense>
      </div>
    </div>
  );
}
