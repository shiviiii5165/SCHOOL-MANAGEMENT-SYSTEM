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

    return NextResponse.json({ exam });
  } catch (error: any) {
    console.error("Error fetching exam:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
