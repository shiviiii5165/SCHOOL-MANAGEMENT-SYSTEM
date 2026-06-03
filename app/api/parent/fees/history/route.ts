export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
    if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });

    const students = await prisma.student.findMany({ where: { parentId: parent.id } });
    const studentIds = students.map(s => s.id);

    const payments = await prisma.payment.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        feeRecord: true,
        student: { select: { rollNo: true, class: { select: { name: true, section: true } }, user: { select: { name: true } } } }
      },
      orderBy: { paymentDate: 'desc' }
    });

    return NextResponse.json({ success: true, payments, parentName: session.user.name });

  } catch (error: any) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
