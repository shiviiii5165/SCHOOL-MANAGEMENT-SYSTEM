"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CreateExamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "UNIT_TEST_1",
    academicYear: "2024-25",
    startDate: "",
    endDate: "",
    defaultPassPct: 33,
    classIds: [] as string[],
  });

  useEffect(() => {
    // Fetch classes for selection
    fetch("/api/classes")
      .then(res => res.json())
      .then(data => {
        if (data.classes) setClasses(data.classes);
      })
      .catch(console.error);
  }, []);

  const handleClassToggle = (classId: string) => {
    setFormData(prev => {
      if (prev.classIds.includes(classId)) {
        return { ...prev, classIds: prev.classIds.filter(id => id !== classId) };
      } else {
        return { ...prev, classIds: [...prev.classIds, classId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.classIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("End date cannot be before start date");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create exam");

      toast.success("Exam created successfully!");
      router.push(`/admin/exams/${data.exam.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/exams" className="p-2 bg-surface border border-border rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Create New Exam</h1>
          <p className="text-sm text-text-secondary">Define exam details and select participating classes.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Exam Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-border shadow-card space-y-4">
            <h3 className="font-bold text-lg text-text-primary mb-4 border-b border-border pb-2">Exam Configuration</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Exam Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid Term Examination 2024"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Exam Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                >
                  <option value="UNIT_TEST_1">Unit Test 1</option>
                  <option value="UNIT_TEST_2">Unit Test 2</option>
                  <option value="MID_TERM">Mid Term</option>
                  <option value="PRE_BOARD">Pre Board</option>
                  <option value="FINAL">Final</option>
                  <option value="PRACTICAL">Practical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Academic Year</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024-25"
                  value={formData.academicYear}
                  onChange={e => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Default Pass Percentage (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.defaultPassPct}
                  onChange={e => setFormData({ ...formData, defaultPassPct: Number(e.target.value) })}
                  className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">Start Date</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Classes */}
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-border shadow-card h-full">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
              <h3 className="font-bold text-lg text-text-primary">Target Classes</h3>
              <span className="bg-primary-light text-primary text-xs font-bold px-2 py-1 rounded-md">
                {formData.classIds.length} Selected
              </span>
            </div>
            
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {classes.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">Loading classes...</p>
              ) : (
                classes.map(c => (
                  <label key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-slate-50 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <div>
                      <p className="font-medium text-text-primary">{c.name} - {c.section}</p>
                      <p className="text-xs text-text-muted">{c._count?.students || 0} students</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.classIds.includes(c.id)}
                      onChange={() => handleClassToggle(c.id)}
                      className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                    />
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-border">
          <Link 
            href="/admin/exams"
            className="px-6 py-2.5 bg-surface border border-border text-text-secondary font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save & Continue
          </button>
        </div>

      </form>
    </div>
  );
}
