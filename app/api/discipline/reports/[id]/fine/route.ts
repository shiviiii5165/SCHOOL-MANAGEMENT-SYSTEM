import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from '@/lib/security/apiGuard';
import { handleApiError } from '@/lib/security/errorHandler';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, error: authError } = await requireAuth(['ADMIN']);
    if (authError) return authError;

    const { id } = params;
    const body = await req.json().catch(() => null);
    if (!body || !body.action) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const { action, fineAmount, fineReason, fineDueDate } = body;

    const report = await prisma.disciplineReport.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, parent: { include: { user: true } } } },
        teacher: { include: { user: true } },
      },
    });

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    const notifications: any[] = [];

    let updatedReport;

    if (action === "WAIVE") {
      if (!report.feeRecordId) return NextResponse.json({ error: "No fine attached" }, { status: 400 });

      updatedReport = await prisma.$transaction(async (tx) => {
        await tx.feeRecord.update({
          where: { id: report.feeRecordId! },
          data: { status: "WAIVED" },
        });

        return await tx.disciplineReport.update({
          where: { id },
          data: { fineStatus: "WAIVED" },
        });
      });

      notifications.push({
        userId: report.student.userId,
        title: "Fine Waived",
        message: `Your disciplinary fine of ₹${report.fineAmount} has been waived.`,
        type: "FEE" as any,
        link: "/student"
      });

    } else if (action === "MARK_PAID") {
      if (!report.feeRecordId) return NextResponse.json({ error: "No fine attached" }, { status: 400 });

      updatedReport = await prisma.$transaction(async (tx) => {
        await tx.feeRecord.update({
          where: { id: report.feeRecordId! },
          data: { 
            status: "PAID",
            paidDate: new Date(),
            paidAmount: report.fineAmount || 0,
          },
        });

        return await tx.disciplineReport.update({
          where: { id },
          data: { 
            fineStatus: "PAID",
            finePaidAt: new Date(),
            finePaidAmount: report.fineAmount,
          },
        });
      });

    } else if (action === "ADD") {
      if (report.feeRecordId) return NextResponse.json({ error: "Fine already exists" }, { status: 400 });

      const now = new Date();
      const invoiceNo = `FINE-${now.getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      updatedReport = await prisma.$transaction(async (tx) => {
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

        return await tx.disciplineReport.update({
          where: { id },
          data: {
            fineAmount: parseFloat(fineAmount),
            fineReason,
            fineDueDate: new Date(fineDueDate),
            fineStatus: "PENDING",
            feeRecordId: feeRecord.id,
            actionType: report.actionType === "WARNING" ? "WARNING_WITH_FINE" : 
                        report.actionType === "SUSPENSION" ? "SUSPENDED_WITH_FINE" : 
                        report.actionType,
          },
        });
      });

      let parentMsg = `⚠ A retroactive fine of ₹${fineAmount} has been imposed on ${report.student.user.name} for ${fineReason}. Due by ${new Date(fineDueDate).toLocaleDateString()}.`;
      if (report.student.parent?.userId) {
        notifications.push({
          userId: report.student.parent.userId,
          title: "Retroactive Fine Imposed",
          message: parentMsg,
          type: "FEE" as any,
          link: "/parent"
        });
      }
      notifications.push({
        userId: report.student.userId,
        title: "Retroactive Fine Imposed",
        message: `⚠ A fine of ₹${fineAmount} has been imposed for ${fineReason}.`,
        type: "FEE" as any,
        link: "/student"
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return NextResponse.json({ success: true, report: updatedReport });

  } catch (error) {
    return handleApiError(error, 'discipline/reports/[id]/fine');
  }
}
