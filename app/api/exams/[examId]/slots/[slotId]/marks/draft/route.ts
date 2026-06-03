export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateGrade } from "@/lib/examUtils";

// POST /api/exams/[examId]/slots/[slotId]/marks/draft — auto-save marks without locking
export async function POST(req: NextRequest, { params }: { params: { examId: string; slotId: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slot = await prisma.examSlot.findUnique({
      where: { id: params.slotId },
      include: { subject: true },
    });

    if (!slot || slot.examId !== params.examId) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.isLocked) {
      return NextResponse.json({ error: "Slot is locked" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id! } });
    if (!teacher || slot.subject.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { entries } = await req.json();

    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: "entries array required" }, { status: 400 });
    }

    // Save draft — does NOT set isLocked = true
    for (const entry of entries) {
      if (entry.marks === null && !entry.isAbsent) continue; // Skip empty entries
      const grade = entry.isAbsent ? "AB" : calculateGrade(entry.marks, slot.maxMarks);
      await prisma.examResult.upsert({
        where: { slotId_studentId: { slotId: params.slotId, studentId: entry.studentId } },
        update: {
          marks: entry.isAbsent ? null : entry.marks,
          isAbsent: entry.isAbsent,
          grade,
          updatedAt: new Date(),
        },
        create: {
          examId: params.examId,
          slotId: params.slotId,
          studentId: entry.studentId,
          marks: entry.isAbsent ? null : entry.marks,
          isAbsent: entry.isAbsent,
          grade,
          enteredBy: teacher.id,
        },
      });
    }

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error("Error saving draft marks:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
