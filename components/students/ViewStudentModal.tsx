"use client";

import { X, User, BookOpen, AlertTriangle, IndianRupee, ShieldAlert, Users } from "lucide-react";
import Image from "next/image";

interface ViewStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

export default function ViewStudentModal({ isOpen, onClose, student }: ViewStudentModalProps) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
      <div className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-surface flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-text-primary">Student Profile</h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-24 h-24 rounded-full bg-border flex items-center justify-center overflow-hidden relative shadow-sm">
              {student.avatar ? (
                <Image src={student.avatar} alt="Avatar" fill sizes="96px" className="object-cover" />
              ) : (
                <span className="text-3xl font-bold text-text-secondary">
                  {student.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">{student.name}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">{student.regId} • {student.classInfo}</p>
              <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                student.status === "ACTIVE" ? "bg-status-success-bg text-status-success-text" : "bg-status-danger-bg text-status-danger-text"
              }`}>
                {student.status}
              </span>
            </div>
          </div>

          <hr className="border-border" />

          {/* Academic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-wider text-xs">
              <BookOpen className="w-4 h-4" />
              Academic Info
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Roll Number</p>
                <p className="font-medium text-slate-800">{student.rollNo}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Attendance</p>
                <p className="font-medium text-slate-800">{student.attendance}%</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Fee Status</p>
                <p className="font-medium text-slate-800">{student.feeStatus}</p>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-wider text-xs">
              <User className="w-4 h-4" />
              Personal Details
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Date of Birth</p>
                <p className="font-medium text-slate-800">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Gender</p>
                <p className="font-medium text-slate-800">{student.gender}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Blood Group</p>
                <p className="font-medium text-slate-800">{student.bloodGroup || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Transport</p>
                <p className="font-medium text-slate-800">{student.hasTransport ? `Zone ${student.transportZone}` : 'No'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500 text-xs">Address</p>
                <p className="font-medium text-slate-800">{student.address || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Parent Info */}
          <div className="space-y-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-700 font-bold uppercase tracking-wider text-xs">
              <Users className="w-4 h-4" />
              Parent/Guardian
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <p className="text-indigo-900/60 text-xs">Name</p>
                <p className="font-medium text-indigo-950">{student.parentName}</p>
              </div>
              <div>
                <p className="text-indigo-900/60 text-xs">Phone</p>
                <p className="font-medium text-indigo-950">{student.parentPhone}</p>
              </div>
            </div>
          </div>
          
        </div>
        
        <div className="p-4 border-t border-border bg-surface">
           <button 
             onClick={onClose}
             className="w-full py-2 bg-white border border-border rounded-md text-sm font-medium text-text-primary hover:bg-background transition-colors"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
}
