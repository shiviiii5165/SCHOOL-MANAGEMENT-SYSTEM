import { prisma } from "@/lib/prisma";
import AdminNoticesClient from "./AdminNoticesClient";

export default async function AdminNoticesPage() {
  const notices = await prisma.notice.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const formattedNotices = notices.map(notice => {
    return {
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: (notice.audience.includes("ALL") ? "General" : "Event") as "General" | "Event" | "Academic" | "Urgent",
      date: notice.createdAt.toISOString().split('T')[0],
      isPinned: false,
      isNew: (new Date().getTime() - notice.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000 // New if < 7 days
    };
  });

  return <AdminNoticesClient notices={formattedNotices} />;
}
