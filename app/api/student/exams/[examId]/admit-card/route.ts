export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/student/exams/[examId]/admit-card — data for jsPDF generation
export async function GET(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id! },
      include: {
        user: true,
        class: true,
        hallTickets: { where: { examId: params.examId } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: {
        slots: {
          where: { classId: student.classId },
          include: { subject: true },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Must have a published hall ticket (created when timetable is published)
    const hallTicket = student.hallTickets[0];
    if (!hallTicket) {
      return NextResponse.json({ error: "Admit card not generated yet (Timetable not published)" }, { status: 400 });
    }

    if (hallTicket.isBlocked) {
      return NextResponse.json({
        isBlocked: true,
        blockReason: hallTicket.blockReason,
      });
    }

    // Return full data needed for PDF
    return NextResponse.json({
      isBlocked: false,
      examName: exam.name,
      academicYear: exam.academicYear,
      studentName: student.user.name,
      regId: student.user.regId,
      rollNo: student.rollNo,
      className: `${student.class.name} - ${student.class.section}`,
      fatherName: student.fatherName,
      dateOfBirth: student.dateOfBirth,
      avatar: student.user.avatar,
      slots: exam.slots.map(s => ({
        subject: s.subject.name,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        marks: s.maxMarks,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching admit card data:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
