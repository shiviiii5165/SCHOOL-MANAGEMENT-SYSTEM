import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = params.id;

    // Verify teacher owns this assignment
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 403 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Not authorized to delete this assignment" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.submission.deleteMany({
        where: { assignmentId },
      }),
      prisma.assignment.delete({
        where: { id: assignmentId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assignment delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = params.id;
    const body = await req.json();
    const { title, subjectId, classId, description, dueDate, maxMarks, fileUrl } = body;

    // Verify teacher owns this assignment
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 403 });
    }

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existingAssignment || existingAssignment.teacherId !== teacher.id) {
      return NextResponse.json({ error: "Not authorized to edit this assignment" }, { status: 403 });
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title,
        description,
        subjectId,
        classId,
        dueDate: new Date(dueDate),
        maxMarks: Number(maxMarks),
        ...(fileUrl !== undefined && { fileUrl }), // only update if provided (could be null)
      },
    });

    return NextResponse.json({ success: true, assignment: updatedAssignment });
  } catch (error) {
    console.error("Assignment update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
