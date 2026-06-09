export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    let studentIds: string[] = [];
    let parentName = "";

    if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
      if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      
      const students = await prisma.student.findMany({ where: { parentId: parent.id } });
      studentIds = students.map(s => s.id);
      parentName = session.user.name || "Parent";
    } else if (role === "STUDENT") {
      const student = await prisma.student.findUnique({ 
        where: { userId: session.user.id },
        include: { parent: { include: { user: { select: { name: true } } } } }
      });
      if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
      
      studentIds = [student.id];
      parentName = student.parent?.user?.name || "Parent";
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        feeRecord: true,
        student: { select: { rollNo: true, class: { select: { name: true, section: true } }, user: { select: { name: true } } } }
      },
      orderBy: { paymentDate: 'desc' }
    });

    return NextResponse.json({ success: true, payments, parentName });

  } catch (error: any) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
