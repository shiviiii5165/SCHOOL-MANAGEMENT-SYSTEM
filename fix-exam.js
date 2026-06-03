const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const exams = await prisma.exam.findMany({
    where: { status: 'COMPLETED' },
    include: { summaries: true }
  });
  
  for (const exam of exams) {
    if (exam.summaries.length === 0) {
      console.log('Fixing exam:', exam.id);
      await prisma.exam.update({
        where: { id: exam.id },
        data: { status: 'MARKS_ENTRY' }
      });
      console.log('Set status to MARKS_ENTRY');
    }
  }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
