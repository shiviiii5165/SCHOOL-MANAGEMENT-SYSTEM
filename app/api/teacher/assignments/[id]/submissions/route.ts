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
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const formattedSubmissions = submissions.map((s) => ({
      id: s.id,
      studentName: s.student.user.name,
      fileUrl: s.fileUrl,
      feedback: s.feedback,
      marks: s.marks,
      submittedAt: s.submittedAt,
    }));

    return NextResponse.json({ success: true, submissions: formattedSubmissions });
  } catch (error) {
    console.error("Fetch submissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
