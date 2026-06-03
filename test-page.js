const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testPage() {
  const student = await prisma.student.findFirst({
    include: { user: true }
  });
  console.log("Student:", student?.user?.name);
  
  const assignments = await prisma.assignment.findMany({
    where: { classId: student.classId },
    include: {
      subject: {
        include: {
          teacher: {
            include: { user: true }
          }
        }
      },
      submissions: {
        where: { studentId: student.id }
      }
    },
    orderBy: { dueDate: 'asc' }
  });
  console.log("Found assignments:", assignments.length);

  const formattedAssignments = assignments.map(a => {
    const submission = a.submissions[0];
    
    return {
      id: a.id,
      title: a.title,
      subject: a.subject.name,
      teacher: a.subject.teacher?.user?.name || "Unknown Teacher",
      dueDate: a.dueDate.toISOString(),
      maxMarks: a.maxMarks,
      description: a.description || "",
      submission: submission ? {
        submittedAt: submission.submittedAt.toISOString(),
        marks: submission.marks ?? undefined,
        feedback: submission.feedback ?? undefined,
        gradedAt: submission.gradedAt?.toISOString()
      } : undefined
    };
  });
  console.log("Formatted:", formattedAssignments.length);
}

testPage().catch(console.error).finally(() => prisma.$disconnect());
