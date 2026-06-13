"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import DataTable from "@/components/shared/DataTable";
import { IndianRupee, Plus, Filter, Download, AlertTriangle, Truck, ChevronDown, ChevronUp, Clock, FileText, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface AdminFeesClientProps {
  data: any[];
  defaulters: any[];
  recentPayments?: any[];
  stats: {
    totalCollection: number;
    thisMonthCollection: number;
    transportCollection: number;
    outstandingAmount: number;
    defaulterCount: number;
  };
}

export default function AdminFeesClient({ data, stats, defaulters, recentPayments = [] }: AdminFeesClientProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'DEFAULTERS'>('ALL');
  
  // Feature 1: Recent Payments
  const [isRecentExpanded, setIsRecentExpanded] = useState(true);

  // Feature 2: Quick Filter Chips
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'UNPAID' | 'PAID_TODAY' | 'OVERDUE'>('ALL');

  // DataTable state lifting
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Feature 3: Newly Paid Row Highlight
  const prevDataRef = useRef(data);
  const [newlyPaidIds, setNewlyPaidIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const newPaid = data.filter(d => 
      d.paidAmount > 0 && 
      prevDataRef.current.find((p: any) => p.id === d.id)?.paidAmount !== d.paidAmount
    );
    if (newPaid.length > 0) {
      setNewlyPaidIds(prev => {
        const next = new Set(prev);
        newPaid.forEach(d => next.add(d.id));
        return next;
      });
      newPaid.forEach(d => {
        setTimeout(() => {
          setNewlyPaidIds(prev => {
            const next = new Set(prev);
            next.delete(d.id);
            return next;
          });
        }, 30000);
      });
    }
    prevDataRef.current = data;
  }, [data]);

  // Apply Quick Filters
  const processedData = useMemo(() => {
    const baseData = activeTab === 'ALL' ? data : defaulters;
    if (quickFilter === 'ALL') return baseData;
    
    return baseData.filter(item => {
      if (quickFilter === 'UNPAID') return item.status === 'UNPAID';
      if (quickFilter === 'OVERDUE') return item.status === 'OVERDUE';
      if (quickFilter === 'PAID_TODAY') {
        if (!item.lastPaymentAt) return false;
        const today = new Date().toISOString().split('T')[0];
        const lastPaymentDate = new Date(item.lastPaymentAt).toISOString().split('T')[0];
        return today === lastPaymentDate;
      }
      return true;
    });
  }, [data, defaulters, activeTab, quickFilter]);

  // Bug Fix 1: Export CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const headers = ["Student Name", "Roll No", "Class", "Fee Type", "Total Due", "Paid", "Outstanding", "Due Date", "Status"];
    const csvRows = [headers.join(',')];

    filteredData.forEach(row => {
      const values = [
        `"${row.studentName}"`,
        `"${row.rollNo}"`,
        `"${row.className}"`,
        `"${row.feeType}"`,
        row.amount + row.lateFine,
        row.paidAmount,
        row.outstanding,
        `"${new Date(row.dueDate).toLocaleDateString('en-GB')}"`,
        `"${row.status}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bug Fix 2: Generate Invoice
  const handleGenerateInvoice = () => {
    if (filteredData.length === 0) return;
    
    let targetRows = filteredData.filter(d => selectedIds.has(d.id));
    if (targetRows.length === 0) {
      const confirmAll = window.confirm("No rows selected. Generate invoices for all currently visible rows?");
      if (!confirmAll) return;
      targetRows = filteredData;
    }

    const doc = new jsPDF();
    
    targetRows.forEach((row, index) => {
      if (index > 0) doc.addPage();
      
      // Header (Placeholder Logo)
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(14, 14, 15, 15, 'F');
      
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text("EduCore", 34, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Official Fee Invoice", 14, 38);
      
      // Invoice Details
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(`Invoice No: INV-${new Date().getFullYear()}-${row.id.slice(-6).toUpperCase()}`, 130, 22);
      doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 130, 30);

      // Student Details
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Billed To:", 14, 50);
      doc.setFontSize(11);
      doc.text(`Name: ${row.studentName}`, 14, 58);
      doc.text(`Roll No: ${row.rollNo}`, 14, 66);
      doc.text(`Class: ${row.className}`, 14, 74);

      // Table
      autoTable(doc, {
        startY: 90,
        head: [['Fee Type', 'Due Date', 'Total Due', 'Paid', 'Outstanding', 'Status']],
        body: [[
          row.feeType,
          new Date(row.dueDate).toLocaleDateString('en-GB'),
          `Rs. ${row.amount + row.lateFine}`,
          `Rs. ${row.paidAmount}`,
          `Rs. ${row.outstanding}`,
          row.status
        ]],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("This is a computer generated document. No signature is required.", 14, 280);
    });

    doc.save(`invoices_${new Date().getTime()}.pdf`);
  };

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
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">{item.studentName}</span>
            {newlyPaidIds.has(item.id) && (
              <span className="inline-flex items-center gap-1 bg-status-success-bg text-status-success-text text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                <CheckCircle2 className="w-3 h-3" /> Just paid
              </span>
            )}
          </div>
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

  const chips = [
    { label: 'All', value: 'ALL' },
    { label: 'Unpaid', value: 'UNPAID' },
    { label: 'Paid Today', value: 'PAID_TODAY' },
    { label: 'Overdue', value: 'OVERDUE' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Fee Management</h1>
          <p className="text-sm text-text-secondary mt-1">Track collections, dues, and parent payments</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 border border-border bg-surface hover:bg-surface-hover text-text-primary px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button 
            onClick={handleGenerateInvoice}
            disabled={filteredData.length === 0}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
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

        {/* Feature 1: Recent Payments Panel */}
        {activeTab === 'ALL' && recentPayments.length > 0 && (
          <div className="bg-slate-50 rounded-xl border border-border overflow-hidden">
            <button 
              onClick={() => setIsRecentExpanded(!isRecentExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2 text-text-primary font-bold">
                <Clock className="w-4 h-4 text-primary" />
                Recent Payments ({recentPayments.length})
              </div>
              {isRecentExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
            </button>
            
            {isRecentExpanded && (
              <div className="p-4 pt-0">
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="min-w-[250px] bg-white border border-border rounded-lg p-3 shadow-sm flex-shrink-0">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-status-success-text bg-status-success-bg px-2 py-1 rounded">
                          +₹{payment.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          {formatDistanceToNow(new Date(payment.paymentDate), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-semibold text-text-primary text-sm truncate">{payment.studentName}</p>
                      <p className="text-xs text-text-secondary">{payment.feeType} | Roll: {payment.rollNo}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature 2: Quick Filter Chips */}
        {activeTab === 'ALL' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter className="w-4 h-4 text-text-muted mr-2" />
            {chips.map(chip => (
              <button
                key={chip.value}
                onClick={() => setQuickFilter(chip.value as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                  quickFilter === chip.value 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-background border border-border text-text-secondary hover:text-text-primary hover:bg-border/50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-x-auto w-full">
          <DataTable
            data={processedData}
            columns={columns}
            searchPlaceholder="Search by student, roll no, or fee type..."
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onFilteredDataChange={setFilteredData}
            rowClassName={(item) => newlyPaidIds.has(item.id) ? 'bg-status-success-bg/30 border-l-4 border-l-status-success-text transition-all duration-500' : ''}
          />
        </div>
      </div>
    </div>
  );
}
