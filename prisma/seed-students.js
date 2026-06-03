const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// 30 realistic Indian student names
const studentNames = [
  "Rahul Sharma", "Aman Verma", "Priya Singh", "Kunal Mehta", "Aditya Kumar",
  "Ananya Gupta", "Rohan Patel", "Neha Yadav", "Siddharth Das", "Ishita Roy",
  "Vikram Joshi", "Kavya Nair", "Arjun Reddy", "Sneha Iyer", "Dhruv Chauhan",
  "Pooja Mishra", "Manish Tiwari", "Ritu Agarwal", "Karan Bhatt", "Divya Saxena",
  "Raj Malhotra", "Simran Kaur", "Varun Thakur", "Anjali Dubey", "Nikhil Pandey",
  "Megha Srivastava", "Abhinav Jain", "Tanvi Bhatia", "Harsh Rawat", "Nisha Kapoor"
];

async function main() {
  console.log("🚀 Starting 30-student seed with attendance...\n");

  const studentPassword = await bcrypt.hash("Student@123", 10);

  // 1. Find or create the teacher
  let teacherUser = await prisma.user.findUnique({ where: { email: "teacher@school.com" } });
  if (!teacherUser) {
    const teacherPassword = await bcrypt.hash("Teacher@123", 10);
    teacherUser = await prisma.user.create({
      data: {
        email: "teacher@school.com",
        name: "Rajesh Singh",
        password: teacherPassword,
        role: "TEACHER",
        regId: "TCH-001",
        phone: "+919876543211",
      },
    });
  }

  let teacher = await prisma.teacher.findUnique({ where: { userId: teacherUser.id } });
  if (!teacher) {
    teacher = await prisma.teacher.create({
      data: { userId: teacherUser.id, joinDate: new Date() },
    });
  }

  // 2. Find or create the class
  let classRecord = await prisma.class.findFirst({
    where: { name: "Class 10", section: "A", teacherId: teacher.id },
  });
  if (!classRecord) {
    classRecord = await prisma.class.create({
      data: { name: "Class 10", section: "A", teacherId: teacher.id },
    });
  }

  console.log(`📚 Using class: ${classRecord.name} - ${classRecord.section} (ID: ${classRecord.id})`);
  console.log(`👨‍🏫 Teacher: ${teacherUser.name} (ID: ${teacher.id})\n`);

  // 3. Create 30 students
  const createdStudents = [];

  for (let i = 0; i < 30; i++) {
    const rollNo = String(i + 1).padStart(2, "0");
    const regId = `STU-24${String(i + 1).padStart(3, "0")}`;
    const email = `student${i + 1}@school.com`;
    const name = studentNames[i];

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Check if student record exists
      let student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (student) {
        createdStudents.push(student);
        console.log(`  ✔ Exists: ${name} (${regId}) Roll: ${rollNo}`);
        continue;
      }
    }

    // Create user
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: studentPassword,
          role: "STUDENT",
          regId,
          phone: `+91987654${String(3200 + i).padStart(4, "0")}`,
        },
      });
    }

    // Create student record (2 students will be suspended)
    const isSuspended = i === 28 || i === 29; // Last 2 students suspended
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        classId: classRecord.id,
        rollNo,
        dateOfBirth: new Date(`${2009 + Math.floor(Math.random() * 3)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`),
        address: `${Math.floor(Math.random() * 500) + 1} Street, New Delhi`,
        fatherName: `Mr. ${name.split(" ")[1] || "Kumar"}`,
        motherName: `Mrs. ${name.split(" ")[1] || "Kumar"}`,
        fatherPhone: `+91900000${String(1000 + i).padStart(4, "0")}`,
        motherPhone: `+91900000${String(2000 + i).padStart(4, "0")}`,
        admissionDate: new Date("2024-04-01"),
        isSuspended,
        suspendedReason: isSuspended ? "Disciplinary action" : null,
        suspendedAt: isSuspended ? new Date() : null,
      },
    });

    createdStudents.push(student);
    console.log(`  ✅ Created: ${name} (${regId}) Roll: ${rollNo}${isSuspended ? " [SUSPENDED]" : ""}`);
  }

  console.log(`\n📋 Total students created/found: ${createdStudents.length}`);

  // 4. Create attendance records for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Delete any existing attendance for today for these students
  await prisma.attendance.deleteMany({
    where: {
      classId: classRecord.id,
      date: today,
    },
  });

  console.log("\n📝 Creating attendance records for today...");

  let presentCount = 0;
  let absentCount = 0;
  let blockedCount = 0;

  for (let i = 0; i < createdStudents.length; i++) {
    const student = createdStudents[i];
    const isSuspended = i === 28 || i === 29;

    let status;
    if (isSuspended) {
      status = "BLOCKED";
      blockedCount++;
    } else {
      // ~80% present, ~20% absent — students at index 2, 9, 14, 21, 25 are absent
      const absentIndices = [2, 9, 14, 21, 25];
      if (absentIndices.includes(i)) {
        status = "ABSENT";
        absentCount++;
      } else {
        status = "PRESENT";
        presentCount++;
      }
    }

    await prisma.attendance.create({
      data: {
        studentId: student.id,
        classId: classRecord.id,
        date: today,
        status,
        markedBy: teacher.id,
      },
    });
  }

  console.log(`\n✅ Attendance seeded for today (${today.toDateString()}):`);
  console.log(`   Present:  ${presentCount}`);
  console.log(`   Absent:   ${absentCount}`);
  console.log(`   Blocked:  ${blockedCount}`);
  console.log(`   Total:    ${createdStudents.length}`);

  // 5. Also create some past attendance for the last 5 days
  console.log("\n📅 Creating past attendance for the last 5 days...");

  for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - dayOffset);
    pastDate.setHours(0, 0, 0, 0);

    // Delete existing if any
    await prisma.attendance.deleteMany({
      where: {
        classId: classRecord.id,
        date: pastDate,
      },
    });

    for (const student of createdStudents) {
      const isSuspended = createdStudents.indexOf(student) >= 28;
      let status;
      if (isSuspended) {
        status = "BLOCKED";
      } else {
        // Randomize — ~85% present, ~15% absent
        const rand = Math.random();
        status = rand < 0.85 ? "PRESENT" : "ABSENT";
      }

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: classRecord.id,
          date: pastDate,
          status,
          markedBy: teacher.id,
        },
      });
    }

    console.log(`   ✔ ${pastDate.toDateString()} — done`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 SEED COMPLETE!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔑 Login as teacher:");
  console.log("   Email:    teacher@school.com");
  console.log("   Password: Teacher@123");
  console.log(`\n📖 Class: ${classRecord.name} - ${classRecord.section}`);
  console.log(`📊 30 students with 6 days of attendance data\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
