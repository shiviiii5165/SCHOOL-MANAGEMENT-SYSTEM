export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { classId: string; date: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { classId, date } = params;
    const parsedDate = new Date(date);

    // Fetch students in this class, ordered by rollNo
    const students = await prisma.student.findMany({
      where: { classId },
      include: {
        user: {
          select: { name: true, regId: true, avatar: true },
        },
        attendanceSummary: true,
      },
      orderBy: { rollNo: "asc" },
    });

    // Fetch existing attendance for this class+date
    const existingAttendance = await prisma.attendance.findMany({
      where: {
        classId,
        date: parsedDate,
      },
      select: {
        studentId: true,
        status: true,
      },
    });

    const totalClassesHeld = await prisma.dailyAttendanceLog.count({
      where: { classId }
    });

    return NextResponse.json({ students, existingAttendance, totalClassesHeld });
  } catch (error) {
    console.error("Error fetching class attendance:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
