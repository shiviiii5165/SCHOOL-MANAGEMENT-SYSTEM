const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const exams = await prisma.exam.findMany({ include: { slots: true } });
  for (const exam of exams) {
    // 1. Set exam status to MARKS_ENTRY so calculate button appears
    await prisma.exam.update({ where: { id: exam.id }, data: { status: 'MARKS_ENTRY' } });
    
    // 2. Lock all slots
    for (const slot of exam.slots) {
       await prisma.examSlot.update({ where: { id: slot.id }, data: { isLocked: true } });
    }
    
    // 3. Delete any bad summaries to start fresh
    await prisma.examSummary.deleteMany({ where: { examId: exam.id } });
  }
  console.log('Fixed DB state.');
}

fix().catch(console.error).finally(() => prisma.$disconnect());
