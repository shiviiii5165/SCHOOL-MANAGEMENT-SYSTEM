export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/student/results/[examId] — detailed subject-wise results
export async function GET(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id! },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const summary = await prisma.examSummary.findUnique({
      where: { examId_studentId: { examId: params.examId, studentId: student.id } },
      include: { exam: true },
    });

    if (!summary || !summary.isPublished) {
      return NextResponse.json({ error: "Results not published or not found" }, { status: 404 });
    }

    const results = await prisma.examResult.findMany({
      where: { examId: params.examId, studentId: student.id },
      include: {
        slot: {
          include: { subject: { include: { teacher: { include: { user: true } } } } },
        },
      },
    });

    // To calculate class average, we need to fetch all results for these slots
    const slotIds = results.map(r => r.slotId);
    const allSlotResults = await prisma.examResult.findMany({
      where: { slotId: { in: slotIds }, marks: { not: null } },
      select: { slotId: true, marks: true },
    });

    // Compute class averages
    const classAverages = new Map<string, number>();
    for (const id of slotIds) {
      const marksForSlot = allSlotResults.filter(r => r.slotId === id && r.marks !== null).map(r => r.marks!);
      if (marksForSlot.length > 0) {
        const sum = marksForSlot.reduce((a, b) => a + b, 0);
        classAverages.set(id, Math.round(sum / marksForSlot.length));
      } else {
        classAverages.set(id, 0);
      }
    }

    const formattedSubjects = results.map(r => ({
      id: r.id,
      subject: r.slot.subject.name,
      code: r.slot.subject.code,
      teacher: r.slot.subject.teacher.user.name,
      marks: r.marks,
      maxMarks: r.slot.maxMarks,
      isAbsent: r.isAbsent,
      grade: r.grade,
      classAvg: classAverages.get(r.slotId) || 0,
    }));

    return NextResponse.json({
      summary: {
        examName: summary.exam.name,
        totalMarks: summary.totalMarks,
        maxMarks: summary.maxMarks,
        percentage: summary.percentage,
        grade: summary.grade,
        rank: summary.rank,
        isPassed: summary.isPassed,
      },
      subjects: formattedSubjects,
    });
  } catch (error: any) {
    console.error("Error fetching detailed results:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
