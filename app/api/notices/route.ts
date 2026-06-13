import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== "ADMIN" && userRole !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, content, category, priority, targetAudience, targetClassId, isPinned, expiresAt } = body;

    // Validate Teacher's targetClassId if SPECIFIC_CLASS
    if (userRole === "TEACHER" && targetAudience === "SPECIFIC_CLASS") {
      if (!targetClassId) {
        return NextResponse.json({ error: "targetClassId is required for SPECIFIC_CLASS" }, { status: 400 });
      }
      
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        include: { classes: true }
      });
      
      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
      }

      const isAssigned = teacher.classes.some(c => c.id === targetClassId);
      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden: You are not assigned to this class" }, { status: 403 });
      }
    }

    // Create the Notice inside a transaction so we can also create Notifications
    const result = await prisma.$transaction(async (tx) => {
      const notice = await tx.notice.create({
        data: {
          title,
          content,
          category,
          priority: priority || "NORMAL",
          targetAudience,
          targetClassId: targetClassId || null,
          createdById: userId,
          createdByRole: userRole,
          isPinned: isPinned || false,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }
      });

      // Find targeted users
      let targetUserIds: string[] = [];

      if (targetAudience === "ALL_STUDENTS" || targetAudience === "EVERYONE") {
        const students = await tx.user.findMany({ where: { role: "STUDENT", isActive: true }, select: { id: true } });
        targetUserIds.push(...students.map(s => s.id));
      }
      
      if (targetAudience === "ALL_TEACHERS" || targetAudience === "EVERYONE") {
        const teachers = await tx.user.findMany({ where: { role: "TEACHER", isActive: true }, select: { id: true } });
        targetUserIds.push(...teachers.map(t => t.id));
      }
      
      if (targetAudience === "ALL_PARENTS" || targetAudience === "EVERYONE") {
        const parents = await tx.user.findMany({ where: { role: "PARENT", isActive: true }, select: { id: true } });
        targetUserIds.push(...parents.map(p => p.id));
      }

      if (targetAudience === "SPECIFIC_CLASS" && targetClassId) {
        // Students in the class
        const studentsInClass = await tx.student.findMany({
          where: { classId: targetClassId },
          include: { user: true, parent: { include: { user: true } } }
        });
        
        for (const student of studentsInClass) {
          if (student.user && student.user.isActive) {
            targetUserIds.push(student.user.id);
          }
          if (student.parent && student.parent.user && student.parent.user.isActive) {
            targetUserIds.push(student.parent.user.id);
          }
        }
      }

      // Deduplicate user IDs
      targetUserIds = [...new Set(targetUserIds)];

      // Create Notifications
      if (targetUserIds.length > 0) {
        let notificationTitle = title;
        if (priority === "URGENT") notificationTitle = `🚨 URGENT: ${title}`;
        else if (priority === "HIGH") notificationTitle = `📢 ${title}`;
        else notificationTitle = `📌 ${title}`;

        const notifications = targetUserIds.map(uId => ({
          userId: uId,
          title: notificationTitle,
          message: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          type: "NOTICE" as const,
          link: "/student/notices", // Parents and students use similar routes, but link can be generalized
        }));

        await tx.notification.createMany({
          data: notifications
        });
      }

      return notice;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Create notice error:", error);
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
