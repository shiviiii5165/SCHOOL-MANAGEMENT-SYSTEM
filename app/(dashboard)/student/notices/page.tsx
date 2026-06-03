import { prisma } from "@/lib/prisma";
import StudentNoticesClient from "./StudentNoticesClient";

export default async function StudentNoticesPage() {
  try {
    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { audience: { has: "ALL" } },
          { audience: { has: "STUDENT" } }
        ]
      },
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

    return <StudentNoticesClient notices={formattedNotices} />;
  } catch (error: any) {
    console.error("Notices page error:", error);
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Unable to load notices. Please try again later.</p>
      </div>
    );
  }
}
