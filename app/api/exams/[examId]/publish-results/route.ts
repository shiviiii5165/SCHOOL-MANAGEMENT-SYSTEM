export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";

// POST /api/exams/[examId]/publish-results — set isPublished=true + notify all
export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: {
        summaries: { include: { student: { include: { user: true, parent: { include: { user: true } } } } } },
        slots: { include: { subject: { include: { teacher: { include: { user: true } } } } } },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Set all summaries as published
    await prisma.examSummary.updateMany({
      where: { examId: params.examId },
      data: { isPublished: true },
    });

    // Update exam status to COMPLETED
    await prisma.exam.update({
      where: { id: params.examId },
      data: { status: "COMPLETED" },
    });

    // Collect all notifications
    const notifications: any[] = [];

    // Notify students and parents
    for (const summary of exam.summaries) {
      notifications.push({
        userId: summary.student.userId,
        title: `🎉 ${exam.name} Results Published`,
        message: `Your results are live! Grade: ${summary.grade} | Percentage: ${summary.percentage}% | Rank: ${summary.rank}`,
        type: "ACADEMIC" as "ACADEMIC",
        link: "/student/results",
      });

      if (summary.student.parent?.userId) {
        notifications.push({
          userId: summary.student.parent.userId,
          title: `📊 ${summary.student.user.name}'s Results — ${exam.name}`,
          message: `${summary.student.user.name}'s results: Grade ${summary.grade} | ${summary.percentage}% | Rank ${summary.rank}`,
          type: "ACADEMIC" as "ACADEMIC",
          link: "/parent/exams",
        });
      }
    }

    // Notify teachers
    const teacherIds = new Set<string>();
    for (const slot of exam.slots) {
      const tid = slot.subject.teacher.userId;
      if (!teacherIds.has(tid)) {
        teacherIds.add(tid);
        notifications.push({
          userId: tid,
          title: `📊 Results Published — ${exam.name}`,
          message: `Results for ${exam.name} have been published by the administration.`,
          type: "ACADEMIC" as "ACADEMIC",
          link: "/teacher/exams",
        });
      }
    }

    await createNotifications(notifications);

    return NextResponse.json({ success: true, notified: notifications.length });
  } catch (error: any) {
    console.error("Error publishing results:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
