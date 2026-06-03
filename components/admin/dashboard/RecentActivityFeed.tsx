import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import Link from "next/link";

const getRecentActivity = unstable_cache(
  async () => {
    const [recentPayments, recentReports, recentAdmissions] = await Promise.all([
      prisma.payment.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { student: { include: { user: true, class: true } } }
      }),
      prisma.disciplineReport.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { student: { include: { user: true, class: true } }, teacher: { include: { user: true } } }
      }),
      prisma.student.findMany({
        take: 3,
        orderBy: { admissionDate: 'desc' },
        include: { user: true, class: true }
      })
    ]);

    const activity = [
      ...recentPayments.map(p => ({ 
        type: 'FEE', 
        title: 'Fee Payment', 
        desc: `₹${p.amount} by ${p.student?.user?.name}`, 
        time: p.createdAt.toISOString(), 
        color: 'bg-status-success' 
      })),
      ...recentReports.map(d => ({ 
        type: 'DISCIPLINE', 
        title: 'Discipline Report', 
        desc: `Submitted by ${d.teacher?.user?.name || 'Staff'}`, 
        time: d.createdAt.toISOString(), 
        color: 'bg-status-warning' 
      })),
      ...recentAdmissions.map(a => ({ 
        type: 'ADMISSION', 
        title: 'New Admission', 
        desc: `${a.user?.name} (Class ${a.class?.name}-${a.class?.section})`, 
        time: a.admissionDate.toISOString(), 
        color: 'bg-role-student' 
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    return activity;
  },
  ['admin-dashboard-activity'],
  { revalidate: 60 }
);

export default async function RecentActivityFeed() {
  const recentActivity = await getRecentActivity();

  return (
    <div className="bg-surface p-6 rounded-xl shadow-card border border-border h-full">
      <h3 className="font-display font-semibold text-lg text-text-primary mb-6">Recent Activity</h3>
      <div className="space-y-6">
        {recentActivity.map((activity, i) => {
          const timeAgo = Math.floor((new Date().getTime() - new Date(activity.time).getTime()) / 60000);
          const timeString = timeAgo < 60 
            ? `${timeAgo} mins ago` 
            : timeAgo < 1440 
              ? `${Math.floor(timeAgo/60)} hours ago` 
              : `${Math.floor(timeAgo/1440)} days ago`;
              
          return (
            <div key={i} className="flex gap-4">
              <div className="relative mt-1">
                <div className={`w-2.5 h-2.5 rounded-full ${activity.color} z-10 relative`} />
                {i !== recentActivity.length - 1 && <div className="absolute top-2.5 left-[4px] w-px h-full bg-border" />}
              </div>
              <div>
                <h4 className="text-sm font-medium text-text-primary">{activity.title}</h4>
                <p className="text-xs text-text-muted mt-0.5">{activity.desc}</p>
                <span className="text-[11px] text-text-muted mt-1 block">{timeString}</span>
              </div>
            </div>
          );
        })}
        {recentActivity.length === 0 && <p className="text-sm text-text-muted">No recent activity.</p>}
      </div>
      <Link href="/admin/activity" className="text-sm text-primary font-medium hover:underline mt-6 block text-center">
        View All Activity
      </Link>
    </div>
  );
}
