export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeExamSummary } from "@/lib/examUtils";

// POST /api/exams/[examId]/calculate — compute ExamSummary + ranks for all students
export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: { slots: { include: { class: true } } },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const classIds = exam.slots.map(s => s.classId).filter((v, i, a) => a.indexOf(v) === i);

    const students = await prisma.student.findMany({
      where: { classId: { in: classIds } },
    });

    // Bulk fetch all results for this exam once
    const allResults = await prisma.examResult.findMany({
      where: { examId: params.examId },
      include: { slot: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const classId of classIds) {
        const classStudents = students.filter(s => s.classId === classId);
        const summaries: { studentId: string; pct: number }[] = [];

        // 1. Calculate summaries concurrently
        await Promise.all(classStudents.map(async (student) => {
          const results = allResults.filter(r => r.studentId === student.id);

          const computed = computeExamSummary(
            results.map(r => ({
              marks: r.marks,
              isAbsent: r.isAbsent,
              maxMarks: r.slot.maxMarks,
            }))
          );

          summaries.push({ studentId: student.id, pct: computed.percentage });

          await tx.examSummary.upsert({
            where: { examId_studentId: { examId: params.examId, studentId: student.id } },
            update: {
              totalMarks: computed.totalMarks,
              maxMarks: computed.maxMarks,
              percentage: computed.percentage,
              grade: computed.grade,
              isPassed: computed.isPassed,
              computedAt: new Date(),
            },
            create: {
              examId: params.examId,
              studentId: student.id,
              totalMarks: computed.totalMarks,
              maxMarks: computed.maxMarks,
              percentage: computed.percentage,
              grade: computed.grade,
              isPassed: computed.isPassed,
            },
          });
        }));

        // 2. Assign ranks concurrently
        summaries.sort((a, b) => b.pct - a.pct);
        await Promise.all(summaries.map((summary, index) => 
          tx.examSummary.update({
            where: { examId_studentId: { examId: params.examId, studentId: summary.studentId } },
            data: { rank: index + 1 },
          })
        ));
      }
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json({ success: true, classesProcessed: classIds.length, studentsProcessed: students.length });
  } catch (error: any) {
    console.error("Error calculating results:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
