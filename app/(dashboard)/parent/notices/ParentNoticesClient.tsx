"use client";

import NoticeBoard, { Notice } from "@/components/shared/NoticeBoard";

interface ParentNoticesClientProps {
  notices: Notice[];
}

export default function ParentNoticesClient({ notices }: ParentNoticesClientProps) {
  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col relative">
      <div className="shrink-0">
        <h1 className="text-2xl font-display font-bold text-text-primary">Notice Board</h1>
        <p className="text-sm text-text-secondary mt-1">Important updates for you and your children's classes</p>
      </div>

      <div className="flex-1 min-h-0">
        <NoticeBoard notices={notices} />
      </div>
    </div>
  );
}
