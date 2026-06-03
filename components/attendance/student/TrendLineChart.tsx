"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface TrendLineChartProps {
  data: { week: string; percentage: number }[];
}

export default function TrendLineChart({ data }: TrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 flex items-center justify-center h-[280px]">
        <p className="text-sm text-text-muted">No trend data available</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
      <h3 className="text-sm font-display font-semibold text-text-primary mb-4">Attendance Trend — Last 8 Weeks</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94A3B8" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "13px" }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, "Attendance"]}
          />
          <Area type="monotone" dataKey="percentage" stroke="#16A34A" strokeWidth={2} fill="url(#colorAttendance)" dot={{ r: 4, fill: "#16A34A" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
