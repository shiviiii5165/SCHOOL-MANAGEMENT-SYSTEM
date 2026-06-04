import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeacherDashboardClient from "./TeacherDashboardClient";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const session = await auth();
  
  if (!session || session.user?.role !== "TEACHER") {
    return <div>Unauthorized</div>;
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id }
  });

  if (!teacher) {
    return <div>Teacher not found</div>;
  }

  // Get current day of week (1 = Monday, 6 = Saturday)
  let dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0) dayOfWeek = 1; // Default to Monday if Sunday

  // Fetch today's schedule
  const todaySchedule = await prisma.timetablePeriod.findMany({
    where: {
      teacherId: teacher.id,
      dayOfWeek: dayOfWeek
    },
    include: {
      class: { select: { name: true, section: true } },
      subject: { select: { name: true, code: true } }
    },
    orderBy: {
      periodNumber: 'asc'
    }
  });

  // Calculate some simple stats
  const studentsCount = await prisma.student.count({
    where: {
      class: { teacherId: teacher.id }
    }
  });

  // Check which classes have attendance marked today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const classIds = todaySchedule.map((s: any) => s.classId);
  const markedLogs = await prisma.dailyAttendanceLog.findMany({
    where: {
      classId: { in: classIds },
      date: { gte: today }
    },
    select: { classId: true }
  });
  
  const markedClassIds = markedLogs.map(l => l.classId);

  const stats = {
    students: studentsCount,
    classesToday: todaySchedule.length
  };

  return <TeacherDashboardClient todaySchedule={todaySchedule} stats={stats} markedClassIds={markedClassIds} />;
}
