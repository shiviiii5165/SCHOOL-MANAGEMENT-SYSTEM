export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const CreateExamSchema = z.object({
  name:          z.string().min(3),
  type:          z.enum(["UNIT_TEST_1", "UNIT_TEST_2", "MID_TERM", "PRE_BOARD", "FINAL", "PRACTICAL"]),
  academicYear:  z.string().min(4),
  startDate:     z.string().datetime(),
  endDate:       z.string().datetime(),
  defaultPassPct: z.number().min(1).max(100).default(33),
  classIds:      z.array(z.string()).min(1),
});

// GET /api/exams — list all exams
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const exams = await prisma.exam.findMany({
      orderBy: { startDate: "desc" },
      include: {
        slots: {
          include: { class: true, subject: true },
        },
        _count: {
          select: { results: true, summaries: true, hallTickets: true },
        },
      },
    });

    return NextResponse.json({ exams });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/exams — create new exam
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = CreateExamSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }
    const body = parsed.data;

    const exam = await prisma.exam.create({
      data: {
        name:          body.name,
        type:          body.type,
        academicYear:  body.academicYear,
        startDate:     new Date(body.startDate),
        endDate:       new Date(body.endDate),
        defaultPassPct: body.defaultPassPct,
        createdBy:     session.user.id!,
      },
    });

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating exam:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
