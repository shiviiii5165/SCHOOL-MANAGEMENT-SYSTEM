export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/teacher/exams — teacher's exams and pending slots
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id! },
      include: { subjects: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const subjectIds = teacher.subjects.map(s => s.id);

    // Get exams that have at least one slot assigned to this teacher
    // Status must be SCHEDULED, ONGOING, or MARKS_ENTRY to be relevant
    const exams = await prisma.exam.findMany({
      where: {
        status: { in: ["SCHEDULED", "ONGOING", "MARKS_ENTRY"] },
        slots: { some: { subjectId: { in: subjectIds } } },
      },
      include: {
        slots: {
          where: { subjectId: { in: subjectIds } },
          include: {
            class: true,
            subject: true,
            results: true,
          },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Format the response for the teacher dashboard
    const formattedExams = await Promise.all(exams.map(async (exam) => {
      const formattedSlots = await Promise.all(exam.slots.map(async (slot) => {
        const totalStudents = await prisma.student.count({ where: { classId: slot.classId } });
        return {
          id: slot.id,
          className: `${slot.class.name} - ${slot.class.section}`,
          subjectName: slot.subject.name,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: slot.room,
          isLocked: slot.isLocked,
          totalStudents,
          marksEntered: slot.results.length,
          isComplete: slot.results.length >= totalStudents,
        };
      }));

      return {
        id: exam.id,
        name: exam.name,
        type: exam.type,
        academicYear: exam.academicYear,
        status: exam.status,
        startDate: exam.startDate,
        endDate: exam.endDate,
        slots: formattedSlots,
      };
    }));

    return NextResponse.json({ exams: formattedExams });
  } catch (error: any) {
    console.error("Error fetching teacher exams:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
