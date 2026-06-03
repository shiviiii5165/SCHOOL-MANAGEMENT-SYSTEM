import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Subject Averages via Prisma Aggregation
    const subjectAverages = await prisma.result.groupBy({
      by: ['subjectId'],
      _avg: {
        marks: true,
      },
    });

    const subjectComparisonChart = subjectAverages.map(avg => ({
      name: `Subject ${avg.subjectId.substring(0, 4)}`,
      average: avg._avg.marks || 0,
    }));

    // 2. Fetch Top Performers using aggregation to sum marks
    const studentSums = await prisma.result.groupBy({
      by: ['studentId'],
      _sum: {
        marks: true,
        maxMarks: true,
      },
      orderBy: {
        _sum: {
          marks: 'desc',
        },
      },
      take: 10,
    });

    const topStudentIds = studentSums.map(s => s.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: topStudentIds } },
      include: { user: true, class: true },
    });

    const topPerformers = studentSums.map(s => {
      const student = students.find(st => st.id === s.studentId);
      const sumMarks = s._sum.marks || 0;
      const sumMax = s._sum.maxMarks || 1;
      return {
        name: student?.user?.name || "Unknown",
        className: student ? `${student.class.name} ${student.class.section}` : "Unknown",
        percentage: (sumMarks / sumMax) * 100,
      };
    }).sort((a, b) => b.percentage - a.percentage);

    return NextResponse.json({
      topPerformers,
      subjectComparisonChart
    });

  } catch (error) {
    console.error("Error fetching academic analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
