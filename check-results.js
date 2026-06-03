const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const summaries = await prisma.examSummary.findMany({
    include: { exam: true, student: { include: { user: true } } }
  });
  console.log("Total summaries:", summaries.length);
  
  if (summaries.length > 0) {
    console.log("Sample 0 published:", summaries[0].isPublished, "examId:", summaries[0].examId);
    
    // Check results for this student and exam
    const results = await prisma.examResult.findMany({
      where: {
        examId: summaries[0].examId,
        studentId: summaries[0].studentId
      }
    });
    console.log("Results for student in exam:", results.length);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
