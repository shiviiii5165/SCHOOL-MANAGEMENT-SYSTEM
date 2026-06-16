import { prisma } from '@/lib/prisma';

export class NoticeService {
  static async validateAccess(userId: string, role: string) {
    if (role === 'ADMIN') return { admin: true };

    const classIds = [];
    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId }, include: { classes: true } });
      if (!teacher) throw new Error("Teacher not found");
      classIds.push(...teacher.classes.map(c => c.id));
    } else if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (!student) throw new Error("Student not found");
      classIds.push(student.classId);
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.findUnique({ where: { userId } });
      if (!parent) throw new Error("Parent not found");
      const students = await prisma.student.findMany({ where: { parentId: parent.id } });
      classIds.push(...students.map(s => s.classId));
    } else {
      throw new Error("Invalid role");
    }

    return { classIds };
  }

  static async getNotices(userId: string, role: string) {
    const access = await this.validateAccess(userId, role);
    let whereClause: any = {};

    if (role !== 'ADMIN') {
      whereClause = {
        OR: [
          { targetAudience: 'ALL' },
          { targetAudience: role },
          { targetClasses: { some: { id: { in: access.classIds } } } }
        ]
      };
    }

    const notices = await prisma.notice.findMany({
      where: whereClause,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 20
    });

    return notices;
  }

  static async getActiveNotices(userId: string, role: string) {
    const allNotices = await this.getNotices(userId, role);
    const now = new Date();
    return allNotices.filter(n => !n.expiresAt || new Date(n.expiresAt) > now);
  }

  static async broadcastNotice(adminId: string, data: { title: string, content: string, targetAudience: string }) {
    // Only Admin
    const admin = await prisma.admin.findUnique({ where: { userId: adminId } });
    if (!admin) throw new Error("Unauthorized");

    return prisma.notice.create({
      data: {
        title: data.title,
        content: data.content,
        targetAudience: data.targetAudience as any,
        authorId: adminId
      }
    });
  }
}
