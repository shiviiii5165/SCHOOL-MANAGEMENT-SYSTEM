import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== "ADMIN" && userRole !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const notice = await prisma.notice.findUnique({
      where: { id: params.id }
    });

    if (!notice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    if (userRole === "TEACHER" && notice.createdById !== userId) {
      return NextResponse.json({ error: "Forbidden: You can only pin your own notices" }, { status: 403 });
    }

    const updatedNotice = await prisma.notice.update({
      where: { id: params.id },
      data: { isPinned: !notice.isPinned }
    });

    return NextResponse.json(updatedNotice);
  } catch (error: any) {
    console.error("Pin notice error:", error);
    return NextResponse.json({ error: "Failed to pin notice" }, { status: 500 });
  }
}
