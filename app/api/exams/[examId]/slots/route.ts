export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const SlotSchema = z.object({
  slots: z.array(z.object({
    classId:   z.string(),
    subjectId: z.string(),
    date:      z.string(),
    startTime: z.string(),
    endTime:   z.string(),
    room:      z.string(),
    maxMarks:  z.number().min(1),
    passMarks: z.number().min(0).optional(),
  })),
});

// POST /api/exams/[examId]/slots — create/update timetable slots
export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({ where: { id: params.examId } });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const parsed = SlotSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }
    const body = parsed.data;

    const upserts = body.slots.map(slot => {
      return prisma.examSlot.upsert({
        where: {
          examId_classId_subjectId: {
            examId: params.examId,
            classId: slot.classId,
            subjectId: slot.subjectId,
          },
        },
        update: {
          date:      new Date(slot.date),
          startTime: slot.startTime,
          endTime:   slot.endTime,
          room:      slot.room,
          maxMarks:  slot.maxMarks,
          passMarks: slot.passMarks ?? exam.defaultPassPct,
        },
        create: {
          examId:    params.examId,
          classId:   slot.classId,
          subjectId: slot.subjectId,
          date:      new Date(slot.date),
          startTime: slot.startTime,
          endTime:   slot.endTime,
          room:      slot.room,
          maxMarks:  slot.maxMarks,
          passMarks: slot.passMarks ?? exam.defaultPassPct,
        },
      });
    });

    const created = await prisma.$transaction(upserts);

    return NextResponse.json({ slots: created }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating slots:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
