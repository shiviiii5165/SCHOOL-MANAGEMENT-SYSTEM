"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Building2, GraduationCap, Clock, Bell, 
  Save, Loader2, ShieldCheck, AlertCircle, Upload
} from "lucide-react";

const settingsSchema = z.object({
  schoolName: z.string().min(3, "School Name must be at least 3 characters"),
  schoolEmail: z.string().email("Invalid email address"),
  schoolPhone: z.string().optional().nullable(),
  schoolAddress: z.string().optional().nullable(),
  minimumAttendance: z.coerce.number().min(0, "Must be positive").max(100, "Cannot exceed 100"),
  detentionThreshold: z.coerce.number().min(0, "Must be positive").max(100, "Cannot exceed 100"),
  gradingSystem: z.enum(["PERCENTAGE", "GPA", "LETTER"]),
  enableEmailAlerts: z.boolean(),
  enableSMSAlerts: z.boolean(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["global-system-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    }
  });

  // Setup Form
  const { 
    register, 
    handleSubmit, 
    control,
    reset,
    formState: { isDirty, isSubmitting, errors } 
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      schoolName: "",
      schoolEmail: "",
      schoolPhone: "",
      schoolAddress: "",
      minimumAttendance: 75,
      detentionThreshold: 75,
      gradingSystem: "PERCENTAGE",
      enableEmailAlerts: true,
      enableSMSAlerts: false,
    }
  });

  // Populate form when data loads
  useEffect(() => {
    if (settings && !settings.error) {
      reset(settings);
    }
  }, [settings, reset]);

  // Update Mutation (Optimistic UI)
  const updateMutation = useMutation({
    mutationFn: async (data: SettingsValues) => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update settings");
      return result.settings;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["global-system-settings"] });
      const previous = queryClient.getQueryData(["global-system-settings"]);
      queryClient.setQueryData(["global-system-settings"], newData);
      return { previous };
    },
    onError: (err, newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["global-system-settings"], context.previous);
      }
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 5000);
    },
    onSuccess: (updatedSettings) => {
      reset(updatedSettings); // resets isDirty flag
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["global-system-settings"] });
    }
  });

  const onSubmit = (data: SettingsValues) => {
    setErrorMsg(null);
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
        <div className="h-8 bg-surface border border-border w-1/3 rounded-lg"></div>
        <div className="h-[400px] bg-surface border border-border rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-text-primary">Global ERP Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure singleton system variables, grading formats, and alert preferences.</p>
      </div>

      {saveSuccess && (
        <div className="mb-6 bg-status-success-bg border border-status-success-text/20 text-status-success-text px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-medium text-sm">Settings saved successfully! Global system updated.</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 bg-status-danger-bg border border-status-danger-text/20 text-status-danger-text px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Section 1: School Information */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-background/50 border-b border-border p-5 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Building2 className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">1. School Information</h2>
              <p className="text-xs text-text-secondary">Official institutional details.</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload Placeholder */}
            <div className="col-span-full flex items-center gap-6 pb-4">
              <div className="w-20 h-20 rounded-full bg-background border-2 border-dashed border-border flex items-center justify-center text-text-muted">
                <Building2 className="w-8 h-8 opacity-50" />
              </div>
              <div>
                <button type="button" className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-background transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </button>
                <p className="text-xs text-text-muted mt-2">Recommended: 256x256px PNG or JPG</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-primary">School Name <span className="text-status-danger-text">*</span></label>
              <input {...register("schoolName")} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm" />
              {errors.schoolName && <p className="text-xs text-status-danger-text font-medium mt-1">{errors.schoolName.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-primary">Official Email <span className="text-status-danger-text">*</span></label>
              <input {...register("schoolEmail")} type="email" className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm" />
              {errors.schoolEmail && <p className="text-xs text-status-danger-text font-medium mt-1">{errors.schoolEmail.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-primary">Phone Number</label>
              <input {...register("schoolPhone")} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-text-primary">Address</label>
              <textarea {...register("schoolAddress")} rows={3} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm resize-none" />
            </div>
          </div>
        </section>

        {/* Section 2: Attendance Policies */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-background/50 border-b border-border p-5 flex items-center gap-3">
            <div className="p-2 bg-status-warning-bg rounded-lg text-status-warning-text"><Clock className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">2. Attendance Policies</h2>
              <p className="text-xs text-text-secondary">Global thresholds affecting exam eligibility.</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-text-primary">Minimum Required Attendance (%)</label>
              <input type="number" {...register("minimumAttendance")} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm" />
              {errors.minimumAttendance && <p className="text-xs text-status-danger-text font-medium mt-1">{errors.minimumAttendance.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-status-danger-text">Detention Threshold (%)</label>
              <input type="number" {...register("detentionThreshold")} className="w-full px-4 py-2 bg-status-danger-bg/20 border border-status-danger-text/30 text-status-danger-text rounded-lg focus:outline-none focus:border-status-danger-text transition-colors text-sm" />
              <p className="text-xs text-text-muted mt-1">Students below this limit trigger detention workflows.</p>
              {errors.detentionThreshold && <p className="text-xs text-status-danger-text font-medium mt-1">{errors.detentionThreshold.message}</p>}
            </div>
          </div>
        </section>

        {/* Section 3: Academic Preferences */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-background/50 border-b border-border p-5 flex items-center gap-3">
            <div className="p-2 bg-role-parent/10 rounded-lg text-role-parent"><GraduationCap className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">3. Academic Preferences</h2>
              <p className="text-xs text-text-secondary">Determine how report cards and results are calculated.</p>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-1 max-w-sm">
              <label className="text-sm font-semibold text-text-primary">Grading System</label>
              <select {...register("gradingSystem")} className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="GPA">GPA (4.0 Scale)</option>
                <option value="LETTER">Letter Grades (A, B, C...)</option>
              </select>
              {errors.gradingSystem && <p className="text-xs text-status-danger-text font-medium mt-1">{errors.gradingSystem.message}</p>}
            </div>
          </div>
        </section>

        {/* Section 4: Notification Preferences */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-background/50 border-b border-border p-5 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Bell className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">4. Notification Preferences</h2>
              <p className="text-xs text-text-secondary">Control automated alert channels.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            
            <label className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-background/50 cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-semibold text-text-primary">Email Alerts</p>
                <p className="text-xs text-text-muted mt-1">Send critical system alerts and reports via Email.</p>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" {...register("enableEmailAlerts")} className="sr-only peer" />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>

            <label className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-background/50 cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-semibold text-text-primary">SMS Alerts</p>
                <p className="text-xs text-text-muted mt-1">Send absence alerts to parents via SMS.</p>
              </div>
              <div className="relative inline-flex items-center">
                <input type="checkbox" {...register("enableSMSAlerts")} className="sr-only peer" />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
            </label>

          </div>
        </section>

        {/* Sticky Save Bar */}
        <div className={`fixed bottom-0 left-0 right-0 md:left-64 lg:left-72 p-4 bg-surface/80 backdrop-blur-md border-t border-border flex items-center justify-between transition-transform duration-300 z-40 ${isDirty ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-status-warning animate-pulse"></div>
            <span className="text-sm font-medium text-text-primary">Unsaved changes</span>
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => reset(settings)} 
              disabled={isSubmitting || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-sm"
            >
              {(isSubmitting || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Global Settings
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
