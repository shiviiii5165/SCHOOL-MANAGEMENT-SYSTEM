const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Generating fee records for all students...");
  const students = await prisma.student.findMany();
  
  // Find students who already have fees to skip them
  const existingFees = await prisma.feeRecord.groupBy({
    by: ['studentId'],
    _count: { studentId: true }
  });
  
  const studentsWithFees = new Set(existingFees.map(e => e.studentId));
  const allInvoices = [];

  for (const student of students) {
    if (studentsWithFees.has(student.id)) continue;

    allInvoices.push(
      { studentId: student.id, feeType: 'Tuition', amount: 18000, dueDate: new Date('2026-04-01'), status: 'OVERDUE' },
      { studentId: student.id, feeType: 'Tuition', amount: 18000, dueDate: new Date('2026-07-01'), status: 'PENDING' },
      { studentId: student.id, feeType: 'Computer', amount: 2000, dueDate: new Date('2026-04-01'), status: 'PENDING' },
      { studentId: student.id, feeType: 'Library', amount: 1000, dueDate: new Date('2026-04-01'), status: 'PENDING' }
    );

    if (student.hasTransport) {
      allInvoices.push({ studentId: student.id, feeType: 'Transport', amount: 10500, dueDate: new Date('2026-04-01'), status: 'PENDING' });
    }
  }

  if (allInvoices.length > 0) {
    await prisma.feeRecord.createMany({ data: allInvoices });
  }

  console.log(`Done! Generated ${allInvoices.length} fee records across ${students.length} students.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
