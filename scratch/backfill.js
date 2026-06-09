const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for human readable IDs...");

  // 1. Backfill Students
  const students = await prisma.student.findMany({ where: { studentCode: null } });
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const code = `STU-${String(i + 1).padStart(4, '0')}`;
    await prisma.student.update({
      where: { id: student.id },
      data: { studentCode: code }
    });
  }
  console.log(`Backfilled ${students.length} students.`);

  // 2. Backfill Parents
  const parents = await prisma.parent.findMany({ where: { parentCode: null } });
  for (let i = 0; i < parents.length; i++) {
    const parent = parents[i];
    const code = `PRN-${String(i + 1).padStart(4, '0')}`;
    await prisma.parent.update({
      where: { id: parent.id },
      data: { parentCode: code }
    });
  }
  console.log(`Backfilled ${parents.length} parents.`);

  // 3. Backfill FeeRecords (Invoices)
  const feeRecords = await prisma.feeRecord.findMany({ where: { invoiceId: null } });
  const year = new Date().getFullYear();
  for (let i = 0; i < feeRecords.length; i++) {
    const record = feeRecords[i];
    const code = `INV-${year}-${String(i + 1).padStart(5, '0')}`;
    await prisma.feeRecord.update({
      where: { id: record.id },
      data: { invoiceId: code }
    });
  }
  console.log(`Backfilled ${feeRecords.length} fee records.`);

  console.log("Backfill complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
