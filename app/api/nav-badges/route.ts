export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    const badges: Record<string, number> = {};

    // 1. Fetch unread Messages count (cross-role)
    const participants = await prisma.messageParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              where:   { isDeleted: false },
              orderBy: { createdAt: 'desc' },
              take:    1,
            }
          }
        }
      }
    });

    let unreadMessages = 0;
    for (const p of participants) {
      const lastMsg = p.conversation.messages[0];
      if (lastMsg && (!p.lastReadAt || lastMsg.createdAt > p.lastReadAt)) {
        unreadMessages++;
      }
    }
    
    // Set message badge for all roles
    badges["/admin/messages"] = unreadMessages;
    badges["/teacher/messages"] = unreadMessages;
    badges["/student/messages"] = unreadMessages;
    badges["/parent/messages"] = unreadMessages;

    // 2. Fetch unread notifications grouping by link
    const unreadNotifs = await prisma.notification.findMany({
      where: { userId, isRead: false },
      select: { link: true }
    });

    // Group counts by exact link
    for (const notif of unreadNotifs) {
      if (notif.link) {
        badges[notif.link] = (badges[notif.link] || 0) + 1;
      }
    }

    // 3. Custom badge logic per role for items not covered fully by notifications

    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId } });
      if (student) {
        // Pending Assignments
        const assignments = await prisma.assignment.findMany({
          where: { classId: student.classId },
          include: { submissions: { where: { studentId: student.id } } }
        });
        
        let pendingAssn = 0;
        const now = new Date();
        for (const a of assignments) {
          if (a.submissions.length === 0 && new Date(a.dueDate) >= now) {
            pendingAssn++;
          }
        }
        
        // Add pending assignments to whatever notifications already exist for that route
        badges["/student/assignments"] = (badges["/student/assignments"] || 0) + pendingAssn;
      }
    }

    if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({ 
        where: { userId },
        include: { students: true } 
      });
      if (parent && parent.students.length > 0) {
        const classIds = parent.students.map(s => s.classId);
        const studentIds = parent.students.map(s => s.id);
        
        // Pending Assignments for all children
        const assignments = await prisma.assignment.findMany({
          where: { classId: { in: classIds } },
          include: { submissions: { where: { studentId: { in: studentIds } } } }
        });

        let pendingAssn = 0;
        const now = new Date();
        for (const a of assignments) {
          // An assignment is pending if ANY applicable child hasn't submitted
          const applicableChildren = parent.students.filter(s => s.classId === a.classId);
          for (const child of applicableChildren) {
            const hasSubmitted = a.submissions.some(sub => sub.studentId === child.id);
            if (!hasSubmitted && new Date(a.dueDate) >= now) {
              pendingAssn++;
            }
          }
        }
        
        badges["/parent/assignments"] = (badges["/parent/assignments"] || 0) + pendingAssn;
      }
    }

    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (teacher) {
        // Assignments that need grading
        const subjects = await prisma.subject.findMany({ where: { teacherId: teacher.id } });
        const assignments = await prisma.assignment.findMany({
          where: { subjectId: { in: subjects.map(s => s.id) } },
          include: { submissions: true }
        });
        
        let ungraded = 0;
        for (const a of assignments) {
          for (const sub of a.submissions) {
            if (sub.marks === null) {
              ungraded++;
            }
          }
        }
        badges["/teacher/assignments"] = (badges["/teacher/assignments"] || 0) + ungraded;
      }
    }

    // Clean up mapping so we only return > 0 counts
    const finalBadges: Record<string, number> = {};
    for (const [key, val] of Object.entries(badges)) {
      if (val > 0) {
        finalBadges[key] = val;
      }
    }

    return NextResponse.json({ badges: finalBadges });
  } catch (error) {
    console.error("Error fetching nav badges:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
