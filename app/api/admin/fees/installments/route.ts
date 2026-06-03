export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import { z } from "zod";

const InstallmentPlanSchema = z.object({
  feeRecordId: z.string().min(1),
  totalMonths: z.number().min(2, "Minimum 2 months required"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = InstallmentPlanSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }
    const { feeRecordId, totalMonths } = parsed.data;

    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id: feeRecordId }
    });

    if (!feeRecord) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }

    if (feeRecord.hasInstallmentPlan) {
      return NextResponse.json({ error: "This fee already has an installment plan" }, { status: 400 });
    }

    const outstanding = feeRecord.amount - feeRecord.paidAmount;
    if (outstanding <= 0) {
      return NextResponse.json({ error: "Fee is already fully paid" }, { status: 400 });
    }

    const monthlyAmount = Math.floor(outstanding / totalMonths);
    const remainder = outstanding - (monthlyAmount * totalMonths);

    await prisma.$transaction(async (tx) => {
      const plan = await tx.installmentPlan.create({
        data: {
          feeRecordId: feeRecord.id,
          studentId: feeRecord.studentId,
          createdByAdminId: session.user.id,
          totalMonths,
        }
      });

      const schedules = [];
      let currentDate = new Date(feeRecord.dueDate);
      
      // If due date has already passed, start installments from today
      if (currentDate < new Date()) {
        currentDate = new Date();
      }

      for (let i = 1; i <= totalMonths; i++) {
        let amountForThisMonth = monthlyAmount;
        if (i === totalMonths) {
          amountForThisMonth += remainder;
        }

        schedules.push({
          planId: plan.id,
          installmentNumber: i,
          amount: amountForThisMonth,
          dueDate: new Date(currentDate),
        });

        // Add 1 month for next installment
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      await tx.installmentSchedule.createMany({ data: schedules });

      await tx.feeRecord.update({
        where: { id: feeRecord.id },
        data: {
          hasInstallmentPlan: true,
          installmentPlanId: plan.id
        }
      });
    });

    return NextResponse.json({ success: true, message: "Installment plan created successfully." });

  } catch (error: any) {
    console.error("Error creating installment plan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
