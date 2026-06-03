export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import { z } from "zod";

const ReportSchema = z.object({
  studentId: z.string().min(1),
  category: z.enum(["ACADEMIC", "BEHAVIORAL", "ATTENDANCE", "OTHER"]),
  description: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized - Teacher only" }, { status: 401 });
    }

    const parsed = ReportSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }
    const { studentId, category, description } = parsed.data;

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher record not found" }, { status: 404 });
    }

    const report = await prisma.disciplineReport.create({
      data: {
        student: { connect: { id: studentId } },
        teacher: { connect: { id: teacher.id } },
        category,
        description,
        status: "PENDING",
      },
    });

    // Notify admins
    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      const notifications = admins.map((admin) => ({
        userId: admin.id,
        title: "New Discipline Report",
        message: `A new discipline report has been submitted for category: ${category}.`,
        type: "DISCIPLINE" as "DISCIPLINE",
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
      }
    } catch (notifError) {
      console.error("Error sending notifications:", notifError);
    }

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (status) whereClause.status = status;

    if (session.user?.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
      if (!teacher) return NextResponse.json({ reports: [] });
      whereClause.reportedBy = teacher.id;
    }

    const reports = await prisma.disciplineReport.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { name: true, section: true } },
          },
        },
        teacher: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = reports.map((r) => ({
      id: r.id,
      studentName: r.student.user.name,
      rollNo: r.student.rollNo,
      className: `${r.student.class.name} - ${r.student.class.section}`,
      reportedBy: r.teacher.user.name,
      category: r.category,
      date: r.createdAt.toISOString(),
      status: r.status,
      description: r.description,
      adminNote: r.adminNote,
      actionTaken: r.actionTaken,
    }));

    return NextResponse.json({ reports: formatted });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
