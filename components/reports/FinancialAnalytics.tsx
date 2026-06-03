"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Loader2, IndianRupee, TrendingUp, AlertCircle, Users } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";

interface FinancialAnalyticsProps {
  data: any;
  isLoading: boolean;
}

const PIE_COLORS = ['#16A34A', '#EAB308', '#DC2626']; // Paid, Pending, Overdue

export default function FinancialAnalytics({ data, isLoading }: FinancialAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Use dummy data if API doesn't provide the exact structure yet, to fulfill the UI requirement
  const monthlyRevenueChart = data?.monthlyRevenueChart || [
    { name: 'Jan', amount: 450000 },
    { name: 'Feb', amount: 520000 },
    { name: 'Mar', amount: 480000 },
    { name: 'Apr', amount: 610000 },
    { name: 'May', amount: 590000 },
    { name: 'Jun', amount: 650000 },
  ];

  const feeStatusData = [
    { name: 'Paid', value: 75 },
    { name: 'Pending', value: 15 },
    { name: 'Overdue', value: 10 },
  ];

  const classFeeStatus = [
    { class: '10-A', total: 30, paid: 25, pending: 3, overdue: 2, collection: 83 },
    { class: '10-B', total: 28, paid: 26, pending: 2, overdue: 0, collection: 92 },
    { class: '9-A', total: 32, paid: 20, pending: 5, overdue: 7, collection: 62 },
    { class: '9-B', total: 30, paid: 28, pending: 1, overdue: 1, collection: 93 },
    { class: '8-A', total: 29, paid: 25, pending: 4, overdue: 0, collection: 86 },
  ];

  const topDefaulters = [
    { name: "Aarav Singh", class: "10-A", amount: "₹12,500", dueSince: "10 Jan 2026", daysOverdue: 136 },
    { name: "Vivaan Patel", class: "9-A", amount: "₹9,000", dueSince: "10 Feb 2026", daysOverdue: 105 },
    { name: "Aditya Verma", class: "11-Sci", amount: "₹8,200", dueSince: "05 Mar 2026", daysOverdue: 82 },
    { name: "Arjun Das", class: "8-A", amount: "₹4,500", dueSince: "01 Apr 2026", daysOverdue: 55 },
    { name: "Kunal Mohta", class: "10-A", amount: "₹4,500", dueSince: "01 May 2026", daysOverdue: 25 },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Mini Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Collected (Month)"
          value="₹6.5L"
          icon={<IndianRupee className="w-5 h-5 text-status-success-text" />}
          iconBg="bg-status-success-bg"
        />
        <MetricCard
          title="Total Due"
          value="₹1.2L"
          icon={<TrendingUp className="w-5 h-5 text-status-warning-text" />}
          iconBg="bg-status-warning-bg"
        />
        <MetricCard
          title="Collection Rate"
          value="84%"
          icon={<IndianRupee className="w-5 h-5 text-primary" />}
          iconBg="bg-primary-light"
        />
        <MetricCard
          title="Overdue Accounts"
          value={42}
          icon={<AlertCircle className="w-5 h-5 text-status-danger-text" />}
          iconBg="bg-status-danger-bg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Collection Bar Chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary mb-6">Fee Collection (Last 6 Months)</h3>
          <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[600px] h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--color-background)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Collection']}
                  />
                  <Bar dataKey="amount" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Fee Status Pie Chart */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary mb-6">Fee Status</h3>
          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={feeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {feeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => [`${value}%`, 'Status']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class-wise Fee Status Table */}
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-display font-semibold text-text-primary">Class-wise Fee Status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Class</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Total</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Paid</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Pending</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Overdue</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Collection %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classFeeStatus.map((cls, i) => (
                  <tr key={i} className="hover:bg-background/50 transition-colors">
                    <td className="p-4 font-medium text-text-primary">{cls.class}</td>
                    <td className="p-4 text-center text-text-secondary">{cls.total}</td>
                    <td className="p-4 text-center text-status-success-text font-medium">{cls.paid}</td>
                    <td className="p-4 text-center text-status-warning-text font-medium">{cls.pending}</td>
                    <td className="p-4 text-center text-status-danger-text font-medium">{cls.overdue}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-block px-2 py-1 rounded font-bold text-sm ${cls.collection >= 85 ? 'bg-status-success-bg text-status-success-text' : cls.collection >= 75 ? 'bg-status-warning-bg text-status-warning-text' : 'bg-status-danger-bg text-status-danger-text'}`}>
                        {cls.collection}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Fee Defaulters Table */}
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-display font-semibold text-status-danger-text flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Top Fee Defaulters
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Student</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Class</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Amount Due</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topDefaulters.map((defaulter, i) => (
                  <tr key={i} className="hover:bg-background/50 transition-colors">
                    <td className="p-4 font-medium text-text-primary">{defaulter.name}</td>
                    <td className="p-4 text-sm text-text-secondary">{defaulter.class}</td>
                    <td className="p-4 font-mono font-medium text-status-danger-text">{defaulter.amount}</td>
                    <td className="p-4 text-right">
                      <span className="text-status-danger-text font-bold">{defaulter.daysOverdue} days</span>
                      <p className="text-xs text-text-muted mt-0.5">Since {defaulter.dueSince}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
