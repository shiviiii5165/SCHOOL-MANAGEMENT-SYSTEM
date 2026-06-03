import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all classes
    const classes = await prisma.class.findMany({
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get today's logs
    const logs = await prisma.dailyAttendanceLog.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const logsMap = new Map(logs.map(log => [log.classId, log]));

    const responseData = classes.map(cls => {
      const log = logsMap.get(cls.id);
      return {
        classId: cls.id,
        className: `${cls.name} - ${cls.section}`,
        teacherName: cls.teacher.user.name,
        teacherId: cls.teacher.id,
        status: log ? "SUBMITTED" : "PENDING",
        submittedAt: log ? log.submittedAt : null,
        present: log ? log.presentCount : 0,
        absent: log ? log.absentCount : 0,
        total: cls._count.students
      };
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Today Attendance API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
