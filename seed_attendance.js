const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.student.findMany();
  const teachers = await prisma.teacher.findMany();
  const today = new Date();
  
  let records = [];
  
  for (const student of students) {
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip Sundays (0)
      if (date.getDay() === 0) continue;
      
      let status = "PRESENT";
      const rand = Math.random();
      if (rand > 0.85) status = "ABSENT";
      else if (rand > 0.75) status = "LATE";
      
      records.push({
        studentId: student.id,
        classId: student.classId,
        date: date,
        status: status,
        markedBy: teachers[0].id,
      });
    }
  }

  console.log(`Creating ${records.length} attendance records...`);
  await prisma.attendance.createMany({ data: records, skipDuplicates: true });
  console.log("Done seeding attendance!");
  
  // Now recalculate summary
  for (const student of students) {
    const recs = await prisma.attendance.findMany({ where: { studentId: student.id } });
    const totalClasses = recs.length;
    const presentCount = recs.filter((r) => r.status === "PRESENT").length;
    const absentCount = recs.filter((r) => r.status === "ABSENT").length;
    const lateCount = recs.filter((r) => r.status === "LATE").length;
    const attendancePercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 100;
    
    await prisma.attendanceSummary.upsert({
      where: { studentId: student.id },
      update: { totalClasses, presentCount, absentCount, lateCount, attendancePercentage },
      create: { studentId: student.id, totalClasses, presentCount, absentCount, lateCount, attendancePercentage }
    });
  }
  console.log("Updated summaries.");
}

main().catch(console.error).finally(() => prisma.$disconnect());

