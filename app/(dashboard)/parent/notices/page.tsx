import { prisma } from "@/lib/prisma";
import ParentNoticesClient from "./ParentNoticesClient";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ParentNoticesPage() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "PARENT") {
    redirect("/login");
  }

  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: true }
    });

    if (!parent) {
      return <div className="p-8 text-center text-status-danger">Parent profile not found.</div>;
    }

    const childClassIds = parent.students.map(s => s.classId);

    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { targetAudience: { in: ["ALL_PARENTS", "EVERYONE"] } },
          { targetAudience: "SPECIFIC_CLASS", targetClassId: { in: childClassIds } }
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
      isNew: (new Date().getTime() - notice.createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000
    }));

    return <ParentNoticesClient notices={formattedNotices} />;
  } catch (error: any) {
    console.error("Notices page error:", error);
    return (
      <div className="p-8 text-center">
        <p className="text-status-danger">Unable to load notices. Please try again later.</p>
      </div>
    );
  }
}
