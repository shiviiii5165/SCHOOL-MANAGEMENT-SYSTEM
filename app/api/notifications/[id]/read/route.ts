export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH — mark single as read
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optionally check if the notification belongs to the user
    const notification = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notification || notification.userId !== session.user.id) {
        return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    await prisma.notification.update({
      where: { id: params.id },
      data:  { isRead: true },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
