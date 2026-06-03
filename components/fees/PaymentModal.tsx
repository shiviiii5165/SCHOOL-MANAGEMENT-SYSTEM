"use client";

import React, { useState } from 'react';
import { X, CreditCard, Building, Smartphone, Wallet, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  invoice: any;
  wallets: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ invoice, wallets, onClose, onSuccess }: PaymentModalProps) {
  const outstanding = invoice.outstandingAmount || 0;
  const [amount, setAmount] = useState<string>(outstanding.toString());
  const [mode, setMode] = useState<string>('UPI');
  const [loading, setLoading] = useState(false);

  // Check if there is a wallet for this student
  const wallet = wallets.find(w => w.studentId === invoice.studentId);
  const walletBalance = wallet ? wallet.balance : 0;
  
  const [useWallet, setUseWallet] = useState(false);

  const handlePay = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 500) {
      toast.error("Minimum payment amount is ₹500");
      return;
    }
    
    if (numAmount > outstanding + 1 && !useWallet) {
       // It's an overpayment, but they didn't explicitly check a box to send to wallet?
       // Actually our backend handles overpayment automatically.
    }

    setLoading(true);
    try {
      const res = await fetch('/api/fees/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: numAmount,
          paymentMode: mode,
          transactionId: `TXN${Date.now()}`
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message || "Payment Successful!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPay = async () => {
    setLoading(true);
    try {
      const payAmount = Math.min(walletBalance, outstanding);
      const res = await fetch('/api/fees/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: payAmount,
          paymentMode: 'ADVANCE_WALLET',
          transactionId: `WLT${Date.now()}`
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message || "Payment from Wallet Successful!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90dvh]">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Pay Fee</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Invoice Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="font-semibold text-slate-800">{invoice.feeType} Fee</h3>
            <p className="text-sm text-slate-500 mt-1">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
            
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-medium">₹{invoice.amount.toLocaleString()}</span>
              </div>
              {invoice.lateFine > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Late Fine:</span>
                  <span>+₹{invoice.lateFine.toLocaleString()}</span>
                </div>
              )}
              {invoice.paidAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Already Paid:</span>
                  <span>-₹{invoice.paidAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-slate-200 text-indigo-700">
                <span>Outstanding:</span>
                <span>₹{outstanding.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Wallet Payment Prompt */}
          {walletBalance > 0 && outstanding > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <Wallet className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-800">Credit Wallet Balance Available</h4>
                  <p className="text-xs text-emerald-600">You have ₹{walletBalance.toLocaleString()} in your advance wallet.</p>
                </div>
              </div>
              <button 
                onClick={handleWalletPay} 
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Pay ₹${Math.min(walletBalance, outstanding).toLocaleString()} from Wallet`}
              </button>
            </div>
          )}

          {/* Payment Input */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Payment Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-medium text-slate-800 transition-all"
                placeholder="Enter amount"
              />
            </div>
            
            {/* Quick Select */}
            <div className="flex gap-2">
              <button 
                onClick={() => setAmount(outstanding.toString())}
                className="flex-1 py-2 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Full
              </button>
              <button 
                onClick={() => setAmount((Math.round(outstanding / 2 / 10) * 10).toString())}
                className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Half
              </button>
              <button 
                onClick={() => setAmount('')}
                className="flex-1 py-2 text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Custom
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'UPI', icon: Smartphone, label: 'UPI' },
                { id: 'CARD', icon: CreditCard, label: 'Card' },
                { id: 'NET_BANKING', icon: Building, label: 'NetBank' },
                { id: 'WALLET', icon: Wallet, label: 'Wallets' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                    mode === m.id 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <m.icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          {parseFloat(amount) < outstanding && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong className="font-bold">⚠ Note:</strong> Partial payment. Remaining ₹{(outstanding - parseFloat(amount || '0')).toLocaleString()} still due.
              </p>
            </div>
          )}
          {parseFloat(amount) > outstanding && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs text-emerald-800 leading-relaxed">
                <strong className="font-bold">✓ Note:</strong> Excess ₹{(parseFloat(amount || '0') - outstanding).toLocaleString()} added to Credit Wallet.
              </p>
            </div>
          )}

        </div>
        {/* Action */}
        <div className="p-4 sm:p-6 border-t border-slate-100 shrink-0 bg-white pb-[env(safe-area-inset-bottom,20px)]">
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Pay ₹{parseFloat(amount || '0').toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}
