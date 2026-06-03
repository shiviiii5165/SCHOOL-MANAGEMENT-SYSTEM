export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) return NextResponse.json({ classes: [] });

      const classes = await prisma.class.findMany({
        where: { teacherId: teacher.id },
        select: { id: true, name: true, section: true },
        orderBy: [{ name: "asc" }, { section: "asc" }],
      });
      return NextResponse.json({ classes });
    }

    // Admin can see all classes
    if (role === "ADMIN") {
      const classes = await prisma.class.findMany({
        select: { id: true, name: true, section: true },
        orderBy: [{ name: "asc" }, { section: "asc" }],
      });
      return NextResponse.json({ classes });
    }

    return NextResponse.json({ classes: [] });
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
