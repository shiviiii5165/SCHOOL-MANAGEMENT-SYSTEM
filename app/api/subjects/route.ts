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

    const subjects = await prisma.subject.findMany({
      include: { class: true },
      orderBy: [
        { class: { name: "asc" } },
        { name: "asc" }
      ],
    });

    return NextResponse.json({ subjects });
  } catch (error: any) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
