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
          <span className="font-medium text-slate-800 block">{item.studentName}</span>
          <span className="text-xs text-slate-500">{item.className} | Roll: {item.rollNo}</span>
        </div>
      )
    },
    {
      header: "Fee Type",
      accessorKey: "feeType",
      cell: (item: any) => <span className="text-sm font-medium text-slate-700">{item.feeType}</span>
    },
    {
      header: "Total Due",
      accessorKey: "amount",
      cell: (item: any) => (
        <div>
          <span className="font-bold text-slate-800">₹{(item.amount + item.lateFine).toLocaleString('en-IN')}</span>
          {item.lateFine > 0 && <span className="text-[10px] block text-red-500 font-bold">+₹{item.lateFine} Fine</span>}
        </div>
      )
    },
    {
      header: "Paid / Outst.",
      accessorKey: "paidAmount",
      cell: (item: any) => (
        <div className="flex flex-col">
          <span className="text-sm text-emerald-600 font-semibold">P: ₹{item.paidAmount.toLocaleString('en-IN')}</span>
          <span className="text-sm text-red-500 font-semibold">O: ₹{item.outstanding.toLocaleString('en-IN')}</span>
        </div>
      )
    },
    {
      header: "Due Date",
      accessorKey: "dueDate",
      cell: (item: any) => <span className="text-sm text-slate-600">{new Date(item.dueDate).toLocaleDateString('en-GB')}</span>
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item: any) => {
        const styles: any = {
          PAID: "bg-emerald-100 text-emerald-700",
          PARTIAL: "bg-indigo-100 text-indigo-700",
          PENDING: "bg-slate-100 text-slate-700",
          'DUE SOON': "bg-amber-100 text-amber-700",
          OVERDUE: "bg-red-100 text-red-700",
          UNPAID: "bg-slate-100 text-slate-700"
        };
        return (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${styles[item.status] || 'bg-slate-100'}`}>
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
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
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
          <h1 className="text-2xl font-bold text-slate-800">Fee Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track collections, dues, and parent payments</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Generate Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Collection</p>
              <p className="text-2xl font-black text-slate-800 mt-1">₹{stats.totalCollection.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee className="w-5 h-5" /></div>
          </div>
          <p className="text-xs font-medium text-emerald-600 mt-3">+₹{stats.thisMonthCollection.toLocaleString('en-IN')} this month</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">School-wide Outstanding</p>
              <p className="text-2xl font-black text-amber-600 mt-1">₹{stats.outstandingAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Transport Revenue</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">₹{stats.transportCollection.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Truck className="w-5 h-5" /></div>
          </div>
        </div>

        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Defaulters (&gt;30 Days)</p>
              <p className="text-2xl font-black text-red-700 mt-1">{stats.defaulterCount} Students</p>
            </div>
            <div className="p-2 bg-red-100 text-red-700 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
          <button 
            onClick={() => setActiveTab('ALL')}
            className={`font-semibold text-sm pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'ALL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            All Invoices
          </button>
          <button 
            onClick={() => setActiveTab('DEFAULTERS')}
            className={`font-semibold text-sm pb-4 -mb-4 border-b-2 transition-colors ${activeTab === 'DEFAULTERS' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
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
