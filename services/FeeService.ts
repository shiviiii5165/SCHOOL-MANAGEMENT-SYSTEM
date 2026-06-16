import { prisma } from '@/lib/prisma';

export class FeeService {
  /**
   * Validates access and returns a list of student IDs the user is allowed to query.
   */
  private static async getAuthorizedStudentIds(userId: string, role: string, requestedStudentId?: string): Promise<string[]> {
    if (role === 'ADMIN') {
      if (requestedStudentId) return [requestedStudentId];
      // For admin dashboard fallback, they shouldn't call getDashboardData without a specific student
      throw new Error("Admin must specify a studentId for dashboard data");
    }

    if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId } });
      if (!parent) throw new Error("Parent profile not found");
      
      const students = await prisma.student.findMany({ where: { parentId: parent.id } });
      const allowedIds = students.map(s => s.id);
      
      if (requestedStudentId && !allowedIds.includes(requestedStudentId)) {
        throw new Error("Unauthorized to access this student's data");
      }
      return requestedStudentId ? [requestedStudentId] : allowedIds;
    }

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new Error("Student profile not found");
      
      if (requestedStudentId && student.id !== requestedStudentId) {
        throw new Error("Unauthorized to access other student's data");
      }
      return [student.id];
    }

    throw new Error("Invalid role for this endpoint");
  }

  /**
   * Centralized business logic for getting fee dashboard data
   */
  static async getDashboardData(userId: string, role: string) {
    let students = [];

    if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId } });
      if (!parent) throw new Error("Parent profile not found");
      students = await prisma.student.findMany({ 
        where: { parentId: parent.id },
        include: { user: { select: { name: true } } }
      });
    } else if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ 
        where: { userId },
        include: { user: { select: { name: true } } }
      });
      if (!student) throw new Error("Student profile not found");
      students = [student];
    } else {
      throw new Error("Invalid role for this endpoint");
    }

    const studentIds = students.map(s => s.id);

    // Fetch fee records
    const feeRecords = await prisma.feeRecord.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        student: { select: { id: true, user: { select: { name: true } }, hasTransport: true } },
        installmentPlans: { include: { schedules: { orderBy: { installmentNumber: 'asc' } } } }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Fetch payments
    const payments = await prisma.payment.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    // Fetch wallets
    const wallets = await prisma.creditWallet.findMany({
      where: { studentId: { in: studentIds } }
    });

    // Calculate dynamic statuses (Core Business Logic)
    const enrichedRecords = feeRecords.map(record => {
      let lateFine = 0;
      let dynamicStatus = record.status;
      
      const now = new Date();
      const dueDate = new Date(record.dueDate);
      
      if (record.status !== 'PAID') {
        if (dueDate < now) {
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          const monthsOverdue = Math.floor(daysOverdue / 30);
          if (monthsOverdue > 0) {
            lateFine = record.amount * 0.02 * monthsOverdue;
          }
          dynamicStatus = record.paidAmount > 0 ? 'PARTIAL' : 'OVERDUE';
        } else {
          const daysToDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysToDue <= 15) {
            dynamicStatus = record.paidAmount > 0 ? 'PARTIAL' : 'DUE SOON';
          } else {
            dynamicStatus = record.paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
          }
        }
      }

      return {
        ...record,
        lateFine,
        dynamicStatus,
        outstandingAmount: record.amount + lateFine - record.paidAmount,
      };
    });

    return {
      students,
      feeRecords: enrichedRecords,
      payments,
      wallets
    };
  }

  /**
   * For AI Tools: Get pending fees for a specific student
   */
  static async getPendingFees(userId: string, role: string, studentId: string) {
    const allowedIds = await this.getAuthorizedStudentIds(userId, role, studentId);
    if (!allowedIds.includes(studentId)) throw new Error("Unauthorized");

    const fullData = await this.getDashboardData(userId, role);
    
    // Filter specifically for the student and pending fees
    const pendingRecords = fullData.feeRecords.filter(r => 
      r.studentId === studentId && r.dynamicStatus !== 'PAID'
    );
    
    const totalPending = pendingRecords.reduce((sum, r) => sum + r.outstandingAmount, 0);

    return {
      studentId,
      totalPending,
      pendingRecords: pendingRecords.map(r => ({
        id: r.id,
        feeType: r.feeType,
        dueDate: r.dueDate,
        amount: r.amount,
        lateFine: r.lateFine,
        outstandingAmount: r.outstandingAmount,
        status: r.dynamicStatus
      }))
    };
  }
}
