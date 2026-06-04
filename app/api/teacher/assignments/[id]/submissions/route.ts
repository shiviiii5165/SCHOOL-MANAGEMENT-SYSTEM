import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = params.id;

    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      orderBy: { submittedAt: 'desc' },
    });

    const studentIds = submissions.map(s => s.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { user: { select: { name: true, email: true } } }
    });

    const studentMap = new Map();
    students.forEach(s => studentMap.set(s.id, s));

    const formattedSubmissions = submissions.map((s) => {
      const student = studentMap.get(s.studentId);
      return {
        id: s.id,
        studentName: student?.user?.name || "Unknown Student",
        fileUrl: s.fileUrl,
        feedback: s.feedback,
        marks: s.marks,
        submittedAt: s.submittedAt,
      };
    });

    return NextResponse.json({ success: true, submissions: formattedSubmissions });
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subId, marks, feedback } = await req.json();

    const updated = await prisma.submission.update({
      where: { id: subId },
      data: {
        marks: Number(marks),
        feedback,
        gradedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (error) {
    console.error("Grade submission error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
