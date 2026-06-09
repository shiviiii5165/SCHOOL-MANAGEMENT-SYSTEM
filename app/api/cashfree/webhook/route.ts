export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Cashfree Webhook Handler
 * 
 * This endpoint receives payment notifications directly from Cashfree servers.
 * It acts as a backup to the verify-payment flow — if the user's browser redirect
 * fails, this webhook ensures the payment is still recorded.
 * 
 * No auth middleware — Cashfree calls this with a signature for verification.
 */
export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    const timestamp = req.headers.get("x-cashfree-timestamp") || "";
    const signature = req.headers.get("x-cashfree-signature") || "";

    // Verify webhook signature
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret !== "your_webhook_secret_here") {
      const signedPayload = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(signedPayload)
        .digest("base64");

      if (signature !== expectedSignature) {
        console.error("Webhook signature verification failed");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type;
    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;

    if (!orderData?.order_id) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const orderId = orderData.order_id;

    // Fetch the pending order
    const pendingOrder = await prisma.cashfreePendingOrder.findUnique({
      where: { orderId },
    });

    if (!pendingOrder) {
      console.warn(`Webhook received for unknown order: ${orderId}`);
      return NextResponse.json({ received: true });
    }

    // Skip if already processed
    if (pendingOrder.status === "SUCCESS") {
      return NextResponse.json({ received: true, message: "Already processed" });
    }

    if (
      eventType === "PAYMENT_SUCCESS_WEBHOOK" &&
      paymentData?.payment_status === "SUCCESS"
    ) {
      // ── PAYMENT SUCCESS ──
      const cfPaymentId =
        paymentData.cf_payment_id?.toString() || `CF_WH_${Date.now()}`;
      const paymentMethod = paymentData.payment_group || "UNKNOWN";
      const paidAmount =
        paymentData.payment_amount || pendingOrder.amount;

      await prisma.$transaction(async (tx) => {
        // 1. Update pending order
        await tx.cashfreePendingOrder.update({
          where: { orderId },
          data: {
            status: "SUCCESS",
            transactionId: cfPaymentId,
            paymentMethod,
          },
        });

        // 2. Fetch invoice
        const invoice = await tx.feeRecord.findUnique({
          where: { id: pendingOrder.feeRecordId },
        });

        if (!invoice) return;

        // 3. Calculate late fine
        let lateFine = 0;
        if (invoice.dueDate < new Date() && invoice.status !== "PAID") {
          const daysOverdue = Math.floor(
            (new Date().getTime() - invoice.dueDate.getTime()) /
              (1000 * 60 * 60 * 24)
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
            transactionId: cfPaymentId,
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

        // 6. Handle overpayment
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
            data: {
              balance: wallet.balance + excess,
              lastUpdatedAt: new Date(),
            },
          });

          await tx.creditWalletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "CREDIT",
              amount: excess,
              reason: `Overpayment via Cashfree webhook - Order ${orderId}`,
              relatedFeeRecordId: pendingOrder.feeRecordId,
            },
          });
        }
      });

      console.log(`✅ Webhook: Payment SUCCESS for order ${orderId}`);
    } else if (
      eventType === "PAYMENT_FAILED_WEBHOOK" ||
      paymentData?.payment_status === "FAILED"
    ) {
      // ── PAYMENT FAILED ──
      await prisma.cashfreePendingOrder.update({
        where: { orderId },
        data: {
          status: "FAILED",
          failureReason:
            paymentData?.payment_message || "Payment failed via webhook",
        },
      });

      console.log(`❌ Webhook: Payment FAILED for order ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    // Always return 200 to prevent Cashfree from retrying
    return NextResponse.json({ received: true });
  }
}
