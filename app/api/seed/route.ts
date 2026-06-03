import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Seed] Starting database seed...");

    const adminPassword = await bcrypt.hash("Admin@123", 10);
    const teacherPassword = await bcrypt.hash("Teacher@123", 10);
    const studentPassword = await bcrypt.hash("Student@123", 10);
    const parentPassword = await bcrypt.hash("Parent@123", 10);

    // Admin
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@school.com" },
      update: { password: adminPassword },
      create: {
        email: "admin@school.com",
        name: "Dr. Rajesh Gupta",
        password: adminPassword,
        role: "ADMIN",
        regId: "ADM-001",
        phone: "+919876543210",
      },
    });

    // Teacher
    const teacherUser = await prisma.user.upsert({
      where: { email: "teacher@school.com" },
      update: { password: teacherPassword },
      create: {
        email: "teacher@school.com",
        name: "Rajesh Singh",
        password: teacherPassword,
        role: "TEACHER",
        regId: "TCH-001",
        phone: "+919876543211",
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        joinDate: new Date(),
      },
    });

    // Class - find existing or create
    let classRecord = await prisma.class.findFirst({
      where: { name: "Class 10", section: "A", teacherId: teacher.id },
    });

    if (!classRecord) {
      classRecord = await prisma.class.create({
        data: {
          name: "Class 10",
          section: "A",
          teacherId: teacher.id,
        },
      });
    }

    // Student
    const studentUser = await prisma.user.upsert({
      where: { email: "student@school.com" },
      update: { password: studentPassword },
      create: {
        email: "student@school.com",
        name: "Rahul Kumar",
        password: studentPassword,
        role: "STUDENT",
        regId: "STU-2024-0042",
        phone: "+919876543212",
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: studentUser.id },
      update: { classId: classRecord.id },
      create: {
        userId: studentUser.id,
        classId: classRecord.id,
        rollNo: "42",
        dateOfBirth: new Date("2010-05-15"),
        address: "123 School Lane",
        fatherName: "Rajesh Kumar",
        motherName: "Sunita Kumar",
        fatherPhone: "+919876543210",
        motherPhone: "+919876543211",
        admissionDate: new Date("2024-04-01"),
      },
    });

    // Parent
    const parentUser = await prisma.user.upsert({
      where: { email: "parent@school.com" },
      update: { password: parentPassword },
      create: {
        email: "parent@school.com",
        name: "Mr. Kumar",
        password: parentPassword,
        role: "PARENT",
        regId: "PAR-2024-0042",
        phone: "+919876543213",
      },
    });

    const parent = await prisma.parent.upsert({
      where: { userId: parentUser.id },
      update: {},
      create: {
        userId: parentUser.id,
      },
    });

    // Connect Parent to Student
    await prisma.student.update({
      where: { id: student.id },
      data: { parentId: parent.id },
    });

    // System Settings
    await prisma.systemSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: {
        id: "singleton",
        schoolName: "EduCore Academy",
        schoolEmail: "info@educore.school",
        schoolPhone: "+919876543210",
        schoolAddress: "123 Education Lane, New Delhi",
        minimumAttendance: 75,
        detentionThreshold: 75,
      },
    });

    console.log("[Seed] Database seed complete!");

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      users: {
        admin: "admin@school.com / Admin@123",
        teacher: "teacher@school.com / Teacher@123",
        student: "student@school.com / Student@123",
        parent: "parent@school.com / Parent@123",
      },
    });
  } catch (error: any) {
    console.error("[Seed] Error:", error);
    return NextResponse.json(
      { error: "Seed failed", details: error.message },
      { status: 500 }
    );
  }
}
