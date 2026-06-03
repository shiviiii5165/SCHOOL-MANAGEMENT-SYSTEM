import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentAssignmentsClient, { StudentAssignment } from "./StudentAssignmentsClient";

export default async function StudentAssignmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    let studentId = session.user.id;
    
    if (!studentId) {
      return <div className="p-8 text-center text-red-500">Error: Invalid session. Missing user ID. Please log out and log back in.</div>;
    }

    let student = await prisma.student.findUnique({ where: { userId: studentId } });
    
    if (!student) {
      // Fallback for testing generic accounts
      student = await prisma.student.findFirst();
    }

    if (!student) {
      return <div className="p-8 text-center text-text-muted">No student profile found.</div>;
    }

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

    const formattedAssignments: StudentAssignment[] = assignments.map(a => {
      const submission = a.submissions && a.submissions.length > 0 ? a.submissions[0] : null;
      
      return {
        id: a.id,
        title: a.title,
        subject: a.subject?.name || "Unknown Subject",
        teacher: a.subject?.teacher?.user?.name || "Unknown Teacher",
        dueDate: a.dueDate ? a.dueDate.toISOString() : new Date().toISOString(),
        maxMarks: a.maxMarks || 0,
        description: a.description || "",
        submission: submission ? {
          submittedAt: submission.submittedAt ? submission.submittedAt.toISOString() : new Date().toISOString(),
          marks: submission.marks ?? undefined,
          feedback: submission.feedback ?? undefined,
          gradedAt: submission.gradedAt ? submission.gradedAt.toISOString() : undefined
        } : undefined
      };
    });

    return <StudentAssignmentsClient initialAssignments={formattedAssignments} />;
  } catch (error: any) {
    console.error("Assignments Page Error:", error);
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <h3 className="font-bold mb-2">Error Loading Assignments</h3>
          <p className="font-mono text-sm">{error.message}</p>
        </div>
      </div>
    );
  }
}
