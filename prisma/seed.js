const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
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
      phone: "+919876543210"
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
      phone: "+919876543211"
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      joinDate: new Date(),
    }
  });

  // Class
  await prisma.class.deleteMany({});
  const classRecord = await prisma.class.create({
    data: {
      name: "Class 10",
      section: "A",
      teacherId: teacher.id,
    }
  });

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
      phone: "+919876543212"
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
    }
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
      phone: "+919876543213"
    },
  });

  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
    }
  });

  // Connect Parent to Student
  await prisma.student.update({
    where: { id: student.id },
    data: { parentId: parent.id }
  });

  console.log("✅ Seed complete! Users and relational records created:");
  console.log("   admin@school.com    / Admin@123  (ADMIN)");
  console.log("   teacher@school.com  / Teacher@123  (TEACHER)");
  console.log("   student@school.com  / Student@123  (STUDENT)");
  console.log("   parent@school.com   / Parent@123  (PARENT)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
