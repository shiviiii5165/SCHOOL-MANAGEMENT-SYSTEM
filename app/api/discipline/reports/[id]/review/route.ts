export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const { id } = params;
    const { action, adminNote } = await req.json(); // action: "DISMISSED" | "RESOLVED_WARNING"

    if (!["DISMISSED", "RESOLVED_WARNING", "REVIEWED"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const report = await prisma.disciplineReport.update({
      where: { id },
      data: {
        status: action === "REVIEWED" ? "REVIEWED" : action,
        adminNote,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        actionTaken: action,
      },
      include: {
        teacher: { select: { userId: true } },
      },
    });

    // Notify teacher
    await prisma.notification.create({
      data: {
        userId: report.teacher.userId,
        title: "Discipline Report Reviewed",
        message: `Your report has been marked as ${action}.`,
        type: "DISCIPLINE",
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error reviewing report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
