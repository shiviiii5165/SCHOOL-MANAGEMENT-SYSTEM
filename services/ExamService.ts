import { prisma } from '@/lib/prisma';

export class ExamService {
  static async validateAccess(userId: string, role: string) {
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
      return { classIds: students.map((s: any) => s.classId), studentIds: students.map((s: any) => s.id) };
    }

    if (role === 'ADMIN') return { admin: true };

    throw new Error("Invalid role");
  }

  /**
   * Get upcoming exams for a student via ExamSlot -> classId
   */
  static async getUpcomingExams(userId: string, role: string, studentId: string) {
    const access = await this.validateAccess(userId, role);
    if (role === 'STUDENT' && access.studentId !== studentId) throw new Error("Unauthorized");
    if (role === 'PARENT' && !access.studentIds?.includes(studentId)) throw new Error("Unauthorized");

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error("Student not found");

    const now = new Date();

    // Find exams that have slots for this student's class and are upcoming
    const exams = await prisma.exam.findMany({
      where: {
        status: { in: ['PUBLISHED', 'MARKS_ENTRY'] },
        endDate: { gte: now },
        slots: { some: { classId: student.classId } }
      },
      include: {
        slots: {
          where: { classId: student.classId },
          include: { subject: true },
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    return exams.map((exam: any) => ({
      id: exam.id,
      name: exam.name,
      type: exam.type,
      startDate: exam.startDate,
      endDate: exam.endDate,
      slots: exam.slots.map((s: any) => ({
        subject: s.subject.name,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        room: s.room,
        maxMarks: s.maxMarks
      }))
    }));
  }

  /**
   * Get published exam results/summaries for a student
   */
  static async getExamResults(userId: string, role: string, studentId: string) {
    const access = await this.validateAccess(userId, role);
    if (role === 'STUDENT' && access.studentId !== studentId) throw new Error("Unauthorized");
    if (role === 'PARENT' && !access.studentIds?.includes(studentId)) throw new Error("Unauthorized");

    const summaries = await prisma.examSummary.findMany({
      where: { studentId, isPublished: true },
      include: {
        exam: { select: { name: true, type: true, academicYear: true } }
      },
      orderBy: { computedAt: 'desc' }
    });

    return summaries.map((r: any) => ({
      examName: r.exam.name,
      examType: r.exam.type,
      academicYear: r.exam.academicYear,
      totalMarks: r.totalMarks,
      maxMarks: r.maxMarks,
      percentage: r.percentage,
      grade: r.grade,
      rank: r.rank,
      isPassed: r.isPassed
    }));
  }
}
