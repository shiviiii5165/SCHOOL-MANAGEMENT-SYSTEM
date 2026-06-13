import { prisma } from "@/lib/prisma";
import AdminNoticesClient from "./AdminNoticesClient";

export default async function AdminNoticesPage() {
  try {
    const notices = await prisma.notice.findMany({
      include: {
        createdBy: {
          select: { name: true }
        },
        targetClass: {
          select: { name: true, section: true }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const classes = await prisma.class.findMany({
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
      select: { id: true, name: true, section: true }
    });

    const formattedNotices = notices.map(notice => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      targetAudience: notice.targetAudience,
      targetClassId: notice.targetClassId,
      targetClassName: notice.targetClass ? `${notice.targetClass.name} - ${notice.targetClass.section}` : undefined,
      authorName: notice.createdBy.name,
      authorRole: notice.createdByRole,
      date: notice.createdAt.toISOString(),
      isPinned: notice.isPinned,
      isNew: (new Date().getTime() - notice.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000
    }));

    return <AdminNoticesClient notices={formattedNotices} classes={classes} />;
  } catch (error) {
    console.error("Admin notices error:", error);
    return (
      <div className="p-8 text-center text-status-danger">
        Failed to load notices.
      </div>
    );
  }
}
