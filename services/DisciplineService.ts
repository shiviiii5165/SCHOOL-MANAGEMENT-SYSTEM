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
      return { studentIds: students.map((s: any) => s.id) };
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return reports.map((r: any) => ({
      id: r.id,
      date: r.createdAt,
      category: r.category,
      description: r.description,
      reportedBy: r.teacher.user.name,
      status: r.status,
      actionTaken: r.actionTaken,
      actionType: r.actionType,
      fineAmount: r.fineAmount,
      fineStatus: r.fineStatus
    }));
  }

  static async fileReport(userId: string, data: { studentId: string, category: string, description: string }) {
    const access = await this.validateAccess(userId, 'TEACHER');

    return prisma.disciplineReport.create({
      data: {
        studentId: data.studentId,
        reportedBy: access.teacherId!,
        category: data.category,
        description: data.description,
        status: 'PENDING'
      }
    });
  }
}
