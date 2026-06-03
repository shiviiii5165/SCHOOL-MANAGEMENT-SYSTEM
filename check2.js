process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const studentId = 'cmppnti2v000s10xqdgsdqng4'; // from earlier
  const classId = 'cmppntcko000g10xqdiojkd9j'; // from earlier

  const classLogs = await prisma.dailyAttendanceLog.findMany({ where: { classId } });
  console.log("Class Logs:", classLogs.length, classLogs.map(l => l.date));

  const attRecords = await prisma.attendance.findMany({ where: { studentId, classId } });
  console.log("Attendance records:", attRecords.length, attRecords.map(a => a.date));

}
main().finally(() => prisma.$disconnect());
