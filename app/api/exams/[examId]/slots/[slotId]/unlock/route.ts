export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";

// POST /api/exams/[examId]/slots/[slotId]/unlock — admin unlocks a slot
export async function POST(req: NextRequest, { params }: { params: { examId: string; slotId: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized — Admin only" }, { status: 401 });
    }

    const slot = await prisma.examSlot.findUnique({
      where: { id: params.slotId },
      include: {
        exam: true,
        class: true,
        subject: { include: { teacher: { include: { user: true } } } },
      },
    });

    if (!slot || slot.examId !== params.examId) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    await prisma.examSlot.update({
      where: { id: params.slotId },
      data: { isLocked: false },
    });

    // Notify the teacher
    await createNotifications([{
      userId: slot.subject.teacher.userId,
      title: `🔓 Marks Entry Re-opened`,
      message: `Marks entry for ${slot.subject.name} — ${slot.class.name} ${slot.class.section} (${slot.exam.name}) has been re-opened by the admin. You can now edit your submission.`,
      type: "ACADEMIC" as "ACADEMIC",
      link: `/teacher/exams/${slot.examId}/marks/${slot.id}`,
    }]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error unlocking slot:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
