"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NoticeBoard, { Notice } from "@/components/shared/NoticeBoard";
import { Plus, X, Loader2 } from "lucide-react";

interface TeacherNoticesClientProps {
  notices: (Notice & { isOwn?: boolean })[];
  classes: { id: string; name: string; section: string }[];
  currentUserId: string;
}

export default function TeacherNoticesClient({ notices, classes, currentUserId }: TeacherNoticesClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"SCHOOL" | "MY_NOTICES">("SCHOOL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "GENERAL",
    priority: "NORMAL",
    targetAudience: "SPECIFIC_CLASS",
    targetClassId: classes.length > 0 ? classes[0].id : ""
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("Failed to delete notice");
    } catch (e) {
      alert("Failed to delete notice");
    }
  };

  const handlePin = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}/pin`, { method: "PATCH" });
      if (res.ok) router.refresh();
      else alert("Failed to pin notice");
    } catch (e) {
      alert("Failed to pin notice");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.targetClassId) return alert("Please select a class");
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ title: "", content: "", category: "GENERAL", priority: "NORMAL", targetAudience: "SPECIFIC_CLASS", targetClassId: classes.length > 0 ? classes[0].id : "" });
        router.refresh();
        setActiveTab("MY_NOTICES");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create notice");
      }
    } catch (e) {
      alert("Failed to create notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedNotices = activeTab === "MY_NOTICES" 
    ? notices.filter(n => n.isOwn)
    : notices.filter(n => !n.isOwn);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col relative">
      <div className="shrink-0 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Notices</h1>
          <p className="text-sm text-text-secondary mt-1">View school announcements and manage class notices</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Post Notice
        </button>
      </div>

      <div className="flex gap-4 border-b border-border shrink-0">
        <button
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "SCHOOL" ? "text-primary" : "text-text-secondary hover:text-text-primary"}`}
          onClick={() => setActiveTab("SCHOOL")}
        >
          School Notices
          {activeTab === "SCHOOL" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button
          className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "MY_NOTICES" ? "text-primary" : "text-text-secondary hover:text-text-primary"}`}
          onClick={() => setActiveTab("MY_NOTICES")}
        >
          My Posted Notices
          {activeTab === "MY_NOTICES" && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <NoticeBoard 
          notices={displayedNotices} 
          isTeacher={true} 
          currentUserId={currentUserId}
          onDelete={activeTab === "MY_NOTICES" ? handleDelete : undefined}
          onPin={activeTab === "MY_NOTICES" ? handlePin : undefined}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
              <h2 className="font-semibold text-lg">Post Class Notice</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-border rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-background text-sm"
                  placeholder="E.g. Homework Assignment"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-background text-sm"
                  >
                    <option value="GENERAL">General</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="EVENT">Event</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-background text-sm"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Select Class (Target)</label>
                <select
                  required
                  value={formData.targetClassId}
                  onChange={e => setFormData({ ...formData, targetClassId: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-background text-sm"
                >
                  <option value="">Select a class...</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-background text-sm"
                  placeholder="Enter notice details..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-background rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || classes.length === 0}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
