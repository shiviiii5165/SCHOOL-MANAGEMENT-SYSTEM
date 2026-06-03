import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const periods = await prisma.timetablePeriod.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: { select: { name: true, section: true } },
        subject: { select: { name: true, code: true } },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { periodNumber: 'asc' }
      ]
    });

    const formattedPeriods = periods.map(p => ({
      id: p.id,
      dayOfWeek: p.dayOfWeek,
      periodNumber: p.periodNumber,
      startTime: p.startTime,
      endTime: p.endTime,
      roomNumber: p.roomNumber,
      className: `${p.class.name} ${p.class.section}`,
      subjectName: p.subject.name,
      subjectCode: p.subject.code,
    }));

    return NextResponse.json({ periods: formattedPeriods });

  } catch (error) {
    console.error("Error fetching timetable:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
