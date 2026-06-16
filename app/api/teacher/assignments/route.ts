import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AssignmentService } from "@/services/AssignmentService";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, subjectId, classId, description, dueDate, maxMarks, fileUrl } = body;

    if (!title || !subjectId || !classId || !dueDate || maxMarks === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const assignment = await AssignmentService.createAssignment(session.user.id, {
      title,
      subjectId,
      classId,
      description,
      dueDate,
      maxMarks,
      fileUrl
    });

    return NextResponse.json({ success: true, assignment });

  } catch (error: any) {
    console.error("Assignment creation error:", error);
    if (error.message.includes("Unauthorized") || error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
