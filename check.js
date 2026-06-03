process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const summaries = await prisma.attendanceSummary.findMany({ take: 5 });
  console.log("Summaries:", summaries);
  const logs = await prisma.dailyAttendanceLog.findMany({ take: 5 });
  console.log("Logs:", logs);
  const attendance = await prisma.attendance.findMany({ take: 5 });
  console.log("Attendance:", attendance);
}
main().finally(() => prisma.$disconnect());
