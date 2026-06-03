export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { examId: string; slotId: string } }) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.examSlot.update({
      where: { id: params.slotId },
      data: { isLocked: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error locking slot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
