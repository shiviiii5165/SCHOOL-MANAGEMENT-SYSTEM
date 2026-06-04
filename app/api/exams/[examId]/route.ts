export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/exams/[examId] — exam detail + slots
export async function GET(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;

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
        summaries: { include: { student: { include: { user: true, class: true } } } },
        hallTickets: { include: { student: { include: { user: true, class: true } } } },
        _count: { select: { results: true } },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Role-based filtering: STUDENT/PARENT should only see their own data
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: session.user.id } });
      if (student) {
        exam.summaries = exam.summaries.filter(s => s.studentId === student.id);
        exam.hallTickets = exam.hallTickets.filter(h => h.studentId === student.id);
        for (const slot of exam.slots) {
          slot.results = slot.results.filter(r => r.studentId === student.id);
        }
      }
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId: session.user.id }, include: { students: true } });
      const childIds = parent?.students.map(s => s.id) || [];
      exam.summaries = exam.summaries.filter(s => childIds.includes(s.studentId));
      exam.hallTickets = exam.hallTickets.filter(h => childIds.includes(h.studentId));
      for (const slot of exam.slots) {
        slot.results = slot.results.filter(r => childIds.includes(r.studentId));
      }
    }
    // ADMIN and TEACHER get full data (no filtering)

    return NextResponse.json({ exam });
  } catch (error: any) {
    console.error("Error fetching exam:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
