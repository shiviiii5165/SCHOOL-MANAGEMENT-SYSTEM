"use client";

interface RiskStudent {
  id: string;
  name: string;
  regId: string;
  className: string;
  rollNo: string;
  attendance: number;
  examEligible: boolean;
}

interface AttendanceRiskListProps {
  students: RiskStudent[];
  onDetainClick: (student: RiskStudent) => void;
  onLiftClick: (student: RiskStudent) => void;
}

export default function AttendanceRiskList({ students, onDetainClick, onLiftClick }: AttendanceRiskListProps) {
  const getRiskBadge = (att: number) => {
    if (att < 60) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DC2626] text-white">CRITICAL</span>;
    if (att < 75) return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D97706] text-white">HIGH</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAB308] text-white">MEDIUM</span>;
  };

  return (
    <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-[#DC2626] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
          Attendance Risk List
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-left font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Roll</th>
              <th className="text-left font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Student Name</th>
              <th className="text-left font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Class</th>
              <th className="text-left font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Attendance</th>
              <th className="text-left font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Risk Level</th>
              <th className="text-right font-semibold text-text-muted uppercase tracking-wider px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b border-border last:border-0 hover:bg-background/50 transition-colors">
                <td className="px-6 py-3 font-mono text-text-secondary">{student.rollNo}</td>
                <td className="px-6 py-3 font-medium text-text-primary">
                  {student.name}
                  {student.examEligible === false && <span className="ml-2 text-[10px] bg-[#FEF2F2] text-[#DC2626] px-1.5 py-0.5 rounded border border-[#FECACA]">DETAINED</span>}
                </td>
                <td className="px-6 py-3 text-text-secondary">{student.className}</td>
                <td className="px-6 py-3 font-mono font-medium text-[#D97706]">
                  {student.attendance}% ⚠
                </td>
                <td className="px-6 py-3">{getRiskBadge(student.attendance)}</td>
                <td className="px-6 py-3 text-right">
                  {student.examEligible ? (
                    <button
                      onClick={() => onDetainClick(student)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-md transition-colors shadow-sm"
                    >
                      Detain
                    </button>
                  ) : (
                    <button
                      onClick={() => onLiftClick(student)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#64748B] bg-background border border-border hover:bg-white hover:text-text-primary rounded-md transition-colors shadow-sm"
                    >
                      Lift Detention
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-muted">No students at risk.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
