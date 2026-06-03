"use client";

import NoticeBoard, { Notice } from "@/components/shared/NoticeBoard";

interface StudentNoticesClientProps {
  notices: Notice[];
}

export default function StudentNoticesClient({ notices }: StudentNoticesClientProps) {
  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="shrink-0">
        <h1 className="text-2xl font-display font-bold text-text-primary">Notice Board</h1>
        <p className="text-sm text-text-secondary mt-1">Stay updated with the latest school announcements</p>
      </div>

      <div className="flex-1 min-h-0">
        <NoticeBoard notices={notices} />
      </div>
    </div>
  );
}
