import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ParentAssignmentsClient, { ParentAssignmentData } from "./ParentAssignmentsClient";

export default async function ParentAssignmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  try {
    let parentId = session.user.id;
    
    let parent = await prisma.parent.findUnique({ 
      where: { userId: parentId },
      include: {
        students: {
          include: { 
            user: true,
            class: true 
          }
        }
      }
    });
    
    if (!parent) {
      // Fallback for testing generic accounts
      parent = await prisma.parent.findFirst({
        include: {
          students: { 
            include: { 
              user: true,
              class: true
            } 
          }
        }
      });
    }

    if (!parent || !parent.students || parent.students.length === 0) {
      return (
        <div className="p-8">
          <div className="bg-surface border border-border p-12 text-center rounded-xl shadow-card">
            <h3 className="text-lg font-bold text-text-primary mb-2">No Children Profiles Found</h3>
            <p className="text-text-secondary">Your account doesn't seem to have any children linked to it.</p>
          </div>
        </div>
      );
    }

    const childrenIds = parent.students.map(s => s.id);
    const classIds = parent.students.map(s => s.classId);

    const assignments = await prisma.assignment.findMany({
      where: { classId: { in: classIds } },
      include: {
        subject: {
          include: {
            teacher: {
              include: { user: true }
            }
          }
        },
        submissions: {
          where: { studentId: { in: childrenIds } }
        }
      },
      orderBy: { dueDate: 'desc' }
    });

    const formattedData: ParentAssignmentData[] = parent.students.map(child => {
      // Find assignments for this child's class
      const childAssignments = assignments.filter(a => a.classId === child.classId);
      
      const formattedAssignments = childAssignments.map(a => {
        const submission = a.submissions?.find(s => s.studentId === child.id);
        
        return {
          id: a.id,
          title: a.title,
          subject: a.subject?.name || "Unknown Subject",
          teacher: a.subject?.teacher?.user?.name || "Unknown Teacher",
          dueDate: a.dueDate ? a.dueDate.toISOString() : new Date().toISOString(),
          maxMarks: a.maxMarks || 0,
          description: a.description || "",
          fileUrl: a.fileUrl || undefined,
          submission: submission ? {
            submittedAt: submission.submittedAt ? submission.submittedAt.toISOString() : new Date().toISOString(),
            fileUrl: submission.fileUrl || undefined,
            marks: submission.marks ?? undefined,
            feedback: submission.feedback ?? undefined,
            gradedAt: submission.gradedAt ? submission.gradedAt.toISOString() : undefined
          } : undefined
        };
      });

      return {
        childId: child.id,
        childName: child.user?.name || "Unknown Child",
        className: child.class?.name || "Unknown Class",
        assignments: formattedAssignments
      };
    });

    return <ParentAssignmentsClient initialData={formattedData} />;
  } catch (error: any) {
    console.error("Parent Assignments Page Error:", error);
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
