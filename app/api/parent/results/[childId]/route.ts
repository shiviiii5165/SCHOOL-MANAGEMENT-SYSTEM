export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/parent/results/[childId] — get published results for a specific child
export async function GET(req: NextRequest, { params }: { params: { childId: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id! },
      include: { students: true },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
    }

    // Verify child belongs to parent
    const child = parent.students.find(s => s.id === params.childId);
    if (!child) {
      return NextResponse.json({ error: "Child not found or access denied" }, { status: 403 });
    }

    const summaries = await prisma.examSummary.findMany({
      where: {
        studentId: child.id,
        isPublished: true,
      },
      include: { exam: true },
      orderBy: { exam: { startDate: "desc" } },
    });

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
    console.error("Error fetching parent results:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
