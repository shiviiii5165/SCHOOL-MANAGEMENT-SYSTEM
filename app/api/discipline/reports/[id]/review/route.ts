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
    const { action, adminNote } = await req.json(); // action: "DISMISSED" | "RESOLVED_WARNING"

    if (!["DISMISSED", "RESOLVED_WARNING", "REVIEWED"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Need to get student details to update warning count and notify parents/students
    const reportDetails = await prisma.disciplineReport.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, parent: { include: { user: true } } } },
        teacher: { include: { user: true } },
      },
    });

    if (!reportDetails) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    let updatedReport;
    
    if (action === "RESOLVED_WARNING") {
      const transactionResult = await prisma.$transaction([
        prisma.disciplineReport.update({
          where: { id },
          data: {
            status: "RESOLVED_WARNING",
            adminNote,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            actionTaken: "WARNING",
            actionType: "WARNING",
          },
        }),
        prisma.student.update({
          where: { id: reportDetails.studentId },
          data: { warningCount: { increment: 1 }, lastWarningAt: new Date(), lastWarningNote: adminNote },
        }),
      ]);
      updatedReport = transactionResult[0];
    } else {
      updatedReport = await prisma.disciplineReport.update({
        where: { id },
        data: {
          status: action === "REVIEWED" ? "REVIEWED" : action,
          adminNote,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          actionTaken: action,
        },
      });
    }

    // Build notifications for all three stakeholders
    const notifications: any[] = [];
    
    if (action === "DISMISSED") {
      notifications.push({
        userId: reportDetails.student.userId,
        title: 'Incident Dismissed',
        message: `Your incident report (${reportDetails.category}) has been reviewed and dismissed.`,
        type: 'DISCIPLINE' as "DISCIPLINE",
        link: '/student'
      });
      if (reportDetails.student.parent?.userId) {
        notifications.push({
          userId: reportDetails.student.parent.userId,
          title: 'Incident Dismissed',
          message: `${reportDetails.student.user.name}'s incident report has been dismissed by the administration.`,
          type: 'DISCIPLINE' as "DISCIPLINE",
          link: '/parent'
        });
      }
      notifications.push({
        userId: reportDetails.teacher.userId,
        title: 'Report Reviewed',
        message: `Your discipline report for ${reportDetails.student.user.name} has been dismissed.`,
        type: 'DISCIPLINE' as "DISCIPLINE",
        link: '/teacher'
      });
    } else if (action === "RESOLVED_WARNING") {
      notifications.push({
        userId: reportDetails.student.userId,
        title: '⚠️ Official Warning Issued',
        message: `An official warning has been issued to you. Reason: ${adminNote}`,
        type: 'DISCIPLINE' as "DISCIPLINE",
        link: '/student'
      });
      if (reportDetails.student.parent?.userId) {
        notifications.push({
          userId: reportDetails.student.parent.userId,
          title: '⚠️ Warning Issued to Your Child',
          message: `${reportDetails.student.user.name} received an official warning. Reason: ${adminNote}`,
          type: 'DISCIPLINE' as "DISCIPLINE",
          link: '/parent'
        });
      }
      notifications.push({
        userId: reportDetails.teacher.userId,
        title: 'Report Reviewed: Warning Issued',
        message: `Your discipline report for ${reportDetails.student.user.name} resulted in a warning.`,
        type: 'DISCIPLINE' as "DISCIPLINE",
        link: '/teacher'
      });
    } else {
      // Just marked as REVIEWED (no explicit action yet)
      notifications.push({
        userId: reportDetails.teacher.userId,
        title: "Discipline Report Reviewed",
        message: `Your report has been marked as ${action}.`,
        type: "DISCIPLINE" as "DISCIPLINE",
      });
    }

    if (notifications.length > 0) {
      const { createNotifications } = await import("@/lib/notifications");
      await createNotifications(notifications);
    }

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error) {
    console.error("Error reviewing report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
