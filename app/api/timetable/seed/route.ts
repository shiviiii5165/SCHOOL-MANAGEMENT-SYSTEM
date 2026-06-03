import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: { timetablePeriods: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    if (teacher.timetablePeriods.length > 0) {
      return NextResponse.json({ message: "Timetable already seeded", seeded: false });
    }

    // Define dummy classes
    const classNames = [
      { name: "Class 8", section: "A" },
      { name: "Class 9", section: "B" },
      { name: "Class 10", section: "A" },
      { name: "Class 11", section: "Science" },
    ];

    const createdClasses = [];
    for (const c of classNames) {
      let cls = await prisma.class.findFirst({
        where: { name: c.name, section: c.section }
      });
      if (!cls) {
        cls = await prisma.class.create({
          data: {
            name: c.name,
            section: c.section,
            teacherId: teacher.id, // Just setting him as class teacher for simplicity
          }
        });
      }
      createdClasses.push(cls);
    }

    // Define dummy subjects
    const subjectsToCreate = [
      { name: "Mathematics", code: "MATH101", classId: createdClasses[0].id },
      { name: "Physics", code: "PHY101", classId: createdClasses[1].id },
      { name: "Mathematics", code: "MATH102", classId: createdClasses[2].id },
      { name: "Physics", code: "PHY102", classId: createdClasses[3].id },
    ];

    const createdSubjects = [];
    for (const s of subjectsToCreate) {
      let sub = await prisma.subject.findFirst({
        where: { name: s.name, classId: s.classId }
      });
      if (!sub) {
        sub = await prisma.subject.create({
          data: {
            name: s.name,
            code: s.code,
            classId: s.classId,
            teacherId: teacher.id,
          }
        });
      }
      createdSubjects.push(sub);
    }

    // Periods definitions
    const periodTimings = [
      { num: 1, start: "08:00", end: "08:45" },
      { num: 2, start: "08:45", end: "09:30" },
      // 09:30-09:45 is Break
      { num: 3, start: "09:45", end: "10:30" },
      { num: 4, start: "10:30", end: "11:15" },
      // 11:15-11:45 is Lunch
      { num: 5, start: "11:45", end: "12:30" },
      { num: 6, start: "12:30", end: "13:15" },
      { num: 7, start: "13:15", end: "14:00" },
    ];

    // Seed realistic periods (Mon=1 to Sat=6)
    const periodsToCreate = [];
    
    for (let day = 1; day <= 6; day++) {
      // 3 to 5 classes a day randomly
      const classesToday = [1, 2, 3, 4, 5, 6, 7].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 3);
      
      for (const pNum of classesToday) {
        const time = periodTimings.find(pt => pt.num === pNum)!;
        const randomClassIdx = Math.floor(Math.random() * createdClasses.length);
        const selectedClass = createdClasses[randomClassIdx];
        const selectedSubject = createdSubjects[randomClassIdx];
        
        periodsToCreate.push({
          teacherId: teacher.id,
          classId: selectedClass.id,
          subjectId: selectedSubject.id,
          dayOfWeek: day,
          periodNumber: pNum,
          startTime: time.start,
          endTime: time.end,
          roomNumber: `Room ${100 + randomClassIdx + (day * 10)}`,
        });
      }
    }

    await prisma.timetablePeriod.createMany({
      data: periodsToCreate
    });

    return NextResponse.json({ success: true, seeded: true, count: periodsToCreate.length });

  } catch (error) {
    console.error("Error seeding timetable:", error);
    return NextResponse.json({ error: "Failed to seed timetable" }, { status: 500 });
  }
}
