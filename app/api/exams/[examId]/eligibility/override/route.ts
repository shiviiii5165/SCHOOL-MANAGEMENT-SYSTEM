export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";

// POST /api/exams/[examId]/eligibility/override — block/unblock a student
export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, isBlocked, blockReason } = await req.json();

    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({ where: { id: params.examId } });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, parent: { include: { user: true } } },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const hallTicket = await prisma.hallTicket.upsert({
      where: { examId_studentId: { examId: params.examId, studentId } },
      update: {
        isBlocked: !!isBlocked,
        blockReason: isBlocked ? (blockReason || "Blocked by administration") : null,
        blockedBy: isBlocked ? session.user.id : null,
      },
      create: {
        examId: params.examId,
        studentId,
        isBlocked: !!isBlocked,
        blockReason: isBlocked ? (blockReason || "Blocked by administration") : null,
        blockedBy: isBlocked ? session.user.id : null,
      },
    });

    // Send notifications
    const notifications: any[] = [];
    if (isBlocked) {
      notifications.push({
        userId: student.userId,
        title: `🚫 Admit Card Blocked — ${exam.name}`,
        message: `Your admit card has been blocked. Reason: ${blockReason || "Blocked by administration"}`,
        type: "ACADEMIC" as "ACADEMIC",
        link: "/student/exams",
      });
      if (student.parent?.userId) {
        notifications.push({
          userId: student.parent.userId,
          title: `🚫 ${student.user.name}'s Admit Card Blocked`,
          message: `${student.user.name}'s admit card for ${exam.name} has been blocked. Reason: ${blockReason || "Blocked by administration"}`,
          type: "ACADEMIC" as "ACADEMIC",
          link: "/parent/exams",
        });
      }
    } else {
      notifications.push({
        userId: student.userId,
        title: `✅ Admit Card Unblocked — ${exam.name}`,
        message: `Your admit card has been unblocked. You can now download it.`,
        type: "ACADEMIC" as "ACADEMIC",
        link: "/student/exams",
      });
    }
    await createNotifications(notifications);

    return NextResponse.json({ hallTicket });
  } catch (error: any) {
    console.error("Error overriding eligibility:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
