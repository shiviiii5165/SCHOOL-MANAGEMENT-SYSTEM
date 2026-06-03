process.env.NODE_TLS_REJECT_UNAUTHORIZED='0';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting attendance reset...");
  
  // Wipe all attendance tables
  await prisma.attendanceSummary.deleteMany({});
  console.log("Deleted all AttendanceSummary records.");
  
  await prisma.attendance.deleteMany({});
  console.log("Deleted all Attendance records.");
  
  await prisma.dailyAttendanceLog.deleteMany({});
  console.log("Deleted all DailyAttendanceLog records.");

  // Reset Student attendance percentage to 100
  await prisma.student.updateMany({
    data: {
      attendancePercentage: 100
    }
  });
  console.log("Reset all students' attendancePercentage to 100.");
  
  console.log("Attendance reset complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
