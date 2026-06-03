"use client";

import { useState } from "react";
import NoticeBoard, { Notice } from "@/components/shared/NoticeBoard";
import { Plus, BellRing } from "lucide-react";

interface AdminNoticesClientProps {
  notices: Notice[];
}

export default function AdminNoticesClient({ notices }: AdminNoticesClientProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-primary">Notice Board</h1>
          <p className="text-sm text-text-secondary mt-1">Manage and publish announcements</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Notice
        </button>
      </div>

      <div className="flex-1 min-h-0">
        <NoticeBoard notices={notices} isAdmin={true} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl shadow-modal w-full max-w-lg">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                <BellRing className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-text-primary">Create Notice</h2>
                <p className="text-xs text-text-muted">Publish a new announcement</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Title</label>
                <input type="text" className="w-full border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Notice title..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Category</label>
                  <select className="w-full border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-primary">
                    <option>General</option>
                    <option>Academic</option>
                    <option>Event</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Target Audience</label>
                  <select className="w-full border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-primary">
                    <option>All</option>
                    <option>Students</option>
                    <option>Teachers</option>
                    <option>Parents</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Content</label>
                <textarea rows={4} className="w-full border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:border-primary resize-none" placeholder="Notice details..."></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="pin" className="rounded border-border text-primary focus:ring-primary" />
                <label htmlFor="pin" className="text-sm font-medium text-text-primary">Pin to top</label>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-background transition-colors">Cancel</button>
              <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium transition-colors">Publish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
