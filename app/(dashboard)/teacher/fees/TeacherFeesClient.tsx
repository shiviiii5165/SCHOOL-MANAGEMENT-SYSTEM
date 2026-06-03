"use client";

import DataTable from "@/components/shared/DataTable";
import { AlertCircle, IndianRupee } from "lucide-react";

interface TeacherFeesClientProps {
  data: any[];
  defaultersCount: number;
  pendingCount: number;
}

export default function TeacherFeesClient({ data, defaultersCount, pendingCount }: TeacherFeesClientProps) {
  const columns = [
    {
      header: "Student Name",
      accessorKey: "name",
      cell: (item: any) => (
        <div>
          <span className="font-medium text-slate-800 block">{item.name}</span>
          <span className="text-xs text-slate-500">Roll: {item.rollNo}</span>
        </div>
      )
    },
    {
      header: "Class",
      accessorKey: "className",
      cell: (item: any) => <span className="text-sm font-medium text-slate-700">{item.className}</span>
    },
    {
      header: "Pending Dues",
      accessorKey: "totalPending",
      cell: (item: any) => (
        <span className={`font-bold ${item.isDefaulter ? 'text-red-600' : 'text-slate-800'}`}>
          ₹{item.totalPending.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: "Status Flag",
      accessorKey: "isDefaulter",
      cell: (item: any) => (
        item.isDefaulter ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" /> DEFAULTER
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
            <IndianRupee className="w-3 h-3" /> PENDING
          </span>
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Class Fee Summary</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor pending fees for students in your class</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 shadow-sm">
          <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Students with Pending Dues</p>
          <p className="text-2xl font-black text-amber-800 mt-1">{pendingCount} Students</p>
        </div>
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
          <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Defaulters (&gt;30 Days Overdue)</p>
          <p className="text-2xl font-black text-red-700 mt-1">{defaultersCount} Students</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6">
        <DataTable
          data={data}
          columns={columns}
          searchPlaceholder="Search by student name or roll no..."
          emptyStateIcon={IndianRupee}
          emptyStateTitle="All Clear!"
          emptyStateDesc="There are no pending dues for any student in your class."
        />
      </div>
    </div>
  );
}
