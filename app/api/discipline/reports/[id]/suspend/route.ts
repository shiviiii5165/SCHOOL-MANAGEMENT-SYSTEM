export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/security/apiGuard';
import { handleApiError } from '@/lib/security/errorHandler';
import { validate, DisciplineActionSchema } from '@/lib/security/schemas';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: authError } = await requireAuth(['ADMIN']);
    if (authError) return authError;

    const { id } = params;
    
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    
    // We expect { action: 'SUSPENSION', suspendedFrom, suspendedUntil, reason }
    // The existing route expected { adminNote, durationDays }
    // Let's adapt it or validate directly. The prompt specifies:
    // const { data, error } = validate(RelevantSchema, body);
    const { data, error: valError } = validate(DisciplineActionSchema, body);
    if (valError) return NextResponse.json({ error: `Validation failed: ${valError}` }, { status: 400 });
    
    // since we need backward compatibility with frontend if they send adminNote, durationDays:
    // The frontend must match the schema now, but to be safe we will extract from `data` if it is SUSPENSION
    if (data!.action !== 'SUSPENSION') {
      return NextResponse.json({ error: "Invalid action type for this endpoint" }, { status: 400 });
    }

    const report = await prisma.disciplineReport.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, parent: { include: { user: true } } } },
        teacher: { include: { user: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const fromDate = new Date((data as any).suspendedFrom);
    const untilDate = new Date((data as any).suspendedUntil);
    const adminNote = (data as any).reason;
    const { imposeFine, fineAmount, fineReason, fineDueDate } = data as any;

    const now = new Date();
    let updatedReport, updatedStudent;
    const invoiceNo = `FINE-${now.getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await prisma.$transaction(async (tx) => {
      let feeRecordId = null;

      if (imposeFine && fineAmount && fineDueDate) {
        const feeRecord = await tx.feeRecord.create({
          data: {
            studentId: report.studentId,
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

      updatedReport = await tx.disciplineReport.update({
        where: { id },
        data: {
          status: "SUSPENDED",
          adminNote,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          actionTaken: "SUSPENDED",
          actionType: imposeFine ? "SUSPENDED_WITH_FINE" : "SUSPENSION",
          suspendedFrom: fromDate,
          suspendedUntil: untilDate,
          ...fineData
        },
      });

      updatedStudent = await tx.student.update({
        where: { id: report.studentId },
        data: {
          isSuspended: true,
          suspendedReason: report.category,
          suspendedAt: new Date(),
          suspendedFrom: fromDate,
          suspendedUntil: untilDate,
        },
      });
    });

    const formatDate = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    
    // Detailed Notification Message
    const details = `\nReason: ${adminNote}\nPeriod: ${formatDate(fromDate)} to ${formatDate(untilDate)}\nStatus: ACTIVE`;

    // Create notifications for Student, Parent, and Teacher
    const notifications = [];
    
    // Teacher notification
    notifications.push({
      userId: report.teacher.userId,
      title: "Action Taken: Student Suspended",
      message: `✅ Action taken on your report for ${report.student.user.name}: Suspension ${imposeFine ? `+ Fine of ₹${fineAmount}` : ''} imposed.`,
      type: "DISCIPLINE" as "DISCIPLINE",
      link: "/teacher/discipline"
    });

    // Student notification
    let studentMsg = `You have been suspended. Your attendance and portal access are blocked.${details}`;
    if (imposeFine) studentMsg += `\n⚠ Disciplinary fine of ₹${fineAmount} imposed for ${fineReason}. Due by ${new Date(fineDueDate).toLocaleDateString()}. Contact admin for queries.`;
    
    notifications.push({
      userId: report.student.userId,
      title: "🚫 Account Suspended",
      message: studentMsg,
      type: "DISCIPLINE" as "DISCIPLINE",
      link: "/student"
    });

    // Parent notification (if linked)
    if (report.student.parent?.userId) {
      let parentMsg = `Your child ${report.student.user.name} has been suspended. Please contact the administration.${details}`;
      if (imposeFine) parentMsg = `⚠ A fine of ₹${fineAmount} has been imposed on ${report.student.user.name} (${report.student.rollNo}) for ${fineReason}. Due by ${new Date(fineDueDate).toLocaleDateString()}. Pay via the Fee Portal.\n` + parentMsg;

      notifications.push({
        userId: report.student.parent.userId,
        title: "🚫 Your Child Has Been Suspended",
        message: parentMsg,
        type: imposeFine ? ("FEE" as any) : ("DISCIPLINE" as "DISCIPLINE"),
        link: "/parent"
      });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({ success: true, report: updatedReport, student: updatedStudent });
  } catch (error) {
    return handleApiError(error, 'discipline/reports/[id]/suspend');
  }
}
