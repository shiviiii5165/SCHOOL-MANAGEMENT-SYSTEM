export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = params;
    const url = new URL(req.url);
    const month = url.searchParams.get("month"); // e.g. "2026-05"

    let dateFilter: any = {};
    if (month) {
      const [year, m] = month.split("-").map(Number);
      const startDate = new Date(year, m - 1, 1);
      const endDate = new Date(year, m, 0);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const records = await prisma.attendance.findMany({
      where: {
        studentId,
        ...dateFilter,
      },
      orderBy: { date: "desc" },
      take: month ? undefined : 15,
      select: {
        id: true,
        date: true,
        status: true,
      },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Error fetching student history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
