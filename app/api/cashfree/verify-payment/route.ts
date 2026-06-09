export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Cashfree: CashfreeSDK, CFEnvironment } = require("cashfree-pg");
import crypto from "crypto";

// Initialize Cashfree SDK instance
const cashfree = new CashfreeSDK(
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY,
  process.env.CASHFREE_ENV === "production"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX
);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    // Fetch pending order from our DB
    const pendingOrder = await prisma.cashfreePendingOrder.findUnique({
      where: { orderId },
    });

    if (!pendingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // If already processed as SUCCESS, return the updated fees immediately
    if (pendingOrder.status === "SUCCESS") {
      const updatedFees = await getEnrichedFees(pendingOrder.studentId);
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
        transactionId: pendingOrder.transactionId,
        updatedFees,
      });
    }

    // Fetch payment status from Cashfree
    const response = await cashfree.PGOrderFetchPayments("2023-08-01", orderId);
    const payments = response.data;

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No payments found for this order. Payment may still be processing.",
        status: "PENDING",
      });
    }

    // Find the successful payment
    const successPayment = payments.find(
      (p: any) => p.payment_status === "SUCCESS"
    );

    if (!successPayment) {
      // Check if there's a failed payment
      const failedPayment = payments.find(
        (p: any) => p.payment_status === "FAILED" || p.payment_status === "CANCELLED"
      );

      if (failedPayment) {
        await prisma.cashfreePendingOrder.update({
          where: { orderId },
          data: {
            status: "FAILED",
            failureReason: failedPayment.payment_message || "Payment failed",
          },
        });
      }

      return NextResponse.json({
        success: false,
        message: failedPayment
          ? "Payment failed: " + (failedPayment.payment_message || "Unknown error")
          : "Payment is still processing",
        status: failedPayment ? "FAILED" : "PENDING",
      });
    }

    // Payment SUCCESS — process it
    const cfPaymentId = successPayment.cf_payment_id?.toString() || `CF_${Date.now()}`;
    const paymentMethod = successPayment.payment_group || "UNKNOWN";

    await processSuccessfulPayment(
      pendingOrder,
      cfPaymentId,
      paymentMethod,
      successPayment.payment_amount || pendingOrder.amount
    );

    // Fetch updated fees for the student(s) of this parent
    const updatedFees = await getEnrichedFees(pendingOrder.studentId);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully!",
      transactionId: cfPaymentId,
      updatedFees,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error?.response?.data || error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

/**
 * Process a successful payment — mark fee as PAID, create Payment record, update PendingOrder
 */
async function processSuccessfulPayment(
  pendingOrder: any,
  transactionId: string,
  paymentMethod: string,
  paidAmount: number
) {
  await prisma.$transaction(async (tx) => {
    // 1. Update CashfreePendingOrder status
    await tx.cashfreePendingOrder.update({
      where: { orderId: pendingOrder.orderId },
      data: {
        status: "SUCCESS",
        transactionId,
        paymentMethod,
      },
    });

    // 2. Fetch the invoice
    const invoice = await tx.feeRecord.findUnique({
      where: { id: pendingOrder.feeRecordId },
    });

    if (!invoice) return;

    // 3. Calculate late fine
    let lateFine = 0;
    if (invoice.dueDate < new Date() && invoice.status !== "PAID") {
      const daysOverdue = Math.floor(
        (new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const monthsOverdue = Math.floor(daysOverdue / 30);
      if (monthsOverdue > 0) {
        lateFine = invoice.amount * 0.02 * monthsOverdue;
      }
    }

    const totalDue = invoice.amount + lateFine;
    const newPaidAmount = invoice.paidAmount + paidAmount;
    const remaining = totalDue - newPaidAmount;
    const newStatus = remaining <= 0 ? "PAID" : "PARTIAL";

    // 4. Create Payment record
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    await tx.payment.create({
      data: {
        studentId: pendingOrder.studentId,
        feeRecordId: pendingOrder.feeRecordId,
        amount: paidAmount,
        paymentMode: paymentMethod,
        transactionId,
        receiptNumber,
      },
    });

    // 5. Update FeeRecord
    await tx.feeRecord.update({
      where: { id: pendingOrder.feeRecordId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        lastPaymentAt: new Date(),
        paidDate: newStatus === "PAID" ? new Date() : invoice.paidDate,
        paymentMode: paymentMethod,
      },
    });

    // 6. Handle overpayment — credit to wallet
    if (remaining < 0) {
      const excess = Math.abs(remaining);
      let wallet = await tx.creditWallet.findUnique({
        where: { studentId: pendingOrder.studentId },
      });

      if (!wallet) {
        wallet = await tx.creditWallet.create({
          data: { studentId: pendingOrder.studentId, balance: 0 },
        });
      }

      await tx.creditWallet.update({
        where: { id: wallet.id },
        data: { balance: wallet.balance + excess, lastUpdatedAt: new Date() },
      });

      await tx.creditWalletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: excess,
          reason: `Overpayment on Invoice ${pendingOrder.feeRecordId} via Cashfree`,
          relatedFeeRecordId: pendingOrder.feeRecordId,
        },
      });
    }
  });
}

/**
 * Fetch enriched fee records for all students under the same parent
 * Returns the same format as /api/fees/dashboard for instant UI update
 */
async function getEnrichedFees(studentId: string) {
  // Find the parent of this student to get all sibling students
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { parent: { include: { students: true } } },
  });

  const studentIds = student?.parent
    ? student.parent.students.map((s) => s.id)
    : [studentId];

  const feeRecords = await prisma.feeRecord.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      student: {
        select: {
          id: true,
          user: { select: { name: true } },
          hasTransport: true,
        },
      },
      installmentPlans: {
        include: {
          schedules: { orderBy: { installmentNumber: "asc" } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Enrich with dynamic statuses (same logic as /api/fees/dashboard)
  return feeRecords.map((record) => {
    let lateFine = 0;
    let dynamicStatus = record.status;
    const now = new Date();
    const dueDate = new Date(record.dueDate);

    if (record.status !== "PAID") {
      if (dueDate < now) {
        const daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const monthsOverdue = Math.floor(daysOverdue / 30);
        if (monthsOverdue > 0) {
          lateFine = record.amount * 0.02 * monthsOverdue;
        }
        dynamicStatus = record.paidAmount > 0 ? "PARTIAL" : "OVERDUE";
      } else {
        const daysToDue = Math.floor(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysToDue <= 15) {
          dynamicStatus = record.paidAmount > 0 ? "PARTIAL" : "DUE SOON";
        } else {
          dynamicStatus = record.paidAmount > 0 ? "PARTIAL" : "UNPAID";
        }
      }
    }

    return {
      ...record,
      lateFine,
      dynamicStatus,
      outstandingAmount: record.amount + lateFine - record.paidAmount,
    };
  });
}
