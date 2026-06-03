export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/parent/exams — children's exams and eligibility
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id! },
      include: {
        students: {
          include: {
            user: true,
            class: true,
            hallTickets: true,
          }
        }
      },
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
    }

    const settings = await prisma.systemSettings.findFirst();
    const threshold = settings?.detentionThreshold ?? 75;

    // Get exams for all children
    const classIds = parent.students.map(s => s.classId);
    
    const exams = await prisma.exam.findMany({
      where: {
        status: { in: ["SCHEDULED", "ONGOING"] },
        slots: { some: { classId: { in: classIds } } },
      },
      include: {
        slots: {
          where: { classId: { in: classIds } },
          include: { subject: true },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { startDate: "asc" },
    });

    // Format exams per child
    const childrenData = parent.students.map(student => {
      const studentExams = exams
        .filter(e => e.slots.some(s => s.classId === student.classId))
        .map(exam => {
          const hallTicket = student.hallTickets.find(ht => ht.examId === exam.id);
          const attendanceLow = student.attendancePercentage < threshold;
          const isBlocked = hallTicket ? hallTicket.isBlocked : (student.isSuspended || !student.examEligible || attendanceLow);
          
          let blockReason = hallTicket?.blockReason;
          if (!blockReason && isBlocked) {
            if (student.isSuspended) blockReason = `Account suspended until ${new Date(student.suspendedUntil || new Date()).toLocaleDateString()}`;
            else if (!student.examEligible) blockReason = "Detained due to low attendance";
            else if (attendanceLow) blockReason = `Attendance ${student.attendancePercentage.toFixed(1)}% below required ${threshold}%`;
            else blockReason = "Blocked by administration";
          }

          return {
            id: exam.id,
            name: exam.name,
            type: exam.type,
            status: exam.status,
            startDate: exam.startDate,
            endDate: exam.endDate,
            isBlocked,
            blockReason,
            slots: exam.slots.filter(s => s.classId === student.classId).map(slot => ({
              id: slot.id,
              subjectName: slot.subject.name,
              date: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              room: slot.room,
              maxMarks: slot.maxMarks,
            })),
          };
        });

      return {
        id: student.id,
        name: student.user.name,
        className: `${student.class.name} - ${student.class.section}`,
        attendancePercentage: student.attendancePercentage,
        isSuspended: student.isSuspended,
        exams: studentExams,
      };
    });

    return NextResponse.json({ children: childrenData });
  } catch (error: any) {
    console.error("Error fetching parent exams:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
