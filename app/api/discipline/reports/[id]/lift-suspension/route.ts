export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const { id } = params;

    const report = await prisma.disciplineReport.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, parent: { include: { user: true } } } },
        teacher: { include: { user: true } },
      },
    });

    if (!report || report.status !== "SUSPENDED") {
      return NextResponse.json({ error: "Report not found or not suspended" }, { status: 404 });
    }

    const [updatedReport, updatedStudent] = await prisma.$transaction([
      prisma.disciplineReport.update({
        where: { id },
        data: {
          status: "REVIEWED", // Changing back to reviewed
          resolvedAt: new Date(),
        },
      }),
      prisma.student.update({
        where: { id: report.studentId },
        data: {
          isSuspended: false,
          suspendedReason: null,
          suspendedAt: null,
          suspendedFrom: null,
          suspendedUntil: null,
        },
      }),
    ]);

    const details = `\nReason: Suspension lifted manually by Administration\nStatus: RESOLVED`;

    // Create notifications for Student, Parent, and Teacher
    const notifications = [];
    
    // Teacher notification
    notifications.push({
      userId: report.teacher.userId,
      title: "Action Taken: Suspension Lifted",
      message: `The suspension for student ${report.student.user.name} has been manually lifted early by the administration.${details}`,
      type: "DISCIPLINE" as "DISCIPLINE",
      link: "/teacher/discipline"
    });

    // Student notification
    notifications.push({
      userId: report.student.userId,
      title: "✅ Suspension Lifted",
      message: `Your suspension has been lifted early by the administration. Your attendance and portal access have been fully restored.${details}`,
      type: "DISCIPLINE" as "DISCIPLINE",
      link: "/student"
    });

    // Parent notification (if linked)
    if (report.student.parent?.userId) {
      notifications.push({
        userId: report.student.parent.userId,
        title: "✅ Your Child's Suspension Lifted",
        message: `Your child ${report.student.user.name}'s suspension has been lifted early by the administration.${details}`,
        type: "DISCIPLINE" as "DISCIPLINE",
        link: "/parent"
      });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({ success: true, report: updatedReport, student: updatedStudent });
  } catch (error) {
    console.error("Error lifting suspension:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
