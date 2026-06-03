import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import TeacherFeesClient from "./TeacherFeesClient";
import { redirect } from "next/navigation";

export default async function TeacherFeesPage() {
  const session = await auth();
  if (!session || session.user.role !== 'TEACHER') redirect('/');

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: true }
  });

  if (!teacher || teacher.classes.length === 0) {
    return <div className="p-8">No class assigned.</div>;
  }

  // Get students in their class(es)
  const classIds = teacher.classes.map(c => c.id);
  const students = await prisma.student.findMany({
    where: { classId: { in: classIds } },
    include: { user: true, class: true }
  });

  const studentIds = students.map(s => s.id);

  const fees = await prisma.feeRecord.findMany({
    where: { studentId: { in: studentIds } },
    orderBy: { dueDate: 'asc' }
  });

  const now = new Date();
  
  const studentStats = students.map(student => {
    const studentFees = fees.filter(f => f.studentId === student.id);
    let totalPending = 0;
    let isDefaulter = false;

    studentFees.forEach(fee => {
      let lateFine = 0;
      const dueDate = new Date(fee.dueDate);
      
      if (fee.status !== 'PAID' && dueDate < now) {
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const monthsOverdue = Math.floor(daysOverdue / 30);
        if (monthsOverdue > 0) {
          lateFine = fee.amount * 0.02 * monthsOverdue;
        }
        if (daysOverdue > 30) isDefaulter = true;
      }
      
      if (fee.status !== 'PAID') {
        totalPending += (fee.amount + lateFine - fee.paidAmount);
      }
    });

    return {
      id: student.id,
      name: student.user.name,
      rollNo: student.rollNo,
      className: `${student.class.name} - ${student.class.section}`,
      totalPending,
      isDefaulter,
    };
  });

  const defaultersCount = studentStats.filter(s => s.isDefaulter).length;
  const pendingCount = studentStats.filter(s => s.totalPending > 0).length;

  return (
    <TeacherFeesClient 
      data={studentStats.filter(s => s.totalPending > 0)} 
      defaultersCount={defaultersCount}
      pendingCount={pendingCount}
    />
  );
}
