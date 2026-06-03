export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summaries = await prisma.examSummary.findMany({
      where: { examId: params.examId },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
      },
    });

    const results = summaries.map((summary) => ({
      id: summary.studentId, // For DataTable
      rollNo: summary.student.rollNo,
      name: summary.student.user.name,
      className: `${summary.student.class.name} - ${summary.student.class.section}`,
      totalMarks: summary.totalMarks,
      maxMarks: summary.maxMarks,
      percentage: summary.percentage,
      grade: summary.grade,
      rank: summary.rank,
      isPassed: summary.isPassed,
    }));

    // Sort by class name, then rank
    results.sort((a, b) => {
      if (a.className < b.className) return -1;
      if (a.className > b.className) return 1;
      return (a.rank || 9999) - (b.rank || 9999);
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Error fetching results:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
