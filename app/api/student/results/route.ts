export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/student/results — get all published exam summaries
export async function GET(req: NextRequest) {
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

    const summaries = await prisma.examSummary.findMany({
      where: {
        studentId: student.id,
        isPublished: true, // MUST BE PUBLISHED
      },
      include: {
        exam: true,
      },
      orderBy: {
        exam: { startDate: "desc" },
      },
    });

    // Format for frontend
    const formatted = summaries.map(s => ({
      examId: s.exam.id,
      examName: s.exam.name,
      academicYear: s.exam.academicYear,
      date: s.exam.startDate,
      totalMarks: s.totalMarks,
      maxMarks: s.maxMarks,
      percentage: s.percentage,
      grade: s.grade,
      rank: s.rank,
      isPassed: s.isPassed,
    }));

    return NextResponse.json({ results: formatted });
  } catch (error: any) {
    console.error("Error fetching student results:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
