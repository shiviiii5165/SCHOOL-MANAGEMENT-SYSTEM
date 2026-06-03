"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: any[];
  student?: any; // If null, we are adding. If object, we are editing.
  onSuccess: (credentials?: any) => void;
}

export default function AddEditModal({ isOpen, onClose, classes, student, onSuccess }: AddEditModalProps) {
  const isEditing = !!student;

  const [formData, setFormData] = useState({
    name: student?.name || "",
    rollNo: student?.rollNo || "",
    classId: student?.classId || "",
    dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.split('T')[0] : "",
    gender: student?.gender || "Male",
    bloodGroup: student?.bloodGroup || "",
    parentName: student?.parentName || "",
    parentPhone: student?.parentPhone || "",
    address: student?.address || "",
    hasTransport: student?.hasTransport || false,
    transportZone: student?.transportZone || "",
  });

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const validate = () => {
    const newErrors: any = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!isEditing && !formData.rollNo) newErrors.rollNo = "Roll Number is required";
    if (!isEditing && !formData.classId) newErrors.classId = "Class is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of Birth is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.parentName) newErrors.parentName = "Parent Name is required";
    if (!formData.parentPhone || !/^\d{10}$/.test(formData.parentPhone)) {
      newErrors.parentPhone = "Must be a 10-digit number";
    }
    if (formData.hasTransport && !formData.transportZone) {
      newErrors.transportZone = "Transport Zone is required if transport is enabled";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const url = isEditing ? `/api/students/${student.id}` : '/api/students';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        bloodGroup: formData.bloodGroup || null,
        transportZone: formData.hasTransport ? formData.transportZone : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      onSuccess(data.credentials); // Passing credentials if available
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-display font-bold text-text-primary">
            {isEditing ? "Edit Student" : "Add New Student"}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {globalError && (
            <div className="mb-6 p-4 rounded-md bg-status-danger-bg text-status-danger-text border border-status-danger/20 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{globalError}</span>
            </div>
          )}

          <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Full Name *</label>
                <input 
                  type="text" 
                  className={`w-full text-sm border ${errors.name ? 'border-red-500' : 'border-border'} rounded-md p-2 focus:ring-1 focus:ring-primary`}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Roll No */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Roll Number {isEditing ? "(Read-only)" : "*"}</label>
                <input 
                  type="text" 
                  className={`w-full text-sm border ${errors.rollNo ? 'border-red-500' : 'border-border'} rounded-md p-2 bg-surface`}
                  value={formData.rollNo}
                  onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                  placeholder="e.g. 10A031"
                  disabled={isEditing}
                />
                {errors.rollNo && <p className="text-red-500 text-xs mt-1">{errors.rollNo}</p>}
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Class {isEditing ? "(Read-only)" : "*"}</label>
                <select 
                  className={`w-full text-sm border ${errors.classId ? 'border-red-500' : 'border-border'} rounded-md p-2 ${isEditing ? 'bg-surface' : ''}`}
                  value={formData.classId}
                  onChange={e => setFormData({ ...formData, classId: e.target.value })}
                  disabled={isEditing}
                >
                  <option value="">Select a class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </select>
                {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId}</p>}
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Date of Birth *</label>
                <input 
                  type="date" 
                  className={`w-full text-sm border ${errors.dateOfBirth ? 'border-red-500' : 'border-border'} rounded-md p-2`}
                  value={formData.dateOfBirth}
                  onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
                {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Gender *</label>
                <select 
                  className={`w-full text-sm border ${errors.gender ? 'border-red-500' : 'border-border'} rounded-md p-2`}
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Blood Group</label>
                <select 
                  className="w-full text-sm border border-border rounded-md p-2"
                  value={formData.bloodGroup}
                  onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                >
                  <option value="">Select Blood Group</option>
                  {['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Parent Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Parent Name *</label>
                <input 
                  type="text" 
                  className={`w-full text-sm border ${errors.parentName ? 'border-red-500' : 'border-border'} rounded-md p-2`}
                  value={formData.parentName}
                  onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Parent's Full Name"
                />
                {errors.parentName && <p className="text-red-500 text-xs mt-1">{errors.parentName}</p>}
              </div>

              {/* Parent Phone */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Parent Phone *</label>
                <input 
                  type="text" 
                  className={`w-full text-sm border ${errors.parentPhone ? 'border-red-500' : 'border-border'} rounded-md p-2`}
                  value={formData.parentPhone}
                  onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
                {errors.parentPhone && <p className="text-red-500 text-xs mt-1">{errors.parentPhone}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Address</label>
              <textarea 
                className="w-full text-sm border border-border rounded-md p-2 h-20 resize-none"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Residential Address"
              />
            </div>

            {/* Transport */}
            <div className="p-4 bg-surface rounded-lg border border-border space-y-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="transport" 
                  className="w-4 h-4 text-primary rounded border-border"
                  checked={formData.hasTransport}
                  onChange={e => setFormData({ ...formData, hasTransport: e.target.checked })}
                />
                <label htmlFor="transport" className="text-sm font-medium text-text-primary">Requires School Transport</label>
              </div>

              {formData.hasTransport && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Transport Zone *</label>
                  <select 
                    className={`w-full md:w-1/2 text-sm border ${errors.transportZone ? 'border-red-500' : 'border-border'} rounded-md p-2`}
                    value={formData.transportZone}
                    onChange={e => setFormData({ ...formData, transportZone: e.target.value })}
                  >
                    <option value="">Select Zone</option>
                    {['A', 'B', 'C', 'D'].map(z => (
                      <option key={z} value={z}>Zone {z}</option>
                    ))}
                  </select>
                  {errors.transportZone && <p className="text-red-500 text-xs mt-1">{errors.transportZone}</p>}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-white border border-border rounded-md hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="student-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark transition-colors disabled:opacity-70"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Student
          </button>
        </div>
      </div>
    </div>
  );
}
