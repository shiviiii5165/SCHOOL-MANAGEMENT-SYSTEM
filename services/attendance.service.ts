import prisma from '@/lib/prisma';

export class AttendanceService {
  static async getStudentSummary(userId: string, role: string, studentId: string) {
    // RBAC Check
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student?.id !== studentId) throw new Error('Unauthorized');
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId }, include: { students: true } });
      const ownsStudent = parent?.students.some(s => s.id === studentId);
      if (!ownsStudent) throw new Error('Unauthorized');
    } else if (role !== 'ADMIN' && role !== 'TEACHER') {
      throw new Error('Unauthorized role');
    }

    const summary = await prisma.attendanceSummary.findUnique({
      where: { studentId },
    });
    
    return summary || { presentCount: 0, absentCount: 0, totalClasses: 0, attendancePercentage: 100 };
  }

  static async getStudentHistory(userId: string, role: string, studentId: string, limit: number = 10) {
     // RBAC Check
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student?.id !== studentId) throw new Error('Unauthorized');
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId }, include: { students: true } });
      const ownsStudent = parent?.students.some(s => s.id === studentId);
      if (!ownsStudent) throw new Error('Unauthorized');
    } else if (role !== 'ADMIN' && role !== 'TEACHER') {
      throw new Error('Unauthorized role');
    }

    return prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        student: { select: { studentCode: true, user: { select: { name: true } } } }
      }
    });
  }
}
