import ParentDashboardClient from "./ParentDashboardClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ParentDashboard() {
  const session = await auth();
  if (!session || !session.user?.id || session.user?.role !== "PARENT") {
    redirect("/login");
  }

  try {
    const parentData = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            user: true,
            class: true,
            attendanceSummary: true,
            feeRecords: true,
            examResults: {
              take: 3,
              orderBy: { enteredAt: 'desc' },
              include: { slot: { include: { subject: true } } }
            }
          }
        }
      }
    });

    const unreadNoticesCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      }
    });

    if (!parentData) {
      return <div className="p-6">Parent profile not found.</div>;
    }

    const childrenData = parentData.students.map((student) => {
        let pendingFees = 0;
        const upcomingFees: any[] = [];
        student.feeRecords?.forEach(record => {
          const now = new Date();
          const dueDate = new Date(record.dueDate);
          
          if (record.status !== 'PAID') {
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysToDue = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            
            let lateFine = 0;
            if (daysToDue < 0) {
              const daysOverdue = Math.abs(daysToDue);
              const monthsOverdue = Math.floor(daysOverdue / 30);
              if (monthsOverdue > 0) {
                lateFine = record.amount * 0.02 * monthsOverdue;
              }
              upcomingFees.push({
                type: 'fee',
                title: `${record.feeType} Fee`,
                statusText: `Overdue by ${daysOverdue} days`,
                isOverdue: true
              });
            } else if (daysToDue <= 15) {
              upcomingFees.push({
                type: 'fee',
                title: `${record.feeType} Fee`,
                statusText: `Due in ${daysToDue} days`,
                isOverdue: false
              });
            }
            pendingFees += (record.amount + lateFine - record.paidAmount);
          }
        });

      return {
        id: student.id,
        name: student.user ? student.user.name : "Child",
        class: `${student.class.name} - ${student.class.section}`,
        attendance: student.attendanceSummary ? `${Math.round(student.attendanceSummary.attendancePercentage)}%` : "100%",
        lastScore: student.examResults?.length > 0 ? student.examResults[0].grade : "N/A",
        recentGrades: student.examResults?.map(er => ({ subject: er.slot?.subject?.name || 'Unknown', grade: er.grade || 'N/A' })) || [],
        upcomingFees,
        isSuspended: student.isSuspended,
        suspendedUntil: student.suspendedUntil ? student.suspendedUntil.toISOString() : null,
        suspendedReason: student.suspendedReason,
        pendingFees
      };
    });

    return <ParentDashboardClient childrenData={childrenData} parentName={session.user.name || "Parent"} newNoticesCount={unreadNoticesCount} />;
  } catch (error: any) {
    console.error("Parent dashboard error:", error);
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">Unable to load parent dashboard. Please try again.</p>
      </div>
    );
  }
}
