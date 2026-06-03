"use client";

import DataTable from "@/components/shared/DataTable";
import { GraduationCap, Plus, Filter } from "lucide-react";

interface AdminClassesClientProps {
  data: any[];
}

export default function AdminClassesClient({ data }: AdminClassesClientProps) {
  const columns = [
    {
      header: "Class Name",
      accessorKey: "name",
      cell: (item: any) => <span className="font-medium text-text-primary">{item.name}</span>
    },
    {
      header: "Section",
      accessorKey: "section",
      cell: (item: any) => (
        <span className="bg-primary-light text-primary font-medium px-2 py-1 rounded-md text-sm">
          {item.section}
        </span>
      )
    },
    {
      header: "Class Teacher",
      accessorKey: "classTeacher",
      cell: (item: any) => <span className="text-sm text-text-secondary">{item.classTeacher}</span>
    },
    {
      header: "Total Students",
      accessorKey: "totalStudents",
      cell: (item: any) => <span className="font-mono text-text-secondary">{item.totalStudents}</span>
    },
    {
      header: "Room No.",
      accessorKey: "roomNo",
      cell: (item: any) => <span className="text-sm text-text-secondary">{item.roomNo}</span>
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-text-primary">Classes</h1>
          <span className="bg-role-admin/10 text-role-admin text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {data.length} total
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-border bg-surface hover:bg-background text-text-primary px-4 py-2 rounded-md font-medium text-sm transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Add Class
          </button>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Search classes by name, section, teacher..."
        emptyStateIcon={GraduationCap}
        emptyStateTitle="No classes found"
        emptyStateDesc="Create your first class to get started."
        onEdit={(item) => console.log("Edit", item)}
        onView={(item) => console.log("View", item)}
      />
    </div>
  );
}
