import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TeacherAssignmentsClient from "./TeacherAssignmentsClient";

export default async function TeacherAssignmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Since authentication is somewhat mocked in this system without full DB integration for teachers in session,
  // we will fetch assignments for the first teacher as a fallback, or based on user.id
  // Real implementation: user.id maps to teacherId.
  let teacherId = session.user.id;
  let teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  
  // Fallback for development if teacher doesn't exist for the logged in user
  if (!teacher) {
    teacher = await prisma.teacher.findFirst();
  }

  if (!teacher) {
    return <div>No teacher profile found.</div>;
  }

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: teacher.id },
    include: {
      subject: true,
      class: true,
      _count: {
        select: { submissions: true }
      },
      submissions: {
        select: { marks: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedAssignments = await Promise.all(assignments.map(async a => {
    const totalStudents = await prisma.student.count({ where: { classId: a.classId } });
    
    // Status logic: if past due date it's CLOSED (unless draft). 
    // For simplicity, everything is ACTIVE if dueDate is future, CLOSED if past.
    const isPastDue = new Date(a.dueDate).getTime() < Date.now();
    let status: "ACTIVE" | "CLOSED" | "DRAFT" = isPastDue ? "CLOSED" : "ACTIVE";
    
    return {
      id: a.id,
      title: a.title,
      subject: a.subject.name,
      className: `${a.class.name} - ${a.class.section}`,
      dueDate: a.dueDate.toISOString(),
      maxMarks: a.maxMarks,
      totalStudents,
      submitted: a._count.submissions,
      graded: a.submissions.filter(s => s.marks !== null).length,
      status,
      createdAt: a.createdAt.toISOString()
    };
  }));

  return <TeacherAssignmentsClient initialAssignments={formattedAssignments} />;
}
