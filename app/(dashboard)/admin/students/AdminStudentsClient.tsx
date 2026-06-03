"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import DataTable from "@/components/shared/DataTable";
import { Users, Plus, Filter, MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import FilterPanel from "@/components/students/FilterPanel";
import AddEditModal from "@/components/students/AddEditModal";
import CredentialsModal from "@/components/students/CredentialsModal";
import ViewStudentModal from "@/components/students/ViewStudentModal";
import DeleteConfirmModal from "@/components/students/DeleteConfirmModal";

interface AdminStudentsClientProps {
  data: any[];
  classes: any[];
}

export default function AdminStudentsClient({ data, classes }: AdminStudentsClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    classId: "",
    feeStatus: "",
    attendance: "",
    status: "",
    transport: ""
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [credentials, setCredentials] = useState<any>(null);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [deletingStudent, setDeletingStudent] = useState<any>(null);

  const filteredData = useMemo(() => {
    return data.filter(student => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        student.name.toLowerCase().includes(searchLower) ||
        student.regId.toLowerCase().includes(searchLower) ||
        student.rollNo.toLowerCase().includes(searchLower) ||
        (student.parentName && student.parentName.toLowerCase().includes(searchLower));
        
      if (!matchesSearch) return false;

      // Filters
      if (filters.classId && student.classId !== filters.classId) return false;
      if (filters.feeStatus && student.feeStatus !== filters.feeStatus) return false;
      if (filters.status && student.status !== filters.status) return false;
      if (filters.transport && student.hasTransport.toString() !== filters.transport) return false;
      
      if (filters.attendance) {
        if (filters.attendance === "GOOD" && student.attendance <= 75) return false;
        if (filters.attendance === "WARNING" && (student.attendance > 75 || student.attendance < 50)) return false;
        if (filters.attendance === "CRITICAL" && student.attendance >= 50) return false;
      }

      return true;
    });
  }, [data, filters, searchQuery]);

  const columns = [
    {
      header: "Student",
      accessorKey: "name",
      cell: (item: any) => (
        <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center flex-shrink-0 overflow-hidden relative">
          {item.avatar ? (
            <Image src={item.avatar} alt="Avatar" fill sizes="32px" className="object-cover" />
          ) : (
            <span className="font-medium text-text-secondary text-xs">
              {item.name.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>
          <div className="font-medium text-text-primary">{item.name}</div>
        </div>
      ),
    },
    {
      header: "Reg ID",
      accessorKey: "regId",
      cell: (item: any) => <span className="font-mono text-text-secondary text-xs">{item.regId}</span>
    },
    {
      header: "Class",
      accessorKey: "classInfo",
    },
    {
      header: "Roll No",
      accessorKey: "rollNo",
      cell: (item: any) => <span className="font-mono text-text-secondary">{item.rollNo}</span>
    },
    {
      header: "Attendance",
      accessorKey: "attendance",
      cell: (item: any) => {
        const val = item.attendance;
        let color = "bg-status-success-bg text-status-success-text";
        if (val < 75) color = "bg-status-danger-bg text-status-danger-text";
        else if (val < 90) color = "bg-status-warning-bg text-status-warning-text";
        
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
            {val}%
          </span>
        );
      }
    },
    {
      header: "Fee Status",
      accessorKey: "feeStatus",
      cell: (item: any) => {
        let color = "bg-background text-text-secondary border border-border";
        if (item.feeStatus === "PAID") color = "bg-status-success-bg text-status-success-text border border-status-success/20";
        if (item.feeStatus === "PENDING") color = "bg-status-warning-bg text-status-warning-text border border-status-warning/20";
        if (item.feeStatus === "OVERDUE") color = "bg-status-danger-bg text-status-danger-text border border-status-danger/20";
        
        return (
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wide ${color}`}>
            {item.feeStatus}
          </span>
        );
      }
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item: any) => {
        const isSuspended = item.status === "SUSPENDED" || item.status === "INACTIVE";
        return (
          <span className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wide ${
            isSuspended ? "bg-status-danger-bg text-status-danger-text" : "bg-status-success-bg text-status-success-text"
          }`}>
            {item.status}
          </span>
        );
      }
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-text-primary">Students</h1>
          <span className="bg-primary-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {filteredData.length} results
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 border border-border bg-surface hover:bg-background text-text-primary px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
            {isFilterOpen && (
              <FilterPanel 
                classes={classes} 
                filters={filters} 
                setFilters={setFilters} 
                onClose={() => setIsFilterOpen(false)} 
              />
            )}
          </div>
          <button 
            onClick={() => {
              setEditingStudent(null);
              setIsAddEditModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.values(filters).some(v => v !== "") && (
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="text-text-secondary">Active Filters:</span>
          {filters.classId && <span className="bg-surface border border-border px-2 py-1 rounded-md text-xs font-medium">Class: {classes.find(c => c.id === filters.classId)?.name}</span>}
          {filters.feeStatus && <span className="bg-surface border border-border px-2 py-1 rounded-md text-xs font-medium">Fee: {filters.feeStatus}</span>}
          {filters.attendance && <span className="bg-surface border border-border px-2 py-1 rounded-md text-xs font-medium">Attendance: {filters.attendance}</span>}
          {filters.status && <span className="bg-surface border border-border px-2 py-1 rounded-md text-xs font-medium">Status: {filters.status}</span>}
          {filters.transport && <span className="bg-surface border border-border px-2 py-1 rounded-md text-xs font-medium">Transport: {filters.transport === "true" ? "Yes" : "No"}</span>}
          <button onClick={() => setFilters({ classId: "", feeStatus: "", attendance: "", status: "", transport: "" })} className="text-primary hover:underline text-xs font-medium">Clear All</button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={filteredData}
        columns={columns}
        searchPlaceholder="Search students by name, reg ID, roll no, parent..."
        onSearchChange={setSearchQuery}
        emptyStateIcon={Users}
        emptyStateTitle="No students found"
        emptyStateDesc="Add your first student or try adjusting your search filters."
        onEdit={(item) => {
          setEditingStudent(item);
          setIsAddEditModalOpen(true);
        }}
        onView={(item) => setViewingStudent(item)}
        onDelete={(item) => setDeletingStudent(item)}
      />

      {/* Modals */}
      {isAddEditModalOpen && (
        <AddEditModal 
          isOpen={isAddEditModalOpen} 
          onClose={() => setIsAddEditModalOpen(false)} 
          classes={classes} 
          student={editingStudent}
          onSuccess={(creds) => {
            setIsAddEditModalOpen(false);
            if (!editingStudent && creds) {
              setCredentials(creds);
            } else {
              window.location.reload();
            }
          }}
        />
      )}

      {credentials && (
        <CredentialsModal 
          isOpen={!!credentials} 
          onClose={() => {
            setCredentials(null);
            window.location.reload();
          }} 
          credentials={credentials} 
        />
      )}

      {viewingStudent && (
        <ViewStudentModal 
          isOpen={!!viewingStudent} 
          onClose={() => setViewingStudent(null)} 
          student={viewingStudent} 
        />
      )}

      {deletingStudent && (
        <DeleteConfirmModal 
          isOpen={!!deletingStudent} 
          onClose={() => setDeletingStudent(null)} 
          student={deletingStudent} 
          onSuccess={() => {
            setDeletingStudent(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
