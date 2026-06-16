import { prisma } from "@/lib/prisma";

export class AttendanceService {
  static async getStudentSummary(userId: string, role: string, studentId?: string) {
    let targetStudentId = studentId;

    // RBAC Check & Auto-resolve
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new Error('Student record not found');
      if (studentId && student.id !== studentId) throw new Error('Unauthorized');
      targetStudentId = student.id;
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId }, include: { students: true } });
      if (!parent || parent.students.length === 0) throw new Error('No students found for this parent');
      if (!studentId && parent.students.length === 1) {
        targetStudentId = parent.students[0].id;
      } else {
        const ownsStudent = parent.students.some(s => s.id === studentId);
        if (!ownsStudent) throw new Error('Unauthorized or multiple students found. Please specify student name.');
      }
    } else if (role !== 'ADMIN' && role !== 'TEACHER') {
      throw new Error('Unauthorized role');
    }

    if (!targetStudentId) throw new Error('studentId is required');

    const summary = await prisma.attendanceSummary.findUnique({
      where: { studentId: targetStudentId },
    });
    
    return summary || { presentCount: 0, absentCount: 0, totalClasses: 0, attendancePercentage: 100 };
  }

  static async getStudentHistory(userId: string, role: string, studentId?: string, limit: number = 10) {
    let targetStudentId = studentId;

    // RBAC Check & Auto-resolve
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new Error('Student record not found');
      if (studentId && student.id !== studentId) throw new Error('Unauthorized');
      targetStudentId = student.id;
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId }, include: { students: true } });
      if (!parent || parent.students.length === 0) throw new Error('No students found for this parent');
      if (!studentId && parent.students.length === 1) {
        targetStudentId = parent.students[0].id;
      } else {
        const ownsStudent = parent.students.some(s => s.id === studentId);
        if (!ownsStudent) throw new Error('Unauthorized or multiple students found. Please specify student name.');
      }
    } else if (role !== 'ADMIN' && role !== 'TEACHER') {
      throw new Error('Unauthorized role');
    }

    if (!targetStudentId) throw new Error('studentId is required');

    return prisma.attendance.findMany({
      where: { studentId: targetStudentId },
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        student: { select: { studentCode: true, user: { select: { name: true } } } }
      }
    });
  }
}
