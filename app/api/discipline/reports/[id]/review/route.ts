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
    const { action, adminNote, imposeFine, fineAmount, fineReason, fineDueDate } = await req.json();

    if (!["DISMISSED", "RESOLVED_WARNING", "REVIEWED", "FINE_ONLY", "WARNING_WITH_FINE"].includes(action)) {
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
    const now = new Date();
    const invoiceNo = `FINE-${now.getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // We wrap everything in a transaction if we are doing multiple writes
    updatedReport = await prisma.$transaction(async (tx) => {
      let feeRecordId = null;

      if (imposeFine && fineAmount && fineDueDate) {
        const feeRecord = await tx.feeRecord.create({
          data: {
            studentId: reportDetails.studentId,
            feeType: "DISCIPLINE_FINE",
            amount: parseFloat(fineAmount),
            dueDate: new Date(fineDueDate),
            status: "UNPAID",
            invoiceId: invoiceNo,
          },
        });
        feeRecordId = feeRecord.id;
      }

      const fineData = feeRecordId ? {
        fineAmount: parseFloat(fineAmount),
        fineReason,
        fineDueDate: new Date(fineDueDate),
        fineStatus: "PENDING" as any,
        feeRecordId,
      } : {};

      if (action === "RESOLVED_WARNING" || action === "WARNING_WITH_FINE") {
        await tx.student.update({
          where: { id: reportDetails.studentId },
          data: { warningCount: { increment: 1 }, lastWarningAt: new Date(), lastWarningNote: adminNote },
        });

        return await tx.disciplineReport.update({
          where: { id },
          data: {
            status: "RESOLVED_WARNING",
            adminNote,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            actionTaken: action,
            actionType: action === "RESOLVED_WARNING" ? "WARNING" : "WARNING_WITH_FINE",
            ...fineData,
          },
        });
      } else if (action === "FINE_ONLY") {
        return await tx.disciplineReport.update({
          where: { id },
          data: {
            status: "REVIEWED",
            adminNote,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            actionTaken: action,
            actionType: "FINE_ONLY",
            ...fineData,
          },
        });
      } else {
        return await tx.disciplineReport.update({
          where: { id },
          data: {
            status: action === "REVIEWED" ? "REVIEWED" : action,
            adminNote,
            reviewedBy: session.user.id,
            reviewedAt: new Date(),
            actionTaken: action,
            ...fineData,
          },
        });
      }
    });

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
    } else if (action === "RESOLVED_WARNING" || action === "WARNING_WITH_FINE") {
      let msg = `An official warning has been issued to you. Reason: ${adminNote}`;
      if (imposeFine) msg += ` A fine of ₹${fineAmount} has also been imposed.`;

      notifications.push({
        userId: reportDetails.student.userId,
        title: '⚠️ Official Warning Issued',
        message: msg,
        type: 'DISCIPLINE' as "DISCIPLINE",
        link: '/student'
      });
      if (reportDetails.student.parent?.userId) {
        let parentMsg = `${reportDetails.student.user.name} received an official warning. Reason: ${adminNote}`;
        if (imposeFine) parentMsg = `⚠ A fine of ₹${fineAmount} has been imposed on ${reportDetails.student.user.name} (${reportDetails.student.rollNo}) for ${fineReason}. Due by ${new Date(fineDueDate).toLocaleDateString()}. Pay via the Fee Portal.`;
        
        notifications.push({
          userId: reportDetails.student.parent.userId,
          title: '⚠️ Warning Issued to Your Child',
          message: parentMsg,
          type: imposeFine ? ('FEE' as any) : ('DISCIPLINE' as "DISCIPLINE"),
          link: '/parent'
        });
      }
      notifications.push({
        userId: reportDetails.teacher.userId,
        title: 'Report Reviewed: Warning Issued',
        message: `✅ Action taken on your report for ${reportDetails.student.user.name}: Warning ${imposeFine ? `+ Fine of ₹${fineAmount}` : ''} imposed.`,
        type: 'DISCIPLINE' as "DISCIPLINE",
        link: '/teacher'
      });
    } else if (action === "FINE_ONLY" && imposeFine) {
      notifications.push({
        userId: reportDetails.student.userId,
        title: 'Disciplinary Fine Imposed',
        message: `⚠ Disciplinary fine of ₹${fineAmount} imposed for ${fineReason}. Due by ${new Date(fineDueDate).toLocaleDateString()}. Contact admin for queries.`,
        type: 'DISCIPLINE' as "DISCIPLINE",
        link: '/student'
      });
      if (reportDetails.student.parent?.userId) {
        notifications.push({
          userId: reportDetails.student.parent.userId,
          title: 'Disciplinary Fine Imposed',
          message: `⚠ A fine of ₹${fineAmount} has been imposed on ${reportDetails.student.user.name} (${reportDetails.student.rollNo}) for ${fineReason}. Due by ${new Date(fineDueDate).toLocaleDateString()}. Pay via the Fee Portal.`,
          type: 'FEE' as any,
          link: '/parent'
        });
      }
      notifications.push({
        userId: reportDetails.teacher.userId,
        title: 'Report Reviewed: Fine Imposed',
        message: `✅ Action taken on your report for ${reportDetails.student.user.name}: Fine of ₹${fineAmount} imposed.`,
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
