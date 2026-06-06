"use client";

import { useState } from "react";
import DataTable from "@/components/shared/DataTable";
import { IndianRupee, Plus, Filter, Download, AlertTriangle, Truck } from "lucide-react";
import toast from "react-hot-toast";

interface AdminFeesClientProps {
  data: any[];
  defaulters: any[];
  stats: {
    totalCollection: number;
    thisMonthCollection: number;
    transportCollection: number;
    outstandingAmount: number;
    defaulterCount: number;
  };
}

export default function AdminFeesClient({ data, stats, defaulters }: AdminFeesClientProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'DEFAULTERS'>('ALL');

  const handleCreateInstallment = async (feeRecordId: string) => {
    const months = prompt("Enter number of months for installment plan (e.g., 3):");
    if (!months || isNaN(parseInt(months)) || parseInt(months) < 2) {
      toast.error("Valid months required (min 2)");
      return;
    }

    try {
      const res = await fetch('/api/admin/fees/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeRecordId, totalMonths: parseInt(months) })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(result.message);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to create installment plan");
    }
  };

  const columns = [
    {
      header: "Student Name",
      accessorKey: "studentName",
      cell: (item: any) => (
        <div>
          <span className="font-medium text-text-primary block">{item.studentName}</span>
          <span className="text-xs text-text-secondary">{item.className} | Roll: {item.rollNo}</span>
        </div>
      )
    },
    {
      header: "Fee Type",
      accessorKey: "feeType",
      cell: (item: any) => <span className="text-sm font-medium text-text-primary">{item.feeType}</span>
    },
    {
      header: "Total Due",
      accessorKey: "amount",
      cell: (item: any) => (
        <div>
          <span className="font-bold text-text-primary">₹{(item.amount + item.lateFine).toLocaleString('en-IN')}</span>
          {item.lateFine > 0 && <span className="text-[10px] block text-status-danger-text font-bold">+₹{item.lateFine} Fine</span>}
        </div>
      )
    },
    {
      header: "Paid / Outst.",
      accessorKey: "paidAmount",
      cell: (item: any) => (
        <div className="flex flex-col">
          <span className="text-sm text-status-success-text font-semibold">P: ₹{item.paidAmount.toLocaleString('en-IN')}</span>
          <span className="text-sm text-status-danger-text font-semibold">O: ₹{item.outstanding.toLocaleString('en-IN')}</span>
        </div>
      )
    },
    {
      header: "Due Date",
      accessorKey: "dueDate",
      cell: (item: any) => <span className="text-sm text-text-secondary">{new Date(item.dueDate).toLocaleDateString('en-GB')}</span>
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item: any) => {
        const styles: any = {
          PAID: "bg-status-success-bg text-status-success-text",
          PARTIAL: "bg-primary-light text-primary",
          PENDING: "bg-background text-text-secondary",
          'DUE SOON': "bg-status-warning-bg text-status-warning-text",
          OVERDUE: "bg-status-danger-bg text-status-danger-text",
          UNPAID: "bg-background text-text-secondary"
        };
        return (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${styles[item.status] || 'bg-background'}`}>
            {item.status}
          </span>
        );
      }
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (item: any) => (
        item.status !== 'PAID' ? (
          <button 
            onClick={() => handleCreateInstallment(item.id)}
            className="text-xs font-bold text-primary hover:text-primary-dark underline"
          >
            Split Installments
          </button>
        ) : null
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Fee Management</h1>
          <p className="text-sm text-text-secondary mt-1">Track collections, dues, and parent payments</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-border bg-surface hover:bg-surface-hover text-text-primary px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Generate Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Total Collection</p>
              <p className="text-2xl font-black text-text-primary mt-1">₹{stats.totalCollection.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-2 bg-status-success-bg text-status-success-text rounded-lg"><IndianRupee className="w-5 h-5" /></div>
          </div>
          <p className="text-xs font-medium text-status-success-text mt-3">+₹{stats.thisMonthCollection.toLocaleString('en-IN')} this month</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider">School-wide Outstanding</p>
              <p className="text-2xl font-black text-status-warning-text mt-1">₹{stats.outstandingAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Transport Revenue</p>
              <p className="text-2xl font-black text-primary mt-1">₹{stats.transportCollection.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-2 bg-primary-light text-primary rounded-lg"><Truck className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="bg-status-danger-bg p-5 rounded-2xl border border-status-danger/10 shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-status-danger-text font-bold uppercase tracking-wider">Defaulters (&gt;30 Days)</p>
              <p className="text-2xl font-black text-status-danger mt-1">{stats.defaulterCount} Students</p>
            </div>
            <div className="p-2 bg-status-danger/10 text-status-danger rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl shadow-card overflow-hidden p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <button 
            onClick={() => setActiveTab('ALL')}
            className={`font-semibold text-sm pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'ALL' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            All Invoices
          </button>
          <button 
            onClick={() => setActiveTab('DEFAULTERS')}
            className={`font-semibold text-sm pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'DEFAULTERS' ? 'border-status-danger text-status-danger' : 'border-transparent text-text-secondary hover:text-text-primary'}`}
          >
            Defaulters List
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <DataTable
            data={activeTab === 'ALL' ? data : defaulters}
            columns={columns}
            searchPlaceholder="Search by student, roll no, or fee type..."
          />
        </div>
      </div>
    </div>
  );
}
