import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { assignmentId, fileUrl, feedback } = body;

    if (!assignmentId || !fileUrl) {
      return NextResponse.json({ error: "Missing assignmentId or fileUrl" }, { status: 400 });
    }

    // Find the student ID from the session user ID
    const student = await prisma.student.findUnique({
      where: { userId: session.user.id }
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 403 });
    }

    // Use upsert with the unique constraint on (assignmentId, studentId)
    const submission = await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
      update: { fileUrl, feedback: feedback || null, submittedAt: new Date() },
      create: { assignmentId, studentId: student.id, fileUrl, feedback: feedback || null, submittedAt: new Date() },
    });

    return NextResponse.json({ success: true, submission });

  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
