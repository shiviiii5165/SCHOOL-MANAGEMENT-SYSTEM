export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Run daily at midnight to auto-update exam statuses
// GET /api/cron/update-exam-status
export async function GET(req: NextRequest) {
  try {
    // Basic auth check if CRON_SECRET is set
    const authHeader = req.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // 1. SCHEDULED → ONGOING
    // When exam.startDate <= today
    const ongoingRes = await prisma.exam.updateMany({
      where: {
        status: "SCHEDULED",
        startDate: { lte: today },
      },
      data: {
        status: "ONGOING",
      },
    });

    // 2. ONGOING → MARKS_ENTRY
    // When exam.endDate < today (i.e. yesterday was the last day)
    const marksEntryRes = await prisma.exam.updateMany({
      where: {
        status: "ONGOING",
        endDate: { lt: today },
      },
      data: {
        status: "MARKS_ENTRY",
      },
    });

    // NOTE: MARKS_ENTRY → COMPLETED is handled manually by Admin via publish-results API

    return NextResponse.json({
      success: true,
      transitions: {
        toOngoing: ongoingRes.count,
        toMarksEntry: marksEntryRes.count,
      },
      runAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron Error (update-exam-status):", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
