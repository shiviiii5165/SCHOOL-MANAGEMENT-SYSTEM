"use client";

interface AttendanceRecord {
  date: string;
  status: string;
}

interface AttendanceHistoryTableProps {
  records: AttendanceRecord[];
}

const statusBadge = (status: string) => {
  switch (status) {
    case "PRESENT":
      return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]">Present</span>;
    case "ABSENT":
      return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">Absent</span>;
    case "LATE":
      return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">Late</span>;
    case "BLOCKED":
      return <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">Blocked</span>;
    default:
      return <span className="px-2.5 py-0.5 text-[11px] rounded-full bg-gray-100 text-gray-500">{status}</span>;
  }
};

export default function AttendanceHistoryTable({ records }: AttendanceHistoryTableProps) {
  if (!records || records.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-sm text-text-muted">No attendance records found</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-display font-semibold text-text-primary">Recent Attendance History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background">
              <th className="text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider px-4 py-2.5">Date</th>
              <th className="text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider px-4 py-2.5">Day</th>
              <th className="text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, i) => {
              const d = new Date(record.date);
              const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
              const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
              return (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors" style={{ height: "44px" }}>
                  <td className="px-4 py-2 font-mono text-sm text-text-primary">{dateStr}</td>
                  <td className="px-4 py-2 text-sm text-text-secondary">{dayName}</td>
                  <td className="px-4 py-2">{statusBadge(record.status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
