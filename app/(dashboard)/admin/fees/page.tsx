import { prisma } from "@/lib/prisma";
import AdminFeesClient from "./AdminFeesClient";

export default async function AdminFeesPage() {
  const fees = await prisma.feeRecord.findMany({
    orderBy: { dueDate: 'desc' }
  });

  const students = await prisma.student.findMany({
    where: { id: { in: fees.map(f => f.studentId) } },
    include: { user: true, class: true }
  });

  const studentMap = new Map(students.map(s => [s.id, s]));

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Dynamic calculations for late fine & status
  const enrichedFees = fees.map(fee => {
    let lateFine = 0;
    let dynamicStatus = fee.status;
    const dueDate = new Date(fee.dueDate);

    if (fee.status !== 'PAID') {
      if (dueDate < now) {
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const monthsOverdue = Math.floor(daysOverdue / 30);
        if (monthsOverdue > 0) {
          lateFine = fee.amount * 0.02 * monthsOverdue;
        }
        dynamicStatus = fee.paidAmount > 0 ? 'PARTIAL' : 'OVERDUE';
      } else {
        const daysToDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysToDue <= 15) {
          dynamicStatus = fee.paidAmount > 0 ? 'PARTIAL' : 'DUE SOON';
        } else {
          dynamicStatus = fee.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
        }
      }
    }

    const outstanding = fee.amount + lateFine - fee.paidAmount;

    return { ...fee, lateFine, dynamicStatus, outstanding };
  });

  const data = enrichedFees.map(fee => {
    const student = studentMap.get(fee.studentId);
    return {
      id: fee.id,
      studentName: student?.user.name || "Unknown",
      rollNo: student?.rollNo || "N/A",
      className: student?.class ? `${student.class.name} - ${student.class.section}` : "N/A",
      amount: fee.amount,
      paidAmount: fee.paidAmount,
      outstanding: fee.outstanding,
      lateFine: fee.lateFine,
      feeType: fee.feeType,
      dueDate: fee.dueDate,
      status: fee.dynamicStatus,
      paidDate: fee.paidDate
    };
  });

  // Transport vs Other
  const transportCollection = enrichedFees
    .filter(f => f.feeType.toLowerCase().includes('transport') && f.paidAmount > 0)
    .reduce((sum, f) => sum + f.paidAmount, 0);

  const totalCollection = enrichedFees.reduce((sum, f) => sum + f.paidAmount, 0);
  
  const thisMonthCollection = enrichedFees
    .filter(f => f.paidDate && f.paidDate >= currentMonthStart)
    .reduce((sum, f) => sum + f.paidAmount, 0);

  const outstandingAmount = enrichedFees.reduce((sum, f) => sum + f.outstanding, 0);
  
  const defaulters = data.filter(d => {
    const daysOverdue = Math.floor((now.getTime() - new Date(d.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    return d.status === 'OVERDUE' && daysOverdue > 30;
  });

  const stats = {
    totalCollection,
    thisMonthCollection,
    transportCollection,
    outstandingAmount,
    defaulterCount: defaulters.length
  };

  return <AdminFeesClient data={data} stats={stats} defaulters={defaulters} />;
}
