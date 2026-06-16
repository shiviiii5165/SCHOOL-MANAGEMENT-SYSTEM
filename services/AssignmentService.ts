import { prisma } from '@/lib/prisma';

export class AssignmentService {
  /**
   * Validates access and returns allowed class/student context
   */
  static async validateAccess(userId: string, role: string) {
    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) throw new Error("Teacher profile not found");
      return { teacherId: teacher.id };
    }
    
    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new Error("Student profile not found");
      return { classId: student.classId, studentId: student.id };
    }

    if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId } });
      if (!parent) throw new Error("Parent profile not found");
      const students = await prisma.student.findMany({ where: { parentId: parent.id } });
      return { studentIds: students.map(s => s.id), classIds: students.map(s => s.classId) };
    }

    if (role === 'ADMIN') {
      return { admin: true };
    }

    throw new Error("Invalid role");
  }

  /**
   * Get assignments for the user based on role
   */
  static async getAssignments(userId: string, role: string, filters?: { classId?: string }) {
    const access = await this.validateAccess(userId, role);

    let whereClause: any = {};

    if (role === 'TEACHER') {
      whereClause.teacherId = access.teacherId;
      if (filters?.classId) whereClause.classId = filters.classId;
    } else if (role === 'STUDENT') {
      whereClause.classId = access.classId;
    } else if (role === 'PARENT') {
      whereClause.classId = { in: access.classIds };
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        subject: true,
        class: true,
        _count: { select: { submissions: true } }
      },
      orderBy: { dueDate: 'desc' }
    });

    return assignments;
  }

  /**
   * Used for AI Tools: Get pending assignments for a student
   */
  static async getPendingAssignments(userId: string, role: string, studentId: string) {
    const access = await this.validateAccess(userId, role);
    
    if (role === 'STUDENT' && access.studentId !== studentId) throw new Error("Unauthorized");
    if (role === 'PARENT' && !access.studentIds?.includes(studentId)) throw new Error("Unauthorized");

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error("Student not found");

    const assignments = await prisma.assignment.findMany({
      where: { classId: student.classId },
      include: {
        subject: true,
        submissions: { where: { studentId } }
      },
      orderBy: { dueDate: 'asc' }
    });

    const pending = assignments.filter(a => a.submissions.length === 0);
    const completed = assignments.filter(a => a.submissions.length > 0);

    return {
      pending,
      completedCount: completed.length,
      pendingCount: pending.length
    };
  }

  /**
   * Create an assignment (Teacher only)
   */
  static async createAssignment(userId: string, data: { title: string; description?: string; subjectId: string; classId: string; dueDate: string; maxMarks: number; fileUrl?: string }) {
    const access = await this.validateAccess(userId, 'TEACHER');

    const assignment = await prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description || "",
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: access.teacherId!,
        dueDate: new Date(data.dueDate),
        maxMarks: Number(data.maxMarks),
        fileUrl: data.fileUrl || null,
      }
    });

    // Notify students and parents
    const students = await prisma.student.findMany({
      where: { classId: data.classId },
      include: { parent: true }
    });

    const notifications = [];
    for (const student of students) {
      notifications.push({
        userId: student.userId,
        title: "New Assignment",
        message: `A new assignment "${data.title}" has been posted.`,
        type: "ACADEMIC" as any,
        link: "/student/assignments",
      });

      if (student.parent) {
        notifications.push({
          userId: student.parent.userId,
          title: "New Assignment",
          message: `A new assignment "${data.title}" has been posted for your child.`,
          type: "ACADEMIC" as any,
          link: "/parent/assignments",
        });
      }
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    return assignment;
  }
}
