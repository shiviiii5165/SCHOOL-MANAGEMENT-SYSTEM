export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";

/**
 * Cashfree Create Order — uses raw fetch instead of SDK to avoid
 * constructor/type issues with the cashfree-pg package.
 */

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

    // Validate credentials are present
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error("Missing Cashfree credentials:", {
        hasAppId: !!CASHFREE_APP_ID,
        hasSecretKey: !!CASHFREE_SECRET_KEY,
      });
      return NextResponse.json(
        { error: "Payment gateway not configured. Contact admin." },
        { status: 500 }
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

    // Sanitize customer_id — Cashfree requires alphanumeric + _ - . Using phone number for readability in dashboard.
    const phone = (parentUser?.phone || "9999999999").replace(/[^0-9]/g, "").slice(-10);
    const customerId = `CUST_${phone}`;

    // Build return URL using URL constructor for proper encoding
    const returnPath = role === "STUDENT" ? "/student/fees" : "/parent/fees";
    const baseUrl = frontendUrl.trim().replace(/\/+$/, "");
    const returnUrl = new URL(`${baseUrl}${returnPath}`);
    returnUrl.searchParams.set("order_id", orderId);
    returnUrl.searchParams.set("fee_id", invoiceId);
    const returnUrlString = returnUrl.toString();

    // Build order payload
    const orderPayload = {
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_name: (parentUser?.name || session.user.name || "Parent").slice(0, 100),
        customer_email: parentUser?.email || session.user.email || "parent@school.com",
        customer_phone: (parentUser?.phone || "9999999999").replace(/[^0-9]/g, "").slice(-10),
      },
      order_meta: {
        return_url: returnUrlString,
      },
      order_note: `Fee payment for ${invoice.feeType} - ${invoice.student.user.name}`,
    };

    console.log("Creating Cashfree order:", {
      url: `${CASHFREE_BASE_URL}/orders`,
      env: IS_PRODUCTION ? "PRODUCTION" : "SANDBOX",
      appId: CASHFREE_APP_ID.slice(0, 8) + "...",
      orderId,
      amount,
      returnUrl: returnUrlString,
    });

    // Call Cashfree REST API directly
    const cfResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(orderPayload),
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok) {
      console.error("Cashfree API error:", {
        status: cfResponse.status,
        data: cfData,
      });
      return NextResponse.json(
        {
          error: cfData?.message || `Cashfree error: ${cfResponse.status}`,
          details: cfData,
        },
        { status: cfResponse.status }
      );
    }

    if (!cfData?.payment_session_id) {
      console.error("Cashfree order missing payment_session_id:", cfData);
      return NextResponse.json(
        { error: "Payment gateway returned invalid response" },
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
        paymentSessionId: cfData.payment_session_id,
        status: "CREATED",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: orderId,
      paymentSessionId: cfData.payment_session_id,
    });
  } catch (error: any) {
    console.error("Error creating Cashfree order:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error while creating payment order" },
      { status: 500 }
    );
  }
}
