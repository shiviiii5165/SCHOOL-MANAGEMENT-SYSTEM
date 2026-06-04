export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

import { z } from "zod";

const PaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().min(500, "Minimum payment amount is ₹500"),
  paymentMode: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER"]),
  transactionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    if (!['ADMIN', 'STUDENT', 'PARENT'].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = PaymentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }
    const { invoiceId, amount, paymentMode, transactionId } = parsed.data;

    // 1. Fetch Invoice
    const invoice = await prisma.feeRecord.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Ownership check: STUDENT can only pay own invoices, PARENT can only pay children's
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
      if (!student || student.id !== invoice.studentId) {
        return NextResponse.json({ error: "You can only pay your own invoices" }, { status: 403 });
      }
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId: session.user.id }, include: { students: true } });
      if (!parent || !parent.students.some(s => s.id === invoice.studentId)) {
        return NextResponse.json({ error: "Invoice does not belong to your child" }, { status: 403 });
      }
    }

    // Calculate Late Fine (2% per month overdue)
    let lateFine = 0;
    if (invoice.dueDate < new Date() && invoice.status !== 'PAID') {
      const daysOverdue = Math.floor((new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthsOverdue = Math.floor(daysOverdue / 30);
      if (monthsOverdue > 0) {
        lateFine = invoice.amount * 0.02 * monthsOverdue;
      }
    }

    const currentOutstanding = invoice.amount + lateFine - invoice.paidAmount;

    if (amount > currentOutstanding + 1) {
      // Overpayment Handling
      const excess = amount - currentOutstanding;
      const actualPayment = currentOutstanding;
      
      await prisma.$transaction(async (tx) => {
        // Create Payment Record for actual
        const receiptNumber = `RCP-${new Date().getFullYear()}-${Date.now()}-${crypto.randomUUID().slice(0,6)}`;
        await tx.payment.create({
          data: {
            studentId: invoice.studentId,
            feeRecordId: invoice.id,
            amount: actualPayment,
            paymentMode,
            transactionId,
            receiptNumber,
          }
        });

        // Update Invoice
        await tx.feeRecord.update({
          where: { id: invoice.id },
          data: {
            paidAmount: invoice.amount + lateFine,
            status: 'PAID',
            lastPaymentAt: new Date(),
            paidDate: new Date(),
          }
        });

        // Add excess to Credit Wallet
        let wallet = await tx.creditWallet.findUnique({
          where: { studentId: invoice.studentId }
        });
        
        if (!wallet) {
          wallet = await tx.creditWallet.create({
            data: { studentId: invoice.studentId, balance: 0 }
          });
        }

        await tx.creditWallet.update({
          where: { id: wallet.id },
          data: { balance: wallet.balance + excess, lastUpdatedAt: new Date() }
        });

        await tx.creditWalletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: excess,
            reason: `Overpayment on Invoice ${invoice.id}`,
            relatedFeeRecordId: invoice.id
          }
        });
      });

      return NextResponse.json({ success: true, message: `Payment successful. ₹${excess} added to Credit Wallet.` });
    } else {
      // Normal / Partial Payment
      await prisma.$transaction(async (tx) => {
        const receiptNumber = `RCP-${new Date().getFullYear()}-${Date.now()}-${crypto.randomUUID().slice(0,6)}`;
        await tx.payment.create({
          data: {
            studentId: invoice.studentId,
            feeRecordId: invoice.id,
            amount: amount,
            paymentMode,
            transactionId,
            receiptNumber,
          }
        });

        const newPaidAmount = invoice.paidAmount + amount;
        const remaining = invoice.amount + lateFine - newPaidAmount;
        
        const newStatus = remaining <= 0 ? 'PAID' : 'PARTIAL';

        await tx.feeRecord.update({
          where: { id: invoice.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
            lastPaymentAt: new Date(),
            paidDate: newStatus === 'PAID' ? new Date() : invoice.paidDate,
          }
        });

        // If there's an installment plan, find the pending schedule and mark it
        if (invoice.hasInstallmentPlan && invoice.installmentPlanId) {
          const schedule = await tx.installmentSchedule.findFirst({
            where: { planId: invoice.installmentPlanId, status: 'PENDING' },
            orderBy: { installmentNumber: 'asc' }
          });
          if (schedule) {
            // Simplified handling for installments
            await tx.installmentSchedule.update({
              where: { id: schedule.id },
              data: { status: 'PAID', paidAt: new Date() }
            });
            
            // Check if all are paid
            const pendingSchedules = await tx.installmentSchedule.count({
              where: { planId: invoice.installmentPlanId, status: 'PENDING' }
            });
            if (pendingSchedules === 0) {
              await tx.installmentPlan.update({
                where: { id: invoice.installmentPlanId },
                data: { status: 'COMPLETED' }
              });
            }
          }
        }
      });

      return NextResponse.json({ success: true, message: "Payment processed successfully." });
    }

  } catch (error: any) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
