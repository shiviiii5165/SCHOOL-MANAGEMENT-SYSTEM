export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/exams/[examId]/eligibility — check all students
export async function GET(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: { slots: true },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const classIds = exam.slots.map(s => s.classId).filter((v, i, a) => a.indexOf(v) === i);

    const settings = await prisma.systemSettings.findFirst();
    const threshold = settings?.detentionThreshold ?? 75;

    const students = await prisma.student.findMany({
      where: { classId: { in: classIds } },
      include: {
        user: true,
        class: true,
        hallTickets: { where: { examId: params.examId } },
      },
      orderBy: { rollNo: "asc" },
    });

    const eligibility = students.map(s => {
      const hallTicket = s.hallTickets[0];
      const attendanceLow = s.attendancePercentage < threshold;
      return {
        id: s.id,
        studentId: s.id,
        name: s.user.name,
        regId: s.user.regId,
        rollNo: s.rollNo,
        className: `${s.class.name} - ${s.class.section}`,
        attendancePercentage: s.attendancePercentage,
        isSuspended: s.isSuspended,
        examEligible: s.examEligible,
        attendanceLow,
        isBlocked: hallTicket?.isBlocked ?? (s.isSuspended || !s.examEligible || attendanceLow),
        blockReason: hallTicket?.blockReason ?? null,
        hallTicketId: hallTicket?.id ?? null,
      };
    });

    return NextResponse.json({ eligibility, threshold });
  } catch (error: any) {
    console.error("Error checking eligibility:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
