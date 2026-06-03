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

    const [updatedReport, updatedStudent] = await prisma.$transaction([
      prisma.disciplineReport.update({
        where: { id },
        data: {
          status: "SUSPENDED",
          adminNote,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          actionTaken: "SUSPENDED",
          actionType: "SUSPENSION",
          suspendedFrom: fromDate,
          suspendedUntil: untilDate,
        },
      }),
      prisma.student.update({
        where: { id: report.studentId },
        data: {
          isSuspended: true,
          suspendedReason: report.category,
          suspendedAt: new Date(),
          suspendedFrom: fromDate,
          suspendedUntil: untilDate,
        },
      }),
    ]);

    const formatDate = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    
    // Detailed Notification Message
    const details = `\nReason: ${adminNote}\nPeriod: ${formatDate(fromDate)} to ${formatDate(untilDate)}\nStatus: ACTIVE`;

    // Create notifications for Student, Parent, and Teacher
    const notifications = [];
    
    // Teacher notification
    notifications.push({
      userId: report.teacher.userId,
      title: "Action Taken: Student Suspended",
      message: `Student ${report.student.user.name} has been suspended based on your report (${report.category}).${details}`,
      type: "DISCIPLINE" as "DISCIPLINE",
      link: "/teacher/discipline"
    });

    // Student notification
    notifications.push({
      userId: report.student.userId,
      title: "🚫 Account Suspended",
      message: `You have been suspended. Your attendance and portal access are blocked.${details}`,
      type: "DISCIPLINE" as "DISCIPLINE",
      link: "/student"
    });

    // Parent notification (if linked)
    if (report.student.parent?.userId) {
      notifications.push({
        userId: report.student.parent.userId,
        title: "🚫 Your Child Has Been Suspended",
        message: `Your child ${report.student.user.name} has been suspended. Please contact the administration.${details}`,
        type: "DISCIPLINE" as "DISCIPLINE",
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
