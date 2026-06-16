import { prisma } from '@/lib/prisma';

export class ExamService {
  /**
   * Validate access based on role
   */
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
      return { classIds: students.map(s => s.classId), studentIds: students.map(s => s.id) };
    }

    if (role === 'ADMIN') return { admin: true };

    throw new Error("Invalid role");
  }

  /**
   * Used for AI Tools: Get upcoming exams for a student
   */
  static async getUpcomingExams(userId: string, role: string, studentId: string) {
    const access = await this.validateAccess(userId, role);
    if (role === 'STUDENT' && access.studentId !== studentId) throw new Error("Unauthorized");
    if (role === 'PARENT' && !access.studentIds?.includes(studentId)) throw new Error("Unauthorized");

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error("Student not found");

    const exams = await prisma.exam.findMany({
      where: { 
        classId: student.classId,
        status: { in: ['PUBLISHED', 'MARKS_ENTRY'] }
      },
      include: {
        slots: {
          include: { subject: true },
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    const now = new Date();
    const upcoming = exams.filter(e => new Date(e.startDate) >= now || new Date(e.endDate) >= now);

    return upcoming.map(exam => ({
      id: exam.id,
      title: exam.title,
      startDate: exam.startDate,
      endDate: exam.endDate,
      slots: exam.slots.map(s => ({
        subject: s.subject.name,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    }));
  }

  /**
   * Used for AI Tools: Get published results for a student
   */
  static async getExamResults(userId: string, role: string, studentId: string) {
    const access = await this.validateAccess(userId, role);
    if (role === 'STUDENT' && access.studentId !== studentId) throw new Error("Unauthorized");
    if (role === 'PARENT' && !access.studentIds?.includes(studentId)) throw new Error("Unauthorized");

    const results = await prisma.examResultSummary.findMany({
      where: { studentId },
      include: {
        exam: {
          select: { title: true, term: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return results.map(r => ({
      examTitle: r.exam.title,
      term: r.exam.term,
      type: r.exam.type,
      totalMarks: r.totalMarks,
      obtainedMarks: r.obtainedMarks,
      percentage: r.percentage,
      grade: r.grade,
      rank: r.rank,
      status: r.status
    }));
  }
}
