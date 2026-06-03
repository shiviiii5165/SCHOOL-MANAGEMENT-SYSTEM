export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = params;

    // Get or compute summary
    let summary = await prisma.attendanceSummary.findUnique({
      where: { studentId },
    });

    if (!summary) {
      // Compute from raw attendance records
      const records = await prisma.attendance.findMany({ where: { studentId } });
      const totalClasses = records.length;
      const presentCount = records.filter((r) => r.status === "PRESENT").length;
      const absentCount = records.filter((r) => r.status === "ABSENT").length;
      const lateCount = records.filter((r) => r.status === "LATE").length;
      const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 100;

      summary = await prisma.attendanceSummary.create({
        data: {
          studentId,
          totalClasses,
          presentCount,
          absentCount,
          lateCount,
          attendancePercentage,
        },
      });
    }

    // Also get student detention info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        examEligible: true,
        detainedAt: true,
        detainedReason: true,
        attendancePercentage: true,
      },
    });

    return NextResponse.json({ summary, student });
  } catch (error) {
    console.error("Error fetching student summary:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
