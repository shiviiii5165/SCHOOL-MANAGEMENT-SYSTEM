export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = session.user.role;
    
    let students = [];

    if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
      if (!parent) return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
      students = await prisma.student.findMany({ 
        where: { parentId: parent.id },
        include: { user: { select: { name: true } } }
      });
    } else if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ 
        where: { userId: session.user.id },
        include: { user: { select: { name: true } } }
      });
      if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      students = [student];
    } else {
      return NextResponse.json({ error: "Invalid role for this endpoint" }, { status: 403 });
    }

    const studentIds = students.map(s => s.id);

    // Fetch fee records
    const feeRecords = await prisma.feeRecord.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: {
          select: { id: true, user: { select: { name: true } }, hasTransport: true }
        },
        installmentPlans: {
          include: {
            schedules: { orderBy: { installmentNumber: 'asc' } }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Fetch payments
    const payments = await prisma.payment.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    // Fetch wallets
    const wallets = await prisma.creditWallet.findMany({
      where: { studentId: { in: studentIds } }
    });

    // Calculate dynamic statuses
    const enrichedRecords = feeRecords.map(record => {
      let lateFine = 0;
      let dynamicStatus = record.status;
      
      const now = new Date();
      const dueDate = new Date(record.dueDate);
      
      if (record.status !== 'PAID') {
        if (dueDate < now) {
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const monthsOverdue = Math.floor(daysOverdue / 30);
          if (monthsOverdue > 0) {
            lateFine = record.amount * 0.02 * monthsOverdue;
          }
          dynamicStatus = record.paidAmount > 0 ? 'PARTIAL' : 'OVERDUE';
        } else {
          const daysToDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysToDue <= 15) {
            dynamicStatus = record.paidAmount > 0 ? 'PARTIAL' : 'DUE SOON';
          } else {
            dynamicStatus = record.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
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

    return NextResponse.json({
      success: true,
      students,
      feeRecords: enrichedRecords,
      payments,
      wallets
    });

  } catch (error: any) {
    console.error("Error fetching fee dashboard data:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
