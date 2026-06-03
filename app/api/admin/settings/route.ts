import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  schoolName: z.string().min(3, "School Name must be at least 3 characters"),
  schoolEmail: z.string().email("Invalid email address"),
  schoolPhone: z.string().optional().nullable(),
  schoolAddress: z.string().optional().nullable(),
  minimumAttendance: z.coerce.number().min(0).max(100),
  detentionThreshold: z.coerce.number().min(0).max(100),
  gradingSystem: z.enum(["PERCENTAGE", "GPA", "LETTER"]),
  enableEmailAlerts: z.boolean(),
  enableSMSAlerts: z.boolean(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" }
    });

    if (!settings) {
      // Auto-create default settings if they don't exist
      settings = await prisma.systemSettings.create({
        data: {
          id: "singleton",
          schoolName: "EduCore School",
          schoolEmail: "contact@educore.com",
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const settingsData = parsed.data;

    const updatedSettings = await prisma.systemSettings.upsert({
      where: {
        id: "singleton"
      },
      update: {
        ...settingsData
      },
      create: {
        id: "singleton",
        ...settingsData
      }
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
