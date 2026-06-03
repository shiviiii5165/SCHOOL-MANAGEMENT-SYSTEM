import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import Link from "next/link";

const getFeeDefaulters = unstable_cache(
  async () => {
    const feeDefaulters = await prisma.feeRecord.findMany({
      where: { status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: new Date() } },
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: {
        student: { include: { user: true, class: true } }
      }
    });

    return feeDefaulters.map(f => ({
      id: f.id,
      studentName: f.student?.user?.name || 'Unknown',
      className: `${f.student?.class?.name || ''}-${f.student?.class?.section || ''}`,
      amount: f.amount - f.paidAmount,
      dueDate: f.dueDate.toISOString(),
    }));
  },
  ['admin-dashboard-fee-defaulters'],
  { revalidate: 60 }
);

export default async function FeeDefaultersWidget() {
  const feeDefaulters = await getFeeDefaulters();

  return (
    <div className="bg-surface p-6 rounded-xl shadow-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-text-primary">Fee Defaulters</h3>
        <Link href="/admin/fees" className="text-sm text-primary font-medium hover:underline">View All</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-muted uppercase bg-background">
            <tr>
              <th className="px-4 py-2 rounded-l-lg font-medium">Student</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 rounded-r-lg font-medium text-right">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {feeDefaulters.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-text-primary">{s.studentName}</div>
                  <div className="text-xs text-text-muted">{s.className}</div>
                </td>
                <td className="px-4 py-3 font-mono text-status-danger-text">₹{s.amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right text-text-secondary">{new Date(s.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
              </tr>
            ))}
            {feeDefaulters.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-text-muted">No fee defaulters found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
