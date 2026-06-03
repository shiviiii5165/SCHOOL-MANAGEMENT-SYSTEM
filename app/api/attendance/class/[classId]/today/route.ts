export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await prisma.attendance.findMany({
      where: {
        classId: params.classId,
        date: { gte: today, lt: tomorrow },
      },
      include: {
        student: {
          select: {
            rollNo: true,
            user: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        student: { rollNo: 'asc' }
      }
    });

    const studentsMap = records.map(r => ({
      id: r.studentId,
      rollNo: r.student.rollNo,
      name: r.student.user.name,
      status: r.status,
    }));

    return NextResponse.json({ records: studentsMap });
  } catch (error: any) {
    console.error("Error fetching class today attendance:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
