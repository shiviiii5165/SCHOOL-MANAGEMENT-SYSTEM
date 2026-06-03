const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const maleFirstNames = ["Aarav", "Vihaan", "Vivaan", "Advik", "Kabir", "Ansh", "Ishaan", "Shaurya", "Dhruv", "Siddharth", "Aryan", "Rohan", "Kunal", "Rahul", "Aman", "Aditya", "Vikram", "Arjun", "Manish", "Karan", "Raj", "Varun", "Nikhil", "Abhinav", "Harsh", "Pranav", "Yash", "Dev", "Om", "Rishi", "Samarth", "Yuvraj", "Ayush", "Kartik", "Nakul", "Prateek"];
const femaleFirstNames = ["Ananya", "Diya", "Aadya", "Pihu", "Avni", "Kavya", "Sneha", "Pooja", "Ritu", "Divya", "Simran", "Anjali", "Megha", "Tanvi", "Nisha", "Riya", "Khushi", "Shreya", "Neha", "Shruti", "Swati", "Nidhi", "Ishita", "Kritika", "Sanjana", "Rashi", "Aayushi", "Mehak", "Palak", "Saloni"];
const surnames = ["Sharma", "Singh", "Verma", "Rajput", "Tiwari", "Gupta", "Patel", "Yadav", "Das", "Roy", "Joshi", "Chauhan", "Mishra", "Agarwal", "Bhatt", "Saxena", "Malhotra", "Thakur", "Dubey", "Pandey", "Srivastava", "Jain", "Bhatia", "Rawat", "Kapoor"];
const bloodGroups = ["A+", "B+", "O+", "AB+", "A-", "B-", "O-"];
const occupations = ["Government Employee", "Business", "Farmer", "Teacher", "Doctor", "Engineer", "Shopkeeper"];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDateOfBirth(age) {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, month, day);
}

async function main() {
  console.log("Starting DB seed for Delhi Public School, Rajasthan...");

  console.log("Cleaning up existing database records...");
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.timetablePeriod.deleteMany();
  await prisma.dailyAttendanceLog.deleteMany();
  await prisma.disciplineReport.deleteMany();
  await prisma.result.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.attendanceSummary.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleanup complete.");

  const teacherPassword = await bcrypt.hash("Teacher@1234", 10);
  const studentPassword = await bcrypt.hash("Student@1234", 10);
  const parentPassword = await bcrypt.hash("Parent@1234", 10);

  // --- 1. TEACHERS ---
  const teachersData = [
    { firstName: "anjali", lastName: "sharma", name: "Anjali Sharma", regId: "TCH-001", phone: "9876543201", subjects: ["Mathematics", "Physics"] },
    { firstName: "vikram", lastName: "singh", name: "Vikram Singh", regId: "TCH-002", phone: "9876543202", subjects: ["Chemistry", "Biology"] },
    { firstName: "neha", lastName: "verma", name: "Neha Verma", regId: "TCH-003", phone: "9876543203", subjects: ["English"] },
    { firstName: "rajesh", lastName: "tiwari", name: "Rajesh Tiwari", regId: "TCH-004", phone: "9876543204", subjects: ["Hindi"] },
    { firstName: "pooja", lastName: "rajput", name: "Pooja Rajput", regId: "TCH-005", phone: "9876543205", subjects: ["Social Science"] }
  ];

  const createdTeachers = [];
  for (const t of teachersData) {
    const email = `${t.firstName}.${t.lastName}@dpsrajasthan.edu.in`;
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: teacherPassword },
      create: {
        email,
        name: t.name,
        password: teacherPassword,
        role: "TEACHER",
        regId: t.regId,
        phone: t.phone,
        isActive: true,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        joinDate: new Date("2020-04-01"),
      },
    });
    createdTeachers.push(teacher);
  }
  console.log("Teachers created successfully.");

  // --- 2. CLASSES ---
  const classesData = [
    { name: "Class 10", section: "A", teacherIndex: 0, prefix: "10A", age: 15 },
    { name: "Class 11", section: "Science", teacherIndex: 1, prefix: "11S", age: 16 },
    { name: "Class 8", section: "A", teacherIndex: 2, prefix: "8A", age: 13 },
    { name: "Class 9", section: "B", teacherIndex: 3, prefix: "9B", age: 14 }
  ];

  const createdClasses = [];
  for (const c of classesData) {
    const cls = await prisma.class.create({
      data: {
        name: c.name,
        section: c.section,
        teacherId: createdTeachers[c.teacherIndex].id,
      },
    });
    createdClasses.push({ ...cls, prefix: c.prefix, age: c.age });
  }
  console.log("Classes created successfully.");

  // --- 3. STUDENTS & PARENTS ---
  for (const cls of createdClasses) {
    console.log(`Generating 30 students for ${cls.name}-${cls.section}...`);
    const usedNames = new Set();

    for (let i = 1; i <= 30; i++) {
      let isMale = Math.random() > 0.5;
      let firstName = isMale ? getRandom(maleFirstNames) : getRandom(femaleFirstNames);
      let surname = getRandom(surnames);
      let fullName = `${firstName} ${surname}`;
      
      // Ensure no duplicate names in the same class
      while (usedNames.has(fullName)) {
        firstName = isMale ? getRandom(maleFirstNames) : getRandom(femaleFirstNames);
        surname = getRandom(surnames);
        fullName = `${firstName} ${surname}`;
      }
      usedNames.add(fullName);

      const rollNumber = `${cls.prefix}${String(i).padStart(3, "0")}`; // e.g. 10A001
      const studentEmail = `${rollNumber.toLowerCase()}@student.dpsrajasthan.edu.in`;
      const parentEmail = `parent.${rollNumber.toLowerCase()}@parent.dpsrajasthan.edu.in`;
      const dob = generateDateOfBirth(cls.age);
      const studentPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
      const parentPhone = `8${Math.floor(100000000 + Math.random() * 900000000)}`;
      const address = `${Math.floor(Math.random() * 100) + 1}, Civil Lines, Jaipur, Rajasthan`;

      const fatherName = `Mr. ${getRandom(maleFirstNames)} ${surname}`;
      const motherName = `Mrs. ${getRandom(femaleFirstNames)} ${surname}`;

      // Parent User
      const parentUser = await prisma.user.create({
        data: {
          email: parentEmail,
          name: fatherName, // using father as primary contact
          password: parentPassword,
          role: "PARENT",
          regId: `PAR-${rollNumber}`,
          phone: parentPhone,
          isActive: true,
        },
      });

      // Parent Profile
      const parent = await prisma.parent.create({
        data: {
          userId: parentUser.id,
        },
      });

      // Student User
      const studentUser = await prisma.user.create({
        data: {
          email: studentEmail,
          name: fullName,
          password: studentPassword,
          role: "STUDENT",
          regId: `STU-${rollNumber}`,
          phone: studentPhone,
          isActive: true,
        },
      });

      // Student Profile
      await prisma.student.create({
        data: {
          userId: studentUser.id,
          classId: cls.id,
          rollNo: rollNumber,
          dateOfBirth: dob,
          address: address,
          fatherName: fatherName,
          motherName: motherName,
          fatherPhone: parentPhone,
          motherPhone: `7${Math.floor(100000000 + Math.random() * 900000000)}`,
          admissionDate: new Date("2023-04-01"),
          parentId: parent.id,
        },
      });
    }
  }

  console.log("120 Students and Parents created successfully.");
  console.log("Seed script finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
