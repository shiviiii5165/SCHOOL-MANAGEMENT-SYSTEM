export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/student/exams — student's upcoming exams and eligibility
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id! },
      include: {
        class: true,
        hallTickets: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Get exams mapped to the student's class (status SCHEDULED or ONGOING)
    const exams = await prisma.exam.findMany({
      where: {
        status: { in: ["SCHEDULED", "ONGOING"] },
        slots: { some: { classId: student.classId } },
      },
      include: {
        slots: {
          where: { classId: student.classId },
          include: { subject: true },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { startDate: "asc" },
    });

    const settings = await prisma.systemSettings.findFirst();
    const threshold = settings?.detentionThreshold ?? 75;

    const formattedExams = exams.map(exam => {
      // Find hall ticket if published
      const hallTicket = student.hallTickets.find(ht => ht.examId === exam.id);

      // Default eligibility rules
      const attendanceLow = student.attendancePercentage < threshold;
      const isBlocked = hallTicket ? hallTicket.isBlocked : (student.isSuspended || !student.examEligible || attendanceLow);
      
      let blockReason = hallTicket?.blockReason;
      if (!blockReason && isBlocked) {
        if (student.isSuspended) blockReason = `Account suspended until ${new Date(student.suspendedUntil || new Date()).toLocaleDateString()}`;
        else if (!student.examEligible) blockReason = "Detained due to low attendance";
        else if (attendanceLow) blockReason = `Attendance ${student.attendancePercentage.toFixed(1)}% below required ${threshold}%`;
        else blockReason = "Blocked by administration";
      }

      return {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        academicYear: exam.academicYear,
        status: exam.status,
        startDate: exam.startDate,
        endDate: exam.endDate,
        isBlocked,
        blockReason,
        slots: exam.slots.map(slot => ({
          id: slot.id,
          subjectName: slot.subject.name,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: slot.room,
          maxMarks: slot.maxMarks,
        })),
      };
    });

    return NextResponse.json({ exams: formattedExams });
  } catch (error: any) {
    console.error("Error fetching student exams:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
