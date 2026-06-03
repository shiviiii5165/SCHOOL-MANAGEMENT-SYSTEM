export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateGrade } from "@/lib/examUtils";

// GET /api/exams/[examId]/slots/[slotId]/marks — get marks for entry
export async function GET(req: NextRequest, { params }: { params: { examId: string; slotId: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slot = await prisma.examSlot.findUnique({
      where: { id: params.slotId },
      include: {
        exam: true,
        class: true,
        subject: { include: { teacher: { include: { user: true } } } },
        results: true,
      },
    });

    if (!slot || slot.examId !== params.examId) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // Get all students in the class
    const students = await prisma.student.findMany({
      where: { classId: slot.classId },
      include: { user: true },
      orderBy: { rollNo: "asc" },
    });

    // Map results to students
    const resultMap = new Map(slot.results.map(r => [r.studentId, r]));

    const entries = students.map(s => {
      const result = resultMap.get(s.id);
      return {
        studentId: s.id,
        rollNo: s.rollNo,
        regId: s.user.regId,
        name: s.user.name,
        marks: result?.marks ?? null,
        isAbsent: result?.isAbsent ?? false,
        grade: result?.grade ?? null,
        remarks: result?.remarks ?? null,
      };
    });

    return NextResponse.json({
      slot: {
        id: slot.id,
        examName: slot.exam.name,
        className: `${slot.class.name} - ${slot.class.section}`,
        subjectName: slot.subject.name,
        teacherName: slot.subject.teacher.user.name,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxMarks: slot.maxMarks,
        passMarks: slot.passMarks,
        isLocked: slot.isLocked,
      },
      entries,
    });
  } catch (error: any) {
    console.error("Error fetching marks:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/exams/[examId]/slots/[slotId]/marks — submit marks (final)
export async function POST(req: NextRequest, { params }: { params: { examId: string; slotId: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized — Teacher only" }, { status: 401 });
    }

    const slot = await prisma.examSlot.findUnique({
      where: { id: params.slotId },
      include: { subject: true },
    });

    if (!slot || slot.examId !== params.examId) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.isLocked) {
      return NextResponse.json({ error: "Marks entry is locked for this slot" }, { status: 400 });
    }

    // Verify teacher owns this subject
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id! } });
    if (!teacher || slot.subject.teacherId !== teacher.id) {
      return NextResponse.json({ error: "You can only enter marks for your assigned subjects" }, { status: 403 });
    }

    const { entries } = await req.json();

    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: "entries array required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await Promise.all(entries.map(async (entry: any) => {
        const grade = entry.isAbsent ? "AB" : calculateGrade(entry.marks, slot.maxMarks);
        await tx.examResult.upsert({
          where: { slotId_studentId: { slotId: params.slotId, studentId: entry.studentId } },
          update: {
            marks: entry.isAbsent ? null : entry.marks,
            isAbsent: entry.isAbsent,
            grade,
            remarks: entry.remarks ?? null,
            updatedAt: new Date(),
          },
          create: {
            examId: params.examId,
            slotId: params.slotId,
            studentId: entry.studentId,
            marks: entry.isAbsent ? null : entry.marks,
            isAbsent: entry.isAbsent,
            grade,
            remarks: entry.remarks ?? null,
            enteredBy: teacher.id,
          },
        });
      }));

      // Lock the slot (final submission)
      await tx.examSlot.update({
        where: { id: params.slotId },
        data: { isLocked: true },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    return NextResponse.json({ success: true, locked: true });
  } catch (error: any) {
    console.error("Error submitting marks:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
