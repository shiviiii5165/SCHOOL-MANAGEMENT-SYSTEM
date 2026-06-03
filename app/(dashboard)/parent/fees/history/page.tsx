"use client";

import React, { useState, useEffect } from 'react';
import { Download, Receipt, ArrowLeft, Loader2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [parentName, setParentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/parent/fees/history')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPayments(data.payments);
          setParentName(data.parentName);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const generateReceipt = (payment: any) => {
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // --- Background & Border ---
      doc.setFillColor(249, 250, 251); // Light slate-50 background
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      doc.setDrawColor(79, 70, 229); // Indigo border
      doc.setLineWidth(2);
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40);

      // --- Header Area ---
      // Logo Placeholder
      doc.setFillColor(79, 70, 229);
      doc.circle(60, 60, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("E", 52, 67);

      // School Name
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.setFontSize(26);
      doc.text("EDUCORE SCHOOL", 95, 55);
      
      // Tagline & Address
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128); // Gray-500
      doc.text("Excellence in Education | ISO 9001:2015 Certified", 95, 70);
      doc.text("123 Education Lane, Knowledge Park, New Delhi - 110001", 95, 82);

      // Separator Line
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(1);
      doc.line(40, 100, pageWidth - 40, 100);

      // --- Receipt Title ---
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text("OFFICIAL FEE RECEIPT", pageWidth / 2, 125, { align: 'center' });

      // --- Metadata Box (Receipt No & Date) ---
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(40, 140, 220, 40, 5, 5, 'F');
      doc.roundedRect(pageWidth - 260, 140, 220, 40, 5, 5, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text("Receipt Number:", 50, 155);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(`${payment.receiptNumber || 'N/A'}`, 50, 170);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      doc.text("Payment Date:", pageWidth - 250, 155);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(`${new Date(payment.paymentDate).toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - 250, 170);

      // --- Student Info ---
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text("Student Details", 40, 215);
      doc.setDrawColor(79, 70, 229);
      doc.line(40, 220, 125, 220);

      doc.setFontSize(11);
      doc.setTextColor(55, 65, 81);
      doc.setFont("helvetica", "normal");
      doc.text(`Student Name:`, 40, 240);
      doc.setFont("helvetica", "bold");
      doc.text(`${payment.student?.user?.name || 'N/A'}`, 130, 240);

      doc.setFont("helvetica", "normal");
      doc.text(`Class & Sec:`, 40, 260);
      doc.setFont("helvetica", "bold");
      doc.text(`${payment.student?.class?.name || 'N/A'} - ${payment.student?.class?.section || 'N/A'}`, 130, 260);

      doc.setFont("helvetica", "normal");
      doc.text(`Roll Number:`, 300, 260);
      doc.setFont("helvetica", "bold");
      doc.text(`${payment.student?.rollNo || 'N/A'}`, 390, 260);

      doc.setFont("helvetica", "normal");
      doc.text(`Parent Name:`, 40, 280);
      doc.setFont("helvetica", "bold");
      doc.text(`${parentName || 'N/A'}`, 130, 280);

      // --- Table ---
      const feeDesc = payment.feeRecord ? `${payment.feeRecord.feeType} Fee` : (payment.note || 'Advance / Custom Payment');
      const amountStr = `Rs. ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

      autoTable(doc, {
        startY: 310,
        head: [['S.No.', 'Fee Description', 'Amount Paid']],
        body: [
          ['1', feeDesc, amountStr]
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { textColor: [55, 65, 81], fontSize: 11 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 50 },
          1: { halign: 'left' },
          2: { halign: 'right', fontStyle: 'bold', cellWidth: 120 }
        },
        margin: { left: 40, right: 40 }
      });

      // --- Payment Summary & Status ---
      const finalY = (doc as any).lastAutoTable.finalY || 400;

      // Total Box
      doc.setFillColor(238, 242, 255); // Indigo-50
      doc.rect(pageWidth - 200, finalY + 10, 160, 30, 'F');
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text("Total Paid:", pageWidth - 190, finalY + 30);
      doc.text(amountStr, pageWidth - 50, finalY + 30, { align: 'right' });

      // Payment Metadata
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text(`Payment Mode:`, 40, finalY + 25);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55);
      doc.text(`${payment.paymentMode || 'N/A'}`, 120, finalY + 25);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(`Transaction ID:`, 40, finalY + 45);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(31, 41, 55);
      doc.text(`${payment.transactionId || 'N/A'}`, 120, finalY + 45);

      // Status Stamp
      doc.setDrawColor(34, 197, 94); // Green border
      doc.setTextColor(34, 197, 94);
      doc.setLineWidth(2);
      doc.roundedRect(40, finalY + 65, 120, 30, 5, 5);
      doc.setFontSize(14);
      doc.text("SUCCESS \u2713", 100, finalY + 85, { align: 'center' });

      // --- Signatures ---
      doc.setDrawColor(156, 163, 175);
      doc.setLineWidth(1);
      doc.line(pageWidth - 180, finalY + 130, pageWidth - 40, finalY + 130);
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.setFont("helvetica", "normal");
      doc.text("Authorized Signatory", pageWidth - 110, finalY + 145, { align: 'center' });

      // --- Footer ---
      doc.setFillColor(79, 70, 229);
      doc.rect(20, pageHeight - 60, pageWidth - 40, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("This is a computer-generated receipt and does not require a physical signature.", pageWidth / 2, pageHeight - 45, { align: 'center' });
      doc.text("For any discrepancies, contact: support@educore.edu | +91 9876543210", pageWidth / 2, pageHeight - 32, { align: 'center' });

      doc.save(`EduCore_Receipt_${payment.receiptNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please check the console.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <a href="/parent/fees" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </a>
          <h1 className="text-2xl font-bold text-slate-800">Payment History</h1>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Receipt No</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold">Amount</th>
                  <th className="p-4 font-semibold">Mode</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                      {new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-mono">{p.receiptNumber}</td>
                    <td className="p-4 text-sm font-medium text-slate-800">
                      {p.feeRecord ? `${p.feeRecord.feeType} Fee` : 'Payment'}
                      <div className="text-xs text-slate-400 font-normal">{p.student.user.name}</div>
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-800 whitespace-nowrap">₹{p.amount.toLocaleString()}</td>
                    <td className="p-4 text-sm text-slate-500">{p.paymentMode}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                        SUCCESS ✓
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => generateReceipt(p)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p>No payment history found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
