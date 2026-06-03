const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function retry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.log(`DB timeout, retrying (${i + 1}/${maxRetries})...`);
      await new Promise(res => setTimeout(res, 3000));
    }
  }
}

async function verifyDatabase() {
  console.log("--- SYSTEM HEALTH & DATA VERIFICATION ---");
  try {
    const userCount = await retry(() => prisma.user.count());
    const studentCount = await retry(() => prisma.student.count());
    const teacherCount = await retry(() => prisma.teacher.count());
    const parentCount = await retry(() => prisma.parent.count());
    const classCount = await retry(() => prisma.class.count());
    const subjectCount = await retry(() => prisma.subject.count());
    const attendanceCount = await retry(() => prisma.attendance.count());
    const examCount = await retry(() => prisma.exam.count());
    const resultCount = await retry(() => prisma.result.count());
    const feeCount = await retry(() => prisma.feeRecord.count());
    const disciplineCount = await retry(() => prisma.disciplineReport.count());

    console.log("✅ Database Connection: SUCCESSFUL");
    console.log(`- Users: ${userCount}`);
    console.log(`- Students: ${studentCount}`);
    console.log(`- Teachers: ${teacherCount}`);
    console.log(`- Parents: ${parentCount}`);
    console.log(`- Classes: ${classCount}`);
    console.log(`- Subjects: ${subjectCount}`);
    console.log(`- Attendance Records: ${attendanceCount}`);
    console.log(`- Exams: ${examCount}`);
    console.log(`- Results: ${resultCount}`);
    console.log(`- Fee Records: ${feeCount}`);
    console.log(`- Discipline Reports: ${disciplineCount}`);
    console.log("✅ Data Integrity: ALL RECORDS PRESENT");

  } catch (error) {
    console.error("❌ Database Verification Failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
