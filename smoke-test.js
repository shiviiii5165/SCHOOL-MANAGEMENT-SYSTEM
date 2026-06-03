const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function measure(name, fn) {
  const start = performance.now();
  await fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

async function runSmokeTests() {
  console.log("--- Baseline Metrics ---");
  
  // Admin Login (Find User)
  await measure("Admin Login Latency", async () => {
    await prisma.user.findFirst({ where: { role: "ADMIN" } });
  });

  // Teacher Attendance (Find Teacher Classes & Attendance)
  await measure("Teacher Attendance Fetch Latency", async () => {
    const teacher = await prisma.user.findFirst({ where: { role: "TEACHER" } });
    if(teacher) {
      await prisma.attendance.findMany({ take: 100 });
    }
  });

  // Student Results (Find Student Exams)
  await measure("Student Results Fetch Latency", async () => {
    const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
    if (student) {
      await prisma.examResult.findMany({ take: 50 });
    }
  });

  // Parent Fees (Find Child Fee Records)
  await measure("Parent Fees Fetch Latency", async () => {
    await prisma.feeRecord.findMany({ take: 50 });
  });

  console.log("\n--- E2E Flow Simulation Completed ---");
  await prisma.$disconnect();
}

runSmokeTests().catch(console.error);
