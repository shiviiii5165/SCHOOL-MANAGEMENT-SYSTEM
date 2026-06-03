"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AttendancePieChartProps {
  present: number;
  absent: number;
  late: number;
}

const COLORS = ["#16A34A", "#DC2626", "#D97706"];

export default function AttendancePieChart({ present, absent, late }: AttendancePieChartProps) {
  const data = [
    { name: "Present", value: present, color: "#16A34A" },
    { name: "Absent", value: absent, color: "#DC2626" },
    { name: "Late", value: late, color: "#D97706" },
  ].filter((d) => d.value > 0);

  const total = present + absent + late;

  if (total === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 flex items-center justify-center h-[280px]">
        <p className="text-sm text-text-muted">No attendance data available</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-card">
      <h3 className="text-sm font-display font-semibold text-text-primary mb-4">Attendance Breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value} days (${((value / total) * 100).toFixed(1)}%)`, name]}
            contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "13px" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", fontWeight: 500 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
