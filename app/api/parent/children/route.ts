import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          include: {
            user: {
              select: {
                name: true,
                regId: true,
                avatar: true,
              }
            },
            class: {
              select: {
                name: true,
                section: true,
              }
            }
          }
        }
      }
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    return NextResponse.json({ children: parent.students });
  } catch (error) {
    console.error("Error fetching parent's children:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
