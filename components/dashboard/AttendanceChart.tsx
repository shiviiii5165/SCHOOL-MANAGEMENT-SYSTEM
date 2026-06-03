"use client";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from "recharts";

const data = [
  { day: "Mon", present: 95, absent: 5, late: 2 },
  { day: "Tue", present: 92, absent: 8, late: 3 },
  { day: "Wed", present: 88, absent: 12, late: 5 },
  { day: "Thu", present: 96, absent: 4, late: 1 },
  { day: "Fri", present: 90, absent: 10, late: 4 },
  { day: "Sat", present: 85, absent: 15, late: 8 },
];

export default function AttendanceChart() {
  return (
    <div className="bg-surface p-6 rounded-xl shadow-card border border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-text-primary">Attendance Overview</h3>
        <select className="text-sm border border-border rounded-md px-2 py-1 bg-background text-text-secondary focus:outline-none focus:border-primary">
          <option>This Week</option>
          <option>Last Week</option>
        </select>
      </div>
      
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            barSize={12}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 12 }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94A3B8', fontSize: 12 }} 
            />
            <Tooltip
              cursor={{ fill: '#F8FAFC' }}
              contentStyle={{ borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              labelStyle={{ color: '#0F172A', fontWeight: '600', marginBottom: '4px' }}
            />
            <Bar dataKey="present" name="Present" fill="#16A34A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="late" name="Late" fill="#D97706" radius={[4, 4, 0, 0]} />
            <Bar dataKey="absent" name="Absent" fill="#DC2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
