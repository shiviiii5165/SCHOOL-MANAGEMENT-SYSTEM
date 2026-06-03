export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classes = await prisma.class.findMany({
      include: {
        _count: { select: { students: true } },
      },
      orderBy: [
        { name: "asc" },
        { section: "asc" },
      ],
    });

    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
