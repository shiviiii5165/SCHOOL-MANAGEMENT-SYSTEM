export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";
import { z } from "zod";

const AttendanceSubmitSchema = z.object({
  classId: z.string(),
  date: z.string().datetime(),
  headCount: z.number().int().positive().optional(),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'BLOCKED']),
  })).min(1).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = session.user.id;
    const body = await req.json();
    
    const parsed = AttendanceSubmitSchema.safeParse({
      ...body,
      date: new Date(body.date).toISOString() // normalize date for zod validation
    });
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const { classId, date, records, headCount } = body;

    const teacherRecord = await prisma.teacher.findUnique({
      where: { userId: teacherId },
      include: { user: true }
    });

    if (!teacherRecord) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
    }

    const isAssigned = await prisma.class.findFirst({
      where: { id: classId, teacherId: teacherRecord.id },
    });

    if (!isAssigned) {
      return NextResponse.json({ error: "Not assigned to this class" }, { status: 403 });
    }

    const parsedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsedDate > today) {
      return NextResponse.json({ error: "Cannot mark attendance for future dates" }, { status: 400 });
    }

    const studentIds = records.map((r: any) => r.studentId);

    // Auto-lift expired suspensions
    const now = new Date();
    const allStudents = await prisma.student.findMany({
      where: { id: { in: studentIds } },
    });
    
    for (const student of allStudents) {
      if (student.isSuspended && student.suspendedUntil && student.suspendedUntil <= now) {
        await prisma.student.update({
          where: { id: student.id },
          data:  { isSuspended: false, suspendedUntil: null, suspendedFrom: null, suspendedReason: null }
        });
      }
    }

    const suspendedStudents = await prisma.student.findMany({
      where: { id: { in: studentIds }, isSuspended: true },
      select: { id: true },
    });
    const suspendedIds = new Set(suspendedStudents.map(s => s.id));

    const attendanceData = records.map((r: any) => ({
      studentId: r.studentId,
      classId,
      date: parsedDate,
      status: suspendedIds.has(r.studentId) ? "BLOCKED" : r.status,
      markedBy: teacherRecord.id,
      headCount: headCount
    }));

    // Start Transaction for accuracy
    await prisma.$transaction(async (tx) => {
      // 1. Save/upsert individual Attendance record for each student
      await tx.attendance.deleteMany({
        where: { classId, date: parsedDate }
      });
      await tx.attendance.createMany({
        data: attendanceData,
      });

      // 2. Upsert DailyAttendanceLog for this class+date
      let present = 0, absent = 0, late = 0, blocked = 0;
      for (const r of attendanceData) {
        if (r.status === "PRESENT") present++;
        if (r.status === "ABSENT") absent++;
        if (r.status === "LATE") late++;
        if (r.status === "BLOCKED") blocked++;
      }

      await tx.dailyAttendanceLog.upsert({
        where: { classId_date: { classId, date: parsedDate } },
        update: {
          teacherId: teacherRecord.id,
          submittedAt: new Date(),
          totalStudents: records.length,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          blockedCount: blocked,
          headCount: headCount || records.length,
        },
        create: {
          classId,
          date: parsedDate,
          teacherId: teacherRecord.id,
          submittedAt: new Date(),
          totalStudents: records.length,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          blockedCount: blocked,
          headCount: headCount || records.length,
        }
      });

    }); // End of transaction

    // 3. Optimized Bulk Recalculation (O(1) queries instead of O(N))
    const classLogs = await prisma.dailyAttendanceLog.findMany({
      where: { classId },
      select: { date: true }
    });

    const groupedAttendance = await prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: { classId, studentId: { in: studentIds } },
      _count: true
    });

    const attendanceMap = new Map();
    for (const g of groupedAttendance) {
      if (!attendanceMap.has(g.studentId)) attendanceMap.set(g.studentId, { PRESENT: 0, ABSENT: 0, LATE: 0, BLOCKED: 0 });
      attendanceMap.get(g.studentId)[g.status] = g._count;
    }

    const updates = allStudents.flatMap(student => {
      const totalClassesHeld = classLogs.filter(log => log.date >= student.admissionDate).length;
      const studentStats = attendanceMap.get(student.id) || { PRESENT: 0, ABSENT: 0, LATE: 0, BLOCKED: 0 };
      const presentCount = studentStats.PRESENT;
      const lateCount = studentStats.LATE;
      
      const absentCount = totalClassesHeld - presentCount - lateCount;
      
      let attendancePercentage = totalClassesHeld > 0 
        ? ((presentCount + lateCount) / totalClassesHeld) * 100 
        : 100;
        
      attendancePercentage = Math.min(100, attendancePercentage);

      return [
        prisma.student.update({
          where: { id: student.id },
          data: { attendancePercentage }
        }),
        prisma.attendanceSummary.upsert({
          where: { studentId: student.id },
          update: {
            totalClasses: totalClassesHeld,
            presentCount,
            absentCount,
            lateCount,
            attendancePercentage,
            lastUpdated: new Date()
          },
          create: {
            studentId: student.id,
            totalClasses: totalClassesHeld,
            presentCount,
            absentCount,
            lateCount,
            attendancePercentage,
          }
        })
      ];
    });

    await prisma.$transaction(updates);

    // Notifications (Run outside transaction)
    const absentStudentIds = attendanceData.filter((r: any) => r.status === 'ABSENT').map((r: any) => r.studentId);
    if (absentStudentIds.length > 0) {
      const absentStudents = await prisma.student.findMany({
        where: { id: { in: absentStudentIds } },
        include: { user: true, parent: true }
      });
      
      const notifications = absentStudents.map(student => ({
        userId: student.parent?.userId,
        title: 'Attendance Alert',
        message: `${student.user.name} was marked ABSENT today (${parsedDate.toLocaleDateString()}).`,
        type: 'ATTENDANCE' as any,
        link: '/parent/attendance'
      }));
      await createNotifications(notifications);
    }

    return NextResponse.json({ success: true, message: "Attendance saved successfully" });

  } catch (error) {
    console.error("Attendance Submit Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
