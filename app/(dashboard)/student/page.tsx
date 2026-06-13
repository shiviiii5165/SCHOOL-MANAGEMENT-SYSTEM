import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StudentDashboardClient from "./StudentDashboardClient";

export default async function StudentDashboard() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Session expired. Please log out and log back in.</p>
      </div>
    );
  }

  let student: any = null;
  let unpaidFines: any[] = [];
  try {
    student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    });

    if (student) {
      unpaidFines = await prisma.disciplineReport.findMany({
        where: {
          studentId: student.id,
          fineStatus: { in: ["PENDING", "OVERDUE"] }
        },
        orderBy: { fineDueDate: "asc" }
      });
    }
  } catch (error) {
    console.error("Student dashboard error:", error);
  }

  return <StudentDashboardClient student={student} unpaidFines={unpaidFines} />;
}
