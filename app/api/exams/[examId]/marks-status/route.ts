export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/exams/[examId]/marks-status — teacher submission status per slot
export async function GET(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: {
        slots: {
          include: {
            class: true,
            subject: { include: { teacher: { include: { user: true } } } },
            results: true,
          },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const statuses = await Promise.all(
      exam.slots.map(async (slot) => {
        const studentCount = await prisma.student.count({ where: { classId: slot.classId } });
        return {
          id: slot.id,
          slotId: slot.id,
          className: `${slot.class.name} - ${slot.class.section}`,
          subjectName: slot.subject.name,
          teacherName: slot.subject.teacher.user.name,
          teacherUserId: slot.subject.teacher.userId,
          totalStudents: studentCount,
          marksEntered: slot.results.length,
          isLocked: slot.isLocked,
          isComplete: slot.results.length >= studentCount,
        };
      })
    );

    const allComplete = statuses.every(s => s.isComplete);

    return NextResponse.json({ statuses, allComplete });
  } catch (error: any) {
    console.error("Error fetching marks status:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
