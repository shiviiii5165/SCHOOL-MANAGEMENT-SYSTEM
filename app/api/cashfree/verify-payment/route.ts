export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || "";
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
const IS_PRODUCTION = process.env.CASHFREE_ENV === "production";
const CASHFREE_BASE_URL = IS_PRODUCTION
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";

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

    // Fetch payment status from Cashfree via REST API
    const cfResponse = await fetch(
      `${CASHFREE_BASE_URL}/orders/${orderId}/payments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
        },
      }
    );

    const payments = await cfResponse.json();

    if (!cfResponse.ok || !Array.isArray(payments) || payments.length === 0) {
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

    const updatedFees = await getEnrichedFees(pendingOrder.studentId);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully!",
      transactionId: cfPaymentId,
      updatedFees,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}

async function processSuccessfulPayment(
  pendingOrder: any,
  transactionId: string,
  paymentMethod: string,
  paidAmount: number
) {
  await prisma.$transaction(async (tx) => {
    await tx.cashfreePendingOrder.update({
      where: { orderId: pendingOrder.orderId },
      data: {
        status: "SUCCESS",
        transactionId,
        paymentMethod,
      },
    });

    const invoice = await tx.feeRecord.findUnique({
      where: { id: pendingOrder.feeRecordId },
    });

    if (!invoice) return;

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

    // ----------------------------------------------------
    // Inform all Admins about the successful payment
    // ----------------------------------------------------
    const admins = await tx.user.findMany({ where: { role: "ADMIN" } });
    const studentInfo = await tx.student.findUnique({
      where: { id: pendingOrder.studentId },
      include: { user: true },
    });

    if (admins.length > 0 && studentInfo) {
      const notifications = admins.map((admin) => ({
        userId: admin.id,
        title: "New Fee Payment Received",
        message: `₹${paidAmount} received from ${studentInfo.user.name} for ${invoice.feeType} fee via ${paymentMethod}.`,
        type: "FEE" as any, // Using 'as any' to avoid TS errors if enum types are strictly imported
        link: "/admin/fees",
      }));

      await tx.notification.createMany({
        data: notifications,
      });
    }
  });
}

async function getEnrichedFees(studentId: string) {
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
