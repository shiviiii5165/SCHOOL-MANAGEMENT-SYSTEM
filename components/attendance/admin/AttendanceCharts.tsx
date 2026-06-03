"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrendData {
  date: string;
  percentage: number;
}

interface AttendanceChartsProps {
  trend: TrendData[];
}

export default function AttendanceCharts({ trend }: AttendanceChartsProps) {
  if (!trend || trend.length === 0) return null;

  const formattedTrend = trend.map(t => {
    const d = new Date(t.date);
    return {
      ...t,
      displayDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    };
  });

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card mb-6">
      <h3 className="text-lg font-display font-semibold text-text-primary mb-6">School-wide Trend (30 Days)</h3>
      <div className="w-full overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
        <div className="min-w-[600px] h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedTrend}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} dy={10} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} dx={-10} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "13px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                formatter={(value: number) => [`${value}%`, "Avg Attendance"]}
              />
              <Area type="monotone" dataKey="percentage" stroke="#16A34A" strokeWidth={3} fill="url(#colorTrend)" dot={{ r: 4, fill: "#16A34A", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
