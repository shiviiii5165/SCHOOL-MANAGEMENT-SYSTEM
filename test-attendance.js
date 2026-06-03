import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching a class and its students...");
  const firstClass = await prisma.class.findFirst({
    include: { teacher: true, students: true }
  });

  if (!firstClass || firstClass.students.length === 0) {
    console.log("No class with students found.");
    return;
  }

  const classId = firstClass.id;
  const teacherId = firstClass.teacherId;
  const students = firstClass.students.slice(0, 30); // up to 30 students

  console.log(`Testing with Class: ${firstClass.name}, Teacher: ${teacherId}, Students: ${students.length}`);

  // Helper to simulate POST /api/attendance/submit logic directly (bypassing Next.js API for script ease, but matching logic)
  async function submitAttendance(dateStr, makeAbsentCount) {
    const parsedDate = new Date(dateStr);
    const records = students.map((s, index) => ({
      studentId: s.id,
      status: index < makeAbsentCount ? 'ABSENT' : 'PRESENT'
    }));

    const attendanceData = records.map(r => ({
      studentId: r.studentId,
      classId,
      date: parsedDate,
      status: r.status,
      markedBy: teacherId,
      headCount: students.length
    }));

    await prisma.$transaction(async (tx) => {
      // 1. Save/upsert individual Attendance record
      await tx.attendance.deleteMany({
        where: { classId, date: parsedDate }
      });
      await tx.attendance.createMany({ data: attendanceData });

      // 2. Upsert DailyAttendanceLog
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
          teacherId,
          submittedAt: new Date(),
          totalStudents: students.length,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          blockedCount: blocked,
          headCount: students.length,
        },
        create: {
          classId,
          date: parsedDate,
          teacherId,
          submittedAt: new Date(),
          totalStudents: students.length,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          blockedCount: blocked,
          headCount: students.length,
        }
      });

    }); // End of transaction

    // 3. Recalculate outside transaction
    for (const student of students) {
      const totalClassesHeld = await prisma.dailyAttendanceLog.count({
        where: { classId: classId, date: { gte: student.admissionDate } }
      });

      const presentCount = await prisma.attendance.count({
        where: { studentId: student.id, classId: classId, status: 'PRESENT' }
      });
      const lateCount = await prisma.attendance.count({
        where: { studentId: student.id, classId: classId, status: 'LATE' }
      });

      const absentCount = totalClassesHeld - presentCount - lateCount;
      
      const attendancePercentage = totalClassesHeld > 0 
        ? ((presentCount + lateCount) / totalClassesHeld) * 100 
        : 100;

      await prisma.student.update({
        where: { id: student.id },
        data: { attendancePercentage }
      });

      await prisma.attendanceSummary.upsert({
        where: { studentId: student.id },
        update: {
          totalClasses: totalClassesHeld,
          presentCount, absentCount, lateCount, attendancePercentage,
          lastUpdated: new Date()
        },
        create: {
          studentId: student.id,
          totalClasses: totalClassesHeld,
          presentCount, absentCount, lateCount, attendancePercentage,
        }
      });
    }

    console.log(`\n--- Date: ${dateStr} ---`);
    console.log(`Total students: ${students.length}, Absents marked: ${makeAbsentCount}`);
    
    // Check results for student 0 (was absent if makeAbsentCount > 0)
    const s0 = await prisma.attendanceSummary.findUnique({ where: { studentId: students[0].id } });
    console.log(`Student 0 (Index < absent count): ${s0.attendancePercentage}% (${s0.presentCount}P, ${s0.absentCount}A / ${s0.totalClasses} Total)`);

    // Check results for student at the end (always present)
    const sLast = await prisma.attendanceSummary.findUnique({ where: { studentId: students[students.length - 1].id } });
    console.log(`Student ${students.length - 1} (Always Present): ${sLast.attendancePercentage}% (${sLast.presentCount}P, ${sLast.absentCount}A / ${sLast.totalClasses} Total)`);
  }

  // Clear existing attendance for this class to test cleanly
  await prisma.attendance.deleteMany({ where: { classId } });
  await prisma.dailyAttendanceLog.deleteMany({ where: { classId } });
  await prisma.attendanceSummary.deleteMany({ where: { studentId: { in: students.map(s => s.id) } } });
  await prisma.student.updateMany({ where: { id: { in: students.map(s => s.id) } }, data: { attendancePercentage: 100 }});

  // Day 1: All 30 students PRESENT
  await submitAttendance('2026-06-01T00:00:00Z', 0); // 0 absents

  // Day 2: 15 students ABSENT
  await submitAttendance('2026-06-02T00:00:00Z', 15);

  // Day 3: Same 15 students PRESENT again (0 absents for day 3)
  await submitAttendance('2026-06-03T00:00:00Z', 0); // They are all present now

}

main().catch(console.error).finally(() => prisma.$disconnect());
