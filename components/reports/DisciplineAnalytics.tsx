"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Loader2, ShieldAlert, AlertTriangle, UserX, Clock, IndianRupee } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";

interface DisciplineAnalyticsProps {
  data: any;
  isLoading: boolean;
}

const PIE_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']; 

export default function DisciplineAnalytics({ data, isLoading }: DisciplineAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dummy data for new layout
  const violationCategoryChart = [
    { name: 'Late Arrival', value: 45 },
    { name: 'Dress Code', value: 30 },
    { name: 'Disruptive Behavior', value: 15 },
    { name: 'Academic Dishonesty', value: 5 },
  ];

  const suspensionTrendChart = [
    { name: 'Jan', count: 2 },
    { name: 'Feb', count: 4 },
    { name: 'Mar', count: 1 },
    { name: 'Apr', count: 3 },
    { name: 'May', count: 0 },
    { name: 'Jun', count: 5 },
  ];

  const recentIncidents = [
    { student: 'Aryan Khan', class: '10-B', category: 'Academic Dishonesty', date: '27 May 2026', status: 'Pending Review', severity: 'High' },
    { student: 'Kriti Sanon', class: '9-A', category: 'Dress Code', date: '26 May 2026', status: 'Resolved', severity: 'Low' },
    { student: 'Rohan Mehra', class: '11-Sci', category: 'Disruptive Behavior', date: '25 May 2026', status: 'Action Taken', severity: 'Medium' },
    { student: 'Simran Kaur', class: '8-B', category: 'Late Arrival', date: '25 May 2026', status: 'Resolved', severity: 'Low' },
    { student: 'Kabir Singh', class: '12-Com', category: 'Disruptive Behavior', date: '24 May 2026', status: 'Pending Review', severity: 'High' },
  ];

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'High': return 'text-status-danger-text bg-status-danger-bg';
      case 'Medium': return 'text-status-warning-text bg-status-warning-bg';
      case 'Low': return 'text-primary bg-primary-light';
      default: return 'text-text-secondary bg-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Mini Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Incidents (Month)"
          value={34}
          icon={<ShieldAlert className="w-5 h-5 text-status-warning-text" />}
          iconBg="bg-status-warning-bg"
        />
        <MetricCard
          title="Active Suspensions"
          value={3}
          icon={<UserX className="w-5 h-5 text-status-danger-text" />}
          iconBg="bg-status-danger-bg"
        />
        <MetricCard
          title="Pending Reviews"
          value={12}
          icon={<Clock className="w-5 h-5 text-primary" />}
          iconBg="bg-primary-light"
        />
        <MetricCard
          title="Most Frequent Violation"
          value="Late Arrival"
          icon={<AlertTriangle className="w-5 h-5 text-role-teacher" />}
          iconBg="bg-role-teacher/10"
        />
        <MetricCard
          title="Fines Collected (Month)"
          value="₹12,500"
          icon={<IndianRupee className="w-5 h-5 text-status-success-text" />}
          iconBg="bg-status-success-bg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Violations by Category */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary mb-6">Violations by Category</h3>
          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationCategoryChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  isAnimationActive={true}
                >
                  {violationCategoryChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} incidents`, 'Count']}
                />
                <Legend verticalAlign="bottom" height={72} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Suspension Trends */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary mb-6">Suspension Trends (Last 6 Months)</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={suspensionTrendChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'var(--color-background)' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [value, 'Suspensions']}
                />
                <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border">
          <h3 className="font-display font-semibold text-text-primary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-status-warning-text" />
            Recent Disciplinary Incidents
          </h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Student</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Class</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Severity</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentIncidents.map((incident, i) => (
                <tr key={i} className="hover:bg-background/50 transition-colors">
                  <td className="p-4 text-sm text-text-secondary">{incident.date}</td>
                  <td className="p-4 font-medium text-text-primary">{incident.student}</td>
                  <td className="p-4 text-sm text-text-secondary">{incident.class}</td>
                  <td className="p-4 text-sm font-medium text-text-primary">{incident.category}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold border ${
                      incident.status === 'Resolved' ? 'bg-status-success-bg text-status-success-text border-status-success-text/20' : 
                      incident.status === 'Action Taken' ? 'bg-status-warning-bg text-status-warning-text border-status-warning-text/20' :
                      'bg-status-danger-bg text-status-danger-text border-status-danger-text/20'
                    }`}>
                      {incident.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
