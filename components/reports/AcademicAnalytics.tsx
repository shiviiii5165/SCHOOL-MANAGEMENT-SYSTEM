"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import { Loader2, GraduationCap, TrendingUp, BookOpen, Award } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";

interface AcademicAnalyticsProps {
  data: any;
  isLoading: boolean;
}

const CLASS_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AcademicAnalytics({ data, isLoading }: AcademicAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dummy data for new layout
  const subjectAverages = [
    { name: 'Mathematics', average: 78.5 },
    { name: 'Science', average: 82.1 },
    { name: 'English', average: 88.4 },
    { name: 'History', average: 75.2 },
    { name: 'Computer Sci', average: 91.0 },
  ];

  const classPerformance = [
    { class: '10-A', teacher: 'Mr. Rajesh Singh', avgScore: 84.5, topSubject: 'Computer Sci', weakestSubject: 'History', passPercent: 96 },
    { class: '10-B', teacher: 'Ms. Priya Gupta', avgScore: 79.2, topSubject: 'English', weakestSubject: 'Mathematics', passPercent: 92 },
    { class: '9-A', teacher: 'Mr. Amit Kumar', avgScore: 88.1, topSubject: 'Science', weakestSubject: 'English', passPercent: 100 },
    { class: '9-B', teacher: 'Ms. Neha Sharma', avgScore: 76.8, topSubject: 'Mathematics', weakestSubject: 'History', passPercent: 88 },
  ];

  const groupedSubjectData = [
    { subject: 'Math', '10-A': 85, '10-B': 72, '9-A': 90, '9-B': 68 },
    { subject: 'Sci', '10-A': 88, '10-B': 76, '9-A': 92, '9-B': 74 },
    { subject: 'Eng', '10-A': 82, '10-B': 88, '9-A': 85, '9-B': 79 },
    { subject: 'Hist', '10-A': 78, '10-B': 70, '9-A': 84, '9-B': 65 },
  ];

  const examTrendData = [
    { exam: 'Unit Test 1', score: 72 },
    { exam: 'Unit Test 2', score: 75 },
    { exam: 'Mid Term', score: 78 },
    { exam: 'Unit Test 3', score: 81 },
    { exam: 'Pre-Board', score: 84 },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Mini Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="School Average Score"
          value="82.4%"
          icon={<GraduationCap className="w-5 h-5 text-role-student" />}
          iconBg="bg-role-student/10"
        />
        <MetricCard
          title="Pass Percentage"
          value="94%"
          icon={<TrendingUp className="w-5 h-5 text-status-success-text" />}
          iconBg="bg-status-success-bg"
        />
        <MetricCard
          title="Top Subject"
          value="Computer Sci"
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          iconBg="bg-primary-light"
        />
        <MetricCard
          title="Top Performer Class"
          value="9-A"
          icon={<Award className="w-5 h-5 text-status-warning-text" />}
          iconBg="bg-status-warning-bg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Averages - Horizontal Bar Chart */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary mb-6">Subject Averages</h3>
          <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[400px] h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAverages} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} width={80} />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--color-background)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Average Score']}
                  />
                  <Bar dataKey="average" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Subject-wise Performance Grouped Bar Chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary mb-6">Subject-wise Performance by Class</h3>
          <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[600px] h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupedSubjectData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--color-background)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  <Bar dataKey="10-A" fill={CLASS_COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="10-B" fill={CLASS_COLORS[1]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="9-A" fill={CLASS_COLORS[2]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="9-B" fill={CLASS_COLORS[3]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class-wise Performance Table */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border">
            <h3 className="font-display font-semibold text-text-primary flex items-center gap-2">
              <Award className="w-5 h-5 text-role-parent" />
              Class-wise Performance
            </h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border">
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Class</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Teacher</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-center">Avg Score</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Top Subject</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Weakest Subject</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Pass %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classPerformance.map((cls, i) => (
                  <tr key={i} className="hover:bg-background/50 transition-colors">
                    <td className="p-4 font-bold text-text-primary">{cls.class}</td>
                    <td className="p-4 text-sm text-text-secondary">{cls.teacher}</td>
                    <td className="p-4 text-center font-bold text-primary">{cls.avgScore}%</td>
                    <td className="p-4 text-sm text-status-success-text font-medium">{cls.topSubject}</td>
                    <td className="p-4 text-sm text-status-danger-text font-medium">{cls.weakestSubject}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-block px-2 py-1 rounded font-bold text-sm ${cls.passPercent >= 90 ? 'bg-status-success-bg text-status-success-text' : 'bg-status-warning-bg text-status-warning-text'}`}>
                        {cls.passPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exam-wise Result Trend */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-display font-semibold text-text-primary mb-6">Exam-wise Trend</h3>
          <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <div className="min-w-[400px] h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={examTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="exam" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value}%`, 'Score']}
                  />
                  <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" dot={{ fill: '#10B981', r: 4 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
