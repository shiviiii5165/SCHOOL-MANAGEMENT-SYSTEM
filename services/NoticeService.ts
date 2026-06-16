import { prisma } from '@/lib/prisma';

export class NoticeService {
  static async validateAccess(userId: string, role: string) {
    if (role === 'ADMIN') return { admin: true };

    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) throw new Error("Teacher not found");
      return { role: 'TEACHER' };
    } else if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new Error("Student not found");
      return { classId: student.classId };
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId } });
      if (!parent) throw new Error("Parent not found");
      const students = await prisma.student.findMany({ where: { parentId: parent.id } });
      return { classIds: students.map((s: any) => s.classId) };
    }

    throw new Error("Invalid role");
  }

  static async getNotices(userId: string, role: string) {
    const access = await this.validateAccess(userId, role);
    let whereClause: any = {};

    if (role !== 'ADMIN') {
      // Show notices targeted at ALL, or the user's role
      whereClause = {
        OR: [
          { targetAudience: 'ALL' },
          { targetAudience: role },
        ]
      };

      // Also include class-targeted notices if applicable
      if (access.classId) {
        whereClause.OR.push({ targetClassId: access.classId });
      }
      if (access.classIds) {
        whereClause.OR.push({ targetClassId: { in: access.classIds } });
      }
    }

    const notices = await prisma.notice.findMany({
      where: whereClause,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    });

    return notices.map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      category: n.category,
      priority: n.priority,
      isPinned: n.isPinned,
      createdAt: n.createdAt,
      expiresAt: n.expiresAt
    }));
  }

  static async getActiveNotices(userId: string, role: string) {
    const allNotices = await this.getNotices(userId, role);
    const now = new Date();
    return allNotices.filter((n: any) => !n.expiresAt || new Date(n.expiresAt) > now);
  }

  static async broadcastNotice(adminId: string, data: { title: string; content: string; targetAudience: string }) {
    return prisma.notice.create({
      data: {
        title: data.title,
        content: data.content,
        category: 'GENERAL',
        targetAudience: data.targetAudience as any,
        createdById: adminId,
        createdByRole: 'ADMIN',
        audience: [],
      }
    });
  }
}
