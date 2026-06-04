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

    // 1. Fetch Subject Averages by fetching ExamResults and aggregating manually
    // (since subjectId is on the related ExamSlot model)
    const results = await prisma.examResult.findMany({
      where: { marks: { not: null } },
      include: { slot: { include: { subject: true } } },
    });

    const subjectMap: Record<string, { totalMarks: number; count: number; name: string }> = {};
    results.forEach(r => {
      if (r.marks !== null) {
        const subId = r.slot.subject.id;
        if (!subjectMap[subId]) {
          subjectMap[subId] = { totalMarks: 0, count: 0, name: r.slot.subject.name };
        }
        subjectMap[subId].totalMarks += r.marks;
        subjectMap[subId].count += 1;
      }
    });

    const subjectComparisonChart = Object.values(subjectMap).map(s => ({
      name: s.name,
      average: s.totalMarks / s.count,
    }));

    // 2. Fetch Top Performers using ExamSummary aggregation
    const studentAverages = await prisma.examSummary.groupBy({
      by: ['studentId'],
      _avg: { percentage: true },
      orderBy: { _avg: { percentage: 'desc' } },
      take: 10,
    });

    const topStudentIds = studentAverages.map(s => s.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: topStudentIds } },
      include: { user: true, class: true },
    });

    const topPerformers = studentAverages.map(s => {
      const student = students.find(st => st.id === s.studentId);
      return {
        name: student?.user?.name || "Unknown",
        className: student ? `${student.class.name} ${student.class.section}` : "Unknown",
        percentage: s._avg.percentage || 0,
      };
    });

    return NextResponse.json({
      topPerformers,
      subjectComparisonChart
    });

  } catch (error) {
    console.error("Error fetching academic analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
