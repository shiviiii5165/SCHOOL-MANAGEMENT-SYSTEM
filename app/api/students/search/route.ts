export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ students: [] });
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { user: { name: { contains: query, mode: "insensitive" } } },
          { rollNo: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        user: { select: { name: true, avatar: true } },
        class: { select: { name: true, section: true } },
      },
      take: 10,
    });

    const formatted = students.map((s) => ({
      id: s.id,
      name: s.user.name,
      rollNo: s.rollNo,
      className: `${s.class.name} - ${s.class.section}`,
      avatar: s.user.avatar || "",
    }));

    return NextResponse.json({ students: formatted });
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
