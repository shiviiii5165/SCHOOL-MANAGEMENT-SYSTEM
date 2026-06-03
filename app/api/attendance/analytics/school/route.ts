export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // School average attendance
    const allSummaries = await prisma.attendanceSummary.findMany();
    const schoolAvg =
      allSummaries.length > 0
        ? allSummaries.reduce((sum, s) => sum + s.attendancePercentage, 0) / allSummaries.length
        : 0;

    // Today's marked classes
    const todayRecords = await prisma.attendance.findMany({
      where: { date: today },
      select: { classId: true },
      distinct: ["classId"],
    });
    const totalClasses = await prisma.class.count();
    const markedClasses = todayRecords.length;

    // Risk students (< 75%)
    const riskStudents = await prisma.student.findMany({
      where: { attendancePercentage: { lt: 75 } },
      include: {
        user: { select: { name: true, regId: true } },
        class: { select: { name: true, section: true } },
        attendanceSummary: true,
      },
      orderBy: { attendancePercentage: "asc" },
    });

    // Detained students
    const detainedStudents = await prisma.student.findMany({
      where: { examEligible: false },
      include: {
        user: { select: { name: true, regId: true } },
        class: { select: { name: true, section: true } },
      },
    });

    // Class-wise stats
    const classes = await prisma.class.findMany({
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        students: { select: { id: true, attendancePercentage: true } },
      },
      orderBy: [{ name: "asc" }, { section: "asc" }],
    });

    const classStats = classes.map((cls) => {
      const avgAttendance =
        cls.students.length > 0
          ? cls.students.reduce((sum, s) => sum + s.attendancePercentage, 0) / cls.students.length
          : 0;
      const isMarkedToday = todayRecords.some((r) => r.classId === cls.id);
      return {
        id: cls.id,
        name: cls.name,
        section: cls.section,
        teacherName: cls.teacher?.user?.name || "N/A",
        avgAttendance: Math.round(avgAttendance * 10) / 10,
        todayMarked: isMarkedToday,
        studentCount: cls.students.length,
      };
    });

    // Daily trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailyRecords = await prisma.attendance.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      select: { date: true, status: true },
    });

    const dailyMap: Record<string, { total: number; present: number }> = {};
    dailyRecords.forEach((r) => {
      const key = r.date.toISOString().split("T")[0];
      if (!dailyMap[key]) dailyMap[key] = { total: 0, present: 0 };
      dailyMap[key].total++;
      if (r.status === "PRESENT" || r.status === "LATE") dailyMap[key].present++;
    });

    const dailyTrend = Object.entries(dailyMap)
      .map(([date, val]) => ({
        date,
        percentage: Math.round((val.present / val.total) * 1000) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      schoolAvg: Math.round(schoolAvg * 10) / 10,
      markedClasses,
      totalClasses,
      riskStudents: riskStudents.map((s) => ({
        id: s.id,
        name: s.user?.name,
        regId: s.user?.regId,
        className: `${s.class?.name} - ${s.class?.section}`,
        rollNo: s.rollNo,
        attendance: Math.round(s.attendancePercentage * 10) / 10,
        examEligible: s.examEligible,
      })),
      detainedCount: detainedStudents.length,
      classStats,
      dailyTrend,
    });
  } catch (error) {
    console.error("Error fetching school analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
