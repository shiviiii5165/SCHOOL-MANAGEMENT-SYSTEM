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

    // 1. Average Attendance
    const attendanceAgg = await prisma.attendanceSummary.aggregate({
      _avg: {
        attendancePercentage: true
      }
    });
    
    // In a real app, calculate monthly trend comparing this month to last month
    const avgAttendance = attendanceAgg._avg.attendancePercentage || 0;
    const attendanceTrend = "+2.4%"; // Mock trend for now

    // 2. Fee Collection
    const feeAgg = await prisma.feeRecord.aggregate({
      _sum: {
        amount: true
      },
      where: {
        status: "PAID"
      }
    });

    const pendingFeeAgg = await prisma.feeRecord.aggregate({
      _sum: {
        amount: true
      },
      where: {
        status: { in: ["PENDING", "OVERDUE"] }
      }
    });

    const collectedFees = feeAgg._sum.amount || 0;
    const pendingFees = pendingFeeAgg._sum.amount || 0;
    const totalFees = collectedFees + pendingFees;
    const collectionPercentage = totalFees > 0 ? (collectedFees / totalFees) * 100 : 0;

    // 3. Academic Performance
    const resultAgg = await prisma.result.aggregate({
      _avg: {
        marks: true,
        maxMarks: true
      }
    });

    const avgMarks = resultAgg._avg.marks || 0;
    const avgMaxMarks = resultAgg._avg.maxMarks || 100;
    const academicPercentage = avgMaxMarks > 0 ? (avgMarks / avgMaxMarks) * 100 : 0;

    const totalResults = await prisma.result.count();
    const passedResults = await prisma.result.count({
      where: {
        marks: {
          gte: 40 // Assuming 40 is pass mark
        }
      }
    });
    const passPercentage = totalResults > 0 ? (passedResults / totalResults) * 100 : 0;

    // 4. Discipline Reports
    const pendingDiscipline = await prisma.disciplineReport.count({
      where: { status: "PENDING" }
    });
    
    const resolvedDiscipline = await prisma.disciplineReport.count({
      where: { status: "RESOLVED" }
    });

    const suspendedStudentsCount = await prisma.student.count({
      where: { isSuspended: true }
    });

    return NextResponse.json({
      attendance: {
        percentage: avgAttendance,
        trend: attendanceTrend
      },
      fees: {
        collected: collectedFees,
        pending: pendingFees,
        collectionPercentage: collectionPercentage
      },
      academic: {
        averagePercentage: academicPercentage,
        passPercentage: passPercentage
      },
      discipline: {
        pending: pendingDiscipline,
        resolved: resolvedDiscipline,
        suspendedStudentsCount: suspendedStudentsCount
      }
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
