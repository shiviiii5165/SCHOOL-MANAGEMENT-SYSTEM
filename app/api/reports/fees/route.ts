import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feeRecords = await prisma.feeRecord.findMany();

    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    const paymentMethods: Record<string, number> = {};
    const monthlyRevenue: Record<string, number> = {};

    feeRecords.forEach(record => {
      if (record.status === "PAID") {
        totalCollected += record.amount;
        
        const method = record.paymentMode || "Cash";
        paymentMethods[method] = (paymentMethods[method] || 0) + record.amount;

        if (record.paidDate) {
          const month = new Date(record.paidDate).toLocaleString('default', { month: 'short' });
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + record.amount;
        }
      } else if (record.status === "OVERDUE" || (record.dueDate < new Date() && record.status === "PENDING")) {
        totalOverdue += record.amount;
        totalPending += record.amount;
      } else if (record.status === "PENDING") {
        totalPending += record.amount;
      }
    });

    const monthlyRevenueChart = Object.keys(monthlyRevenue).map(month => ({
      name: month,
      amount: monthlyRevenue[month]
    }));

    const paymentMethodChart = Object.keys(paymentMethods).map(method => ({
      name: method,
      value: paymentMethods[method]
    }));

    return NextResponse.json({
      summary: {
        totalCollected,
        totalPending,
        totalOverdue
      },
      monthlyRevenueChart,
      paymentMethodChart
    });

  } catch (error) {
    console.error("Error fetching fee analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
