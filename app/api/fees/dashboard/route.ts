export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { FeeService } from "@/services/FeeService";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const userId = session.user.id;

    const data = await FeeService.getDashboardData(userId, role);

    return NextResponse.json({
      success: true,
      ...data
    });

  } catch (error: any) {
    console.error("Error fetching fee dashboard data:", error);
    if (error.message.includes("Unauthorized") || error.message.includes("not found") || error.message.includes("Invalid role")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
