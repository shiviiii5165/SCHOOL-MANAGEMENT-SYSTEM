import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import TeacherNoticesClient from "./TeacherNoticesClient";
import { redirect } from "next/navigation";

export default async function TeacherNoticesPage() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { classes: true }
    });

    if (!teacher) {
      return <div className="p-8 text-center">Teacher profile not found.</div>;
    }

    const classIds = teacher.classes.map(c => c.id);

    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { targetAudience: { in: ["ALL_TEACHERS", "EVERYONE"] } },
          { targetAudience: "SPECIFIC_CLASS", targetClassId: { in: classIds } },
          { createdById: session.user.id }
        ]
      },
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
      isNew: (new Date().getTime() - notice.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000,
      isOwn: notice.createdById === session.user.id
    }));

    return (
      <TeacherNoticesClient 
        notices={formattedNotices} 
        classes={teacher.classes.map(c => ({ id: c.id, name: c.name, section: c.section }))} 
        currentUserId={session.user.id}
      />
    );
  } catch (error) {
    console.error("Teacher notices error:", error);
    return (
      <div className="p-8 text-center text-status-danger">
        Failed to load notices.
      </div>
    );
  }
}
