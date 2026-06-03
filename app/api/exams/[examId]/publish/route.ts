export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotifications } from "@/lib/notifications";
import { requireAuth } from '@/lib/security/apiGuard';
import { handleApiError } from '@/lib/security/errorHandler';

// POST /api/exams/[examId]/publish — publish timetable + generate HallTickets + notify
export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const { session, error: authError } = await requireAuth(['ADMIN']);
    if (authError) return authError;

    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: { slots: { include: { class: true } } },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    if (exam.slots.length === 0) {
      return NextResponse.json({ error: "Cannot publish: no timetable slots defined" }, { status: 400 });
    }

    // Get all unique class IDs from slots
    const classIds = exam.slots.map(s => s.classId).filter((v, i, a) => a.indexOf(v) === i);

    // Get system settings for detention threshold
    const settings = await prisma.systemSettings.findFirst();
    const threshold = settings?.detentionThreshold ?? 75;

    // Get all students in applicable classes
    const students = await prisma.student.findMany({
      where: { classId: { in: classIds } },
      include: { user: true, parent: { include: { user: true } } },
    });

    const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const getBlockReason = (student: any): string | null => {
      if (student.isSuspended) return `Account suspended until ${formatDate(student.suspendedUntil || new Date())}`;
      if (!student.examEligible) return 'Detained due to low attendance';
      if (student.attendancePercentage < threshold)
        return `Attendance ${student.attendancePercentage.toFixed(1)}% below required ${threshold}%`;
      return null;
    };

    // Generate HallTickets for each student
    const notifications: any[] = [];
    for (const student of students) {
      const blockReason = getBlockReason(student);
      const isBlocked = !!blockReason;

      await prisma.hallTicket.upsert({
        where: { examId_studentId: { examId: exam.id, studentId: student.id } },
        update: { isBlocked, blockReason },
        create: { examId: exam.id, studentId: student.id, isBlocked, blockReason },
      });

      if (isBlocked) {
        // Blocked notifications
        notifications.push({
          userId: student.userId,
          title: "🚫 Admit Card Blocked",
          message: `You are not eligible for ${exam.name}. Reason: ${blockReason}`,
          type: "ACADEMIC",
          link: "/student/exams",
        });
        if (student.parent?.userId) {
          notifications.push({
            userId: student.parent.userId,
            title: `🚫 ${student.user.name}'s Admit Card Blocked`,
            message: `${student.user.name} is not eligible for ${exam.name}. Reason: ${blockReason}. Please contact the school.`,
            type: "ACADEMIC",
            link: "/parent/exams",
          });
        }
      } else {
        // Eligible notifications
        notifications.push({
          userId: student.userId,
          title: `📋 ${exam.name} Timetable Published`,
          message: `The exam timetable is out. Download your admit card now!`,
          type: "ACADEMIC",
          link: "/student/exams",
        });
        if (student.parent?.userId) {
          notifications.push({
            userId: student.parent.userId,
            title: `📋 Exam Schedule for ${student.user.name}`,
            message: `${exam.name} timetable has been published for ${student.user.name}.`,
            type: "ACADEMIC",
            link: "/parent/exams",
          });
        }
      }
    }

    // Update exam status to SCHEDULED
    await prisma.exam.update({
      where: { id: exam.id },
      data: { status: "SCHEDULED" },
    });

    // Send all notifications
    if (notifications.length > 0) {
      await createNotifications(notifications);
    }

    return NextResponse.json({
      success: true,
      studentsTotal: students.length,
      blocked: students.filter(s => !!getBlockReason(s)).length,
    });
  } catch (error: any) {
    return handleApiError(error, 'exams/[examId]/publish');
  }
}
