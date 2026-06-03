import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import Link from "next/link";

const getPendingDiscipline = unstable_cache(
  async () => {
    const [pendingDiscipline, pendingActionsCount] = await Promise.all([
      prisma.disciplineReport.findMany({
        where: { status: 'PENDING' },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { include: { user: true, class: true } }
        }
      }),
      prisma.disciplineReport.count({
        where: { status: 'PENDING' }
      })
    ]);

    return {
      pendingActionsCount,
      pendingDiscipline: pendingDiscipline.map(d => ({
        id: d.id,
        studentName: d.student?.user?.name || 'Unknown',
        className: `${d.student?.class?.name || ''}-${d.student?.class?.section || ''}`,
        category: d.category,
        time: d.createdAt.toISOString(),
      }))
    };
  },
  ['admin-dashboard-discipline'],
  { revalidate: 60 }
);

export default async function DisciplineCenterWidget() {
  const { pendingDiscipline, pendingActionsCount } = await getPendingDiscipline();

  return (
    <div className="bg-surface p-6 rounded-xl shadow-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-text-primary flex items-center gap-2">
          Discipline Center {pendingActionsCount > 0 && <span className="bg-status-danger-bg text-status-danger-text text-xs px-2 py-0.5 rounded-full">{pendingActionsCount} pending</span>}
        </h3>
        <Link href="/admin/discipline" className="text-sm text-primary font-medium hover:underline">View All</Link>
      </div>
      <div className="space-y-3">
        {pendingDiscipline.map((report) => {
          const initials = report.studentName.split(' ').map((n: string) => n[0]).join('').substring(0, 2);
          const dateObj = new Date(report.time);
          const isToday = dateObj.toDateString() === new Date().toDateString();
          const timeStr = isToday ? `Today, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : dateObj.toLocaleDateString();
          
          return (
            <div key={report.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-sm font-medium">{initials}</div>
                <div>
                  <h4 className="text-sm font-medium text-text-primary">{report.studentName} <span className="text-xs text-text-muted font-normal ml-1">{report.className}</span></h4>
                  <span className="text-xs text-status-warning-text bg-status-warning-bg px-2 py-0.5 rounded mt-1 inline-block">{report.category}</span>
                </div>
              </div>
              <span className="text-xs text-text-muted">{timeStr}</span>
            </div>
          );
        })}
        {pendingDiscipline.length === 0 && <p className="text-sm text-text-muted text-center py-4">No pending discipline reports.</p>}
      </div>
    </div>
  );
}
