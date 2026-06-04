import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    // Find the teacher ID from the session user ID
    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || "",
        subjectId,
        classId,
        teacherId: teacher.id,
        dueDate: new Date(dueDate),
        maxMarks: Number(maxMarks),
        fileUrl: fileUrl || null,
      }
    });

    // Notify students and parents
    const students = await prisma.student.findMany({
      where: { classId },
      include: { parent: true }
    });

    const notifications = [];
    for (const student of students) {
      notifications.push({
        userId: student.userId,
        title: "New Assignment",
        message: `A new assignment "${title}" has been posted.`,
        type: "ACADEMIC" as any,
        link: "/student/assignments",
      });

      if (student.parent) {
        notifications.push({
          userId: student.parent.userId,
          title: "New Assignment",
          message: `A new assignment "${title}" has been posted for your child.`,
          type: "ACADEMIC" as any,
          link: "/parent/assignments",
        });
      }
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }

    return NextResponse.json({ success: true, assignment });

  } catch (error) {
    console.error("Assignment creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
