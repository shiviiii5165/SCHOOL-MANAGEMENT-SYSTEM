import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.disciplineReport.findMany();

    const violationCategories: Record<string, number> = {};
    const suspensionTrends: Record<string, number> = {};
    
    // Monthly trend data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    monthNames.forEach(m => suspensionTrends[m] = 0);

    reports.forEach(report => {
      // Violation Categories
      violationCategories[report.category] = (violationCategories[report.category] || 0) + 1;

      // Suspensions
      if (report.actionTaken?.toLowerCase().includes("suspend") || report.actionTaken?.toLowerCase().includes("suspension")) {
        const month = monthNames[new Date(report.createdAt).getMonth()];
        suspensionTrends[month] += 1;
      }
    });

    const violationCategoryChart = Object.keys(violationCategories).map(category => ({
      name: category,
      value: violationCategories[category]
    }));

    const suspensionTrendChart = Object.keys(suspensionTrends).map(month => ({
      name: month,
      count: suspensionTrends[month]
    }));

    return NextResponse.json({
      violationCategoryChart,
      suspensionTrendChart
    });

  } catch (error) {
    console.error("Error fetching discipline analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
