const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const parentData = await prisma.parent.findUnique({
      where: { userId: 'cmppo38ai00hz10xqcvtblzi1' },
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

    const childrenData = parentData.students.map((student) => {
        let pendingFees = 0;
        const upcomingFees = [];
        student.feeRecords?.forEach(record => {
          let lateFine = 0;
          const now = new Date();
          const dueDate = new Date(record.dueDate);
          
          if (record.status !== 'PAID') {
            const daysToDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (dueDate < now) {
              const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
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
        name: student.user ? student.user.name : 'Child',
        class: `${student.class.name} - ${student.class.section}`,
        attendance: student.attendanceSummary ? `${Math.round(student.attendanceSummary.attendancePercentage)}%` : '100%',
        lastScore: student.examResults?.length > 0 ? student.examResults[0].grade : 'N/A',
        recentGrades: student.examResults?.map(er => ({ subject: er.slot?.subject?.name || 'Unknown', grade: er.grade || 'N/A' })) || [],
        upcomingFees,
        isSuspended: student.isSuspended,
        suspendedUntil: student.suspendedUntil ? student.suspendedUntil.toISOString() : null,
        suspendedReason: student.suspendedReason,
        pendingFees
      };
    });
    console.log('Success!', childrenData.length);
  } catch (error) {
    console.error('Parent dashboard error:', error);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
