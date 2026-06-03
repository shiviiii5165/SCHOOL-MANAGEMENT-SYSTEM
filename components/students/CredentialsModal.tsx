"use client";

import { X, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: {
    student: { email: string; password: string; regId: string };
    parent: { email: string; password: string };
    systemRegId: string;
  };
}

export default function CredentialsModal({ isOpen, onClose, credentials }: CredentialsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    const text = `
Student Registration ID: ${credentials.systemRegId}
Roll No: ${credentials.student.regId}

--- Student Login ---
Email: ${credentials.student.email}
Password: ${credentials.student.password}

--- Parent Login ---
Email: ${credentials.parent.email}
Password: ${credentials.parent.password}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 bg-status-success-bg border-b border-status-success/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-status-success-text">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-800">Student Added Successfully!</h2>
            <p className="text-sm text-slate-600 mt-1">Please save these auto-generated credentials.</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-surface border border-border rounded-lg p-4 font-mono text-sm space-y-2 relative">
            <div className="text-xs text-text-secondary font-sans uppercase tracking-wider mb-2 font-bold border-b border-border pb-1">
              Student Registration ID
            </div>
            <div>{credentials.systemRegId}</div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-4 font-mono text-sm space-y-2 relative">
            <div className="text-xs text-indigo-600 font-sans uppercase tracking-wider mb-2 font-bold border-b border-border pb-1">
              Student Login
            </div>
            <div><span className="text-text-secondary">Email: </span> {credentials.student.email}</div>
            <div><span className="text-text-secondary">Password: </span> {credentials.student.password}</div>
          </div>

          <div className="bg-surface border border-border rounded-lg p-4 font-mono text-sm space-y-2 relative">
            <div className="text-xs text-indigo-600 font-sans uppercase tracking-wider mb-2 font-bold border-b border-border pb-1">
              Parent Login
            </div>
            <div><span className="text-text-secondary">Email: </span> {credentials.parent.email}</div>
            <div><span className="text-text-secondary">Password: </span> {credentials.parent.password}</div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-surface flex justify-between gap-3">
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-white border border-border rounded-md hover:bg-background transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Credentials"}
          </button>
          
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
