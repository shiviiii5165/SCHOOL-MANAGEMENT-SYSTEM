import { prisma } from '@/lib/prisma';

export class DisciplineService {
  static async validateAccess(userId: string, role: string) {
    if (role === 'ADMIN') return { admin: true };
    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) throw new Error("Teacher not found");
      return { teacherId: teacher.id };
    }
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new Error("Student not found");
      return { studentId: student.id };
    }
    if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId } });
      if (!parent) throw new Error("Parent not found");
      const students = await prisma.student.findMany({ where: { parentId: parent.id } });
      return { studentIds: students.map(s => s.id) };
    }
    throw new Error("Invalid role");
  }

  static async getReportsForStudent(userId: string, role: string, studentId: string) {
    const access = await this.validateAccess(userId, role);
    if (role === 'STUDENT' && access.studentId !== studentId) throw new Error("Unauthorized");
    if (role === 'PARENT' && !access.studentIds?.includes(studentId)) throw new Error("Unauthorized");

    const reports = await prisma.disciplineReport.findMany({
      where: { studentId },
      include: {
        teacher: { select: { user: { select: { name: true } } } },
        action: true,
        fine: true
      },
      orderBy: { incidentDate: 'desc' }
    });

    return reports.map(r => ({
      id: r.id,
      date: r.incidentDate,
      category: r.category,
      severity: r.severity,
      description: r.description,
      reportedBy: r.teacher.user.name,
      status: r.status,
      action: r.action ? r.action.actionType : null,
      fine: r.fine ? { amount: r.fine.amount, status: r.fine.status } : null
    }));
  }

  static async fileReport(userId: string, data: { studentId: string, category: string, severity: string, description: string, incidentDate: string }) {
    const access = await this.validateAccess(userId, 'TEACHER');
    
    return prisma.disciplineReport.create({
      data: {
        studentId: data.studentId,
        teacherId: access.teacherId!,
        category: data.category as any,
        severity: data.severity as any,
        description: data.description,
        incidentDate: new Date(data.incidentDate),
        status: 'PENDING_REVIEW'
      }
    });
  }
}
