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

    const role = session.user.role;
    if (!["PARENT", "STUDENT"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { invoiceId, amount, paymentMode } = body;

    if (!invoiceId || !amount || amount < 1) {
      return NextResponse.json(
        { error: "invoiceId and amount (≥ ₹1) are required" },
        { status: 400 }
      );
    }

    // Fetch the fee record
    const invoice = await prisma.feeRecord.findUnique({
      where: { id: invoiceId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            parent: {
              include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Ownership verification
    let parentUser: { id: string; name: string; email: string; phone: string } | null = null;
    let parentId = "";

    if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { userId: session.user.id },
        include: { students: true, user: { select: { id: true, name: true, email: true, phone: true } } },
      });
      if (!parent || !parent.students.some((s) => s.id === invoice.studentId)) {
        return NextResponse.json(
          { error: "Invoice does not belong to your child" },
          { status: 403 }
        );
      }
      parentId = parent.id;
      parentUser = parent.user;
    } else if (role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { userId: session.user.id },
        include: {
          parent: {
            include: { user: { select: { id: true, name: true, email: true, phone: true } } },
          },
        },
      });
      if (!student || student.id !== invoice.studentId) {
        return NextResponse.json(
          { error: "You can only pay your own invoices" },
          { status: 403 }
        );
      }
      parentId = student.parentId || "";
      parentUser = student.parent?.user || null;
    }

    // Generate unique order ID
    const orderId = `EDUCORE_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Create Cashfree Order
    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: parentId || session.user.id,
        customer_name: parentUser?.name || session.user.name || "Parent",
        customer_email: parentUser?.email || session.user.email || "parent@school.com",
        customer_phone: parentUser?.phone || "9999999999",
      },
      order_meta: {
        return_url: `${frontendUrl}/parent/fees?order_id=${orderId}&payment_status={payment_status}&fee_id=${invoiceId}`,
      },
      order_note: `Fee payment for ${invoice.feeType} - ${invoice.student.user.name}`,
    };

    const response = await cashfree.PGCreateOrder("2023-08-01", orderRequest);
    const orderData = response.data;

    if (!orderData?.payment_session_id) {
      console.error("Cashfree order creation failed:", orderData);
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500 }
      );
    }

    // Save PendingOrder to DB
    await prisma.cashfreePendingOrder.create({
      data: {
        orderId: orderId,
        feeRecordId: invoiceId,
        parentId: parentId,
        studentId: invoice.studentId,
        amount: amount,
        paymentSessionId: orderData.payment_session_id,
        status: "CREATED",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: orderId,
      paymentSessionId: orderData.payment_session_id,
    });
  } catch (error: any) {
    console.error("Error creating Cashfree order:", error?.response?.data || error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
