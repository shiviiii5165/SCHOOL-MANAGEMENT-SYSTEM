import { prisma } from '@/lib/prisma';

export class TimetableService {
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
      return { classId: student.classId, studentId: student.id };
    }
    if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId } });
      if (!parent) throw new Error("Parent not found");
      const students = await prisma.student.findMany({ where: { parentId: parent.id } });
      return { classIds: students.map(s => s.classId), studentIds: students.map(s => s.id) };
    }
    throw new Error("Invalid role");
  }

  static async getTimetableForStudent(userId: string, role: string, studentId: string) {
    const access = await this.validateAccess(userId, role);
    if (role === 'STUDENT' && access.studentId !== studentId) throw new Error("Unauthorized");
    if (role === 'PARENT' && !access.studentIds?.includes(studentId)) throw new Error("Unauthorized");

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error("Student not found");

    const periods = await prisma.timetablePeriod.findMany({
      where: { classId: student.classId },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { user: { select: { name: true } } } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    return periods.map(p => ({
      dayOfWeek: p.dayOfWeek,
      startTime: p.startTime,
      endTime: p.endTime,
      subject: p.subject.name,
      teacher: p.teacher.user.name,
    }));
  }

  static async getTimetableForTeacher(userId: string, role: string) {
    const access = await this.validateAccess(userId, role);
    if (role !== 'TEACHER') throw new Error("Unauthorized");

    const periods = await prisma.timetablePeriod.findMany({
      where: { teacherId: access.teacherId },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    return periods.map(p => ({
      dayOfWeek: p.dayOfWeek,
      startTime: p.startTime,
      endTime: p.endTime,
      subject: p.subject.name,
      class: p.class.name,
    }));
  }
}
