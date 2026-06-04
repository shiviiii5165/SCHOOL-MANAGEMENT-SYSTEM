export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET — fetch unread notifications for current user + global unread count
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    });
    
    // Explicit global unread count directly from DB
    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false }
    });
    
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH — mark read (all or specific ids)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const ids = body.ids;
    const link = body.link;

    if (Array.isArray(ids) && ids.length > 0) {
      // Mark specific IDs as read
      await prisma.notification.updateMany({
        where: { userId: session.user.id, id: { in: ids }, isRead: false },
        data:  { isRead: true },
      });
    } else if (link) {
      // Mark all notifications with specific link as read
      await prisma.notification.updateMany({
        where: { userId: session.user.id, link: link, isRead: false },
        data:  { isRead: true },
      });
    } else {
      // Fallback: Mark all as read
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data:  { isRead: true },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
