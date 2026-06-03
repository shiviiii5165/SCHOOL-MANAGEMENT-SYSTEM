export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";

// POST /api/exams/[examId]/open-marks — admin opens marks entry
export async function POST(req: NextRequest, { params }: { params: { examId: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: params.examId },
      include: {
        slots: {
          include: {
            subject: { include: { teacher: { include: { user: true } } } },
            class: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Update status to MARKS_ENTRY
    await prisma.exam.update({
      where: { id: params.examId },
      data: { status: "MARKS_ENTRY" },
    });

    // Notify each teacher about their slots
    const teacherSlots = new Map<string, { userId: string; teacherName: string; subjects: string[] }>();
    for (const slot of exam.slots) {
      const teacherId = slot.subject.teacher.userId;
      if (!teacherSlots.has(teacherId)) {
        teacherSlots.set(teacherId, {
          userId: teacherId,
          teacherName: slot.subject.teacher.user.name,
          subjects: [],
        });
      }
      teacherSlots.get(teacherId)!.subjects.push(`${slot.subject.name} — ${slot.class.name} ${slot.class.section}`);
    }

    const notifications = Array.from(teacherSlots.values()).map(t => ({
      userId: t.userId,
      title: `📝 Marks Entry Open — ${exam.name}`,
      message: `Marks entry is now open for: ${t.subjects.join(", ")}. Please enter marks as soon as possible.`,
      type: "ACADEMIC" as "ACADEMIC",
      link: "/teacher/exams",
    }));

    await createNotifications(notifications);

    return NextResponse.json({ success: true, notified: notifications.length });
  } catch (error: any) {
    console.error("Error opening marks:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
