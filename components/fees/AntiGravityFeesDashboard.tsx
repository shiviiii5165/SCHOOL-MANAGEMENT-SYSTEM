"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, AlertCircle, Calendar, CreditCard, 
  DownloadCloud, HelpCircle, FileText, Smartphone, Wallet,
  Building, CheckCircle, ChevronRight, PieChart as PieChartIcon, Loader2, Clock
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip 
} from 'recharts';
import PaymentModal from './PaymentModal';

export default function AntiGravityFeesDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/fees/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.students && json.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(json.students[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!data || !data.students || data.students.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFF]">No data available.</div>;
  }

  // Filter records based on selected student (if multiple children)
  // For 'Total Outstanding', we aggregate across ALL children if parent view, but let's just do it based on selected student for simplicity, 
  // Wait, the prompt says "Total Outstanding = SUM of all unpaid+overdue invoices for their children".
  const allFeeRecords = data.feeRecords;
  const totalOutstandingAllChildren = allFeeRecords.reduce((sum: number, r: any) => sum + r.outstandingAmount, 0);
  
  const studentRecords = allFeeRecords.filter((r: any) => r.studentId === selectedStudentId);
  const student = data.students.find((s: any) => s.id === selectedStudentId);
  
  // Outstanding & Paid Stats
  const totalInvoiced = studentRecords.reduce((sum: number, r: any) => sum + r.amount + r.lateFine, 0);
  const totalPaid = studentRecords.reduce((sum: number, r: any) => sum + r.paidAmount, 0);
  const totalOutstanding = studentRecords.reduce((sum: number, r: any) => sum + r.outstandingAmount, 0);
  
  const paidPercentage = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100;

  // Breakdown for Donut Chart (based on ALL invoices for this student)
  const breakdownMap: any = {};
  studentRecords.forEach((r: any) => {
    if (!breakdownMap[r.feeType]) breakdownMap[r.feeType] = 0;
    breakdownMap[r.feeType] += r.amount;
  });

  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', '#14B8A6', '#F59E0B'];
  const feesBreakdown = Object.keys(breakdownMap).map((key, index) => ({
    name: key,
    value: breakdownMap[key],
    color: colors[index % colors.length]
  }));

  const pendingDues = studentRecords.filter((r: any) => r.dynamicStatus !== 'PAID');
  
  const overdueCount = allFeeRecords.filter((r: any) => r.dynamicStatus === 'OVERDUE').length;
  const dueSoonCount = allFeeRecords.filter((r: any) => r.dynamicStatus === 'DUE SOON').length;

  // Timeline building (Group by due date month or just show the invoices)
  // For this, let's just show top 4 upcoming/past invoices
  const timeline = studentRecords.slice().sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 4);

  const glassCard = "bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#E9EFFA] via-[#F8FAFF] to-[#E9EFFA] p-4 sm:p-8 font-sans text-slate-800 relative overflow-hidden">
      
      {paymentInvoice && (
        <PaymentModal 
          invoice={paymentInvoice} 
          wallets={data.wallets}
          onClose={() => setPaymentInvoice(null)} 
          onSuccess={() => { setPaymentInvoice(null); fetchData(); }} 
        />
      )}

      {/* Floating Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-300/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-purple-300/30 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-[2px]">
                <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xl">
                    {student?.user?.name?.charAt(0) || 'S'}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Fees Overview
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider">
                  {student?.user?.name || 'Student'}
                </span>
                {student?.hasTransport && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                    Transport Enrolled
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {data.students.length > 1 && (
              <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl border border-white/60">
                {data.students.map((s: any) => (
                  <button 
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedStudentId === s.id ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {s.user?.name?.split(' ')[0] || 'Unknown'}
                  </button>
                ))}
              </div>
            )}
            <button className="relative p-3 bg-white/60 backdrop-blur-md border border-white/60 rounded-xl hover:bg-white transition-colors text-slate-600">
              <Bell className="w-5 h-5" />
              {overdueCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
          </div>
        </header>

        {/* Smart Alert */}
        {overdueCount > 0 && (
          <div className="bg-red-50/80 backdrop-blur-md border border-red-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-red-900">
                You have <strong className="font-bold">{overdueCount} overdue</strong> invoice(s). Late fines of 2% per month are being applied. Please clear them immediately.
              </p>
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Spans 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Outstanding Summary */}
            <div className={`${glassCard} flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="flex-1 space-y-4 relative z-10 w-full">
                <div>
                  <p className="text-slate-500 font-medium text-sm">Family Total Outstanding</p>
                  <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mt-1 tracking-tight">
                    ₹{totalOutstandingAllChildren.toLocaleString()}
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                  {overdueCount > 0 && (
                    <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span>{overdueCount} Overdue</span>
                    </div>
                  )}
                  {dueSoonCount > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <span>{dueSoonCount} Due Soon</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => {
                      if (pendingDues.length > 0) setPaymentInvoice(pendingDues[0]);
                    }}
                    disabled={pendingDues.length === 0}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    Pay Next Due
                  </button>
                  <a href="/parent/fees/history" className="px-6 py-3 bg-white/50 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-white transition-all flex items-center justify-center">
                    Payment History
                  </a>
                </div>
              </div>

              {/* Circular Progress */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="40" fill="none" 
                    stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * (paidPercentage / 100))} 
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute text-center flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">{paidPercentage}%</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Paid</span>
                </div>
              </div>
            </div>

            {/* Installment Timeline */}
            <div className={glassCard}>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Payment Timeline ({student.user.name})
              </h3>
              
              <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4 overflow-x-auto pb-4">
                {/* Connecting Line */}
                <div className="absolute left-8 right-8 top-5 h-1 bg-slate-200 rounded-full z-0"></div>

                {timeline.map((inv: any, i: number) => {
                  const isPaid = inv.dynamicStatus === 'PAID';
                  const isOverdue = inv.dynamicStatus === 'OVERDUE';
                  const isPartial = inv.dynamicStatus === 'PARTIAL';
                  
                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-3 min-w-[100px]">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all ${
                        isPaid ? 'bg-green-500 text-white' : 
                        isOverdue ? 'bg-red-500 text-white ring-4 ring-red-100 shadow-red-500/40' : 
                        isPartial ? 'bg-amber-500 text-white' :
                        'bg-slate-200 text-slate-400'
                      }`}>
                        {isPaid ? <CheckCircle className="w-5 h-5" /> : 
                         isOverdue ? <AlertCircle className="w-5 h-5" /> :
                         <span className="font-bold text-sm">{i+1}</span>}
                      </div>
                      <div className="text-center">
                        <p className={`font-bold text-sm ${isOverdue ? 'text-red-600' : isPaid ? 'text-green-600' : 'text-slate-700'}`}>{inv.feeType}</p>
                        <p className="text-xs text-slate-500 font-medium">{new Date(inv.dueDate).toLocaleDateString()}</p>
                        <p className="text-xs font-semibold mt-1 text-slate-800">
                          {isPaid ? 'PAID' : `₹${inv.outstandingAmount.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices List */}
            <div className={`${glassCard} !p-0 overflow-hidden`}>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Pending Dues</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {pendingDues.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No pending dues! All clear.</div>
                ) : (
                  pendingDues.map((inv: any, i: number) => (
                    <div key={i} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4 w-full sm:w-auto">
                        <div className={`p-3 rounded-2xl shrink-0 ${
                          inv.dynamicStatus === 'OVERDUE' ? 'bg-red-100 text-red-600' : 
                          inv.dynamicStatus === 'DUE SOON' ? 'bg-amber-100 text-amber-600' : 
                          'bg-indigo-100 text-indigo-600'
                        }`}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{inv.feeType} Fee</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                            <span className={inv.dynamicStatus === 'OVERDUE' ? 'text-red-500 font-medium' : ''}>
                              Due: {new Date(inv.dueDate).toLocaleDateString()}
                            </span>
                            {inv.lateFine > 0 && (
                              <span className="text-red-500 text-xs font-bold px-2 py-0.5 bg-red-50 rounded-full">
                                +₹{inv.lateFine} Late Fine
                              </span>
                            )}
                          </div>
                          
                          {/* Progress Bar for Partial Payments */}
                          {inv.paidAmount > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1 font-medium text-slate-500">
                                <span>Paid: ₹{inv.paidAmount.toLocaleString()}</span>
                                <span>Total: ₹{(inv.amount + inv.lateFine).toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-500 h-full rounded-full" 
                                  style={{ width: `${(inv.paidAmount / (inv.amount + inv.lateFine)) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          
                          {/* Installment Plan Banner */}
                          {inv.hasInstallmentPlan && (
                            <div className="mt-2 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded inline-block">
                              Active Installment Plan
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 pt-4 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="font-extrabold text-xl text-slate-800">₹{inv.outstandingAmount.toLocaleString()}</p>
                          <p className={`text-xs font-bold uppercase tracking-wider ${
                             inv.dynamicStatus === 'OVERDUE' ? 'text-red-500' : 
                             inv.dynamicStatus === 'DUE SOON' ? 'text-amber-500' : 
                             inv.dynamicStatus === 'PARTIAL' ? 'text-indigo-500' :
                             'text-slate-500'
                          }`}>
                            {inv.dynamicStatus}
                          </p>
                        </div>
                        <button 
                          onClick={() => setPaymentInvoice(inv)}
                          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* Fee Breakdown */}
            <div className={glassCard}>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-500" />
                Fee Breakdown
              </h3>
              
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feesBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {feesBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {feesBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">₹{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${glassCard} space-y-4`}>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Links</h3>
              <a href="/parent/fees/history" className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3 text-slate-700 group-hover:text-indigo-700">
                  <DownloadCloud className="w-5 h-5" />
                  <span className="font-semibold text-sm">Download Receipts</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
              </a>
              <button className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-purple-50 rounded-xl transition-colors group">
                <div className="flex items-center gap-3 text-slate-700 group-hover:text-purple-700">
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-semibold text-sm">Fee Policy & FAQs</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
