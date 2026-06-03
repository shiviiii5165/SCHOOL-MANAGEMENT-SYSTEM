const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Find Teacher Rajesh Singh
  const user = await prisma.user.findFirst({
    where: { email: "teacher@school.com" }
  });
  
  if (!user) {
    throw new Error("Teacher user not found");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id }
  });

  if (!teacher) {
    throw new Error("Teacher record not found");
  }

  // 1. Create/Find Classes
  const classDefs = [
    { name: "Class 8", section: "A" },
    { name: "Class 9", section: "B" },
    { name: "Class 10", section: "A" },
    { name: "Class 11", section: "Science" }
  ];

  const classes = [];
  for (const c of classDefs) {
    let cls = await prisma.class.findFirst({
      where: { name: c.name, section: c.section }
    });
    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name: c.name,
          section: c.section,
          teacherId: teacher.id
        }
      });
    }
    classes.push(cls);
  }

  // 2. Create/Find Subjects
  const subjectDefs = [
    { name: "Mathematics", code: "MATH8", classId: classes[0].id },
    { name: "Physics", code: "PHY9", classId: classes[1].id },
    { name: "Mathematics", code: "MATH10", classId: classes[2].id },
    { name: "Physics", code: "PHY11", classId: classes[3].id },
  ];

  const subjects = [];
  for (const s of subjectDefs) {
    let sub = await prisma.subject.findFirst({
      where: { name: s.name, classId: s.classId }
    });
    if (!sub) {
      sub = await prisma.subject.create({
        data: {
          name: s.name,
          code: s.code,
          classId: s.classId,
          teacherId: teacher.id
        }
      });
    }
    subjects.push(sub);
  }

  // 3. Clear existing periods for this teacher
  await prisma.timetablePeriod.deleteMany({
    where: { teacherId: teacher.id }
  });

  // 4. Create Periods
  const periodTimings = [
    { num: 1, start: "08:00", end: "08:45" },
    { num: 2, start: "08:45", end: "09:30" },
    { num: 3, start: "09:45", end: "10:30" },
    { num: 4, start: "10:30", end: "11:15" },
    { num: 5, start: "11:45", end: "12:30" },
    { num: 6, start: "12:30", end: "13:15" },
    { num: 7, start: "13:15", end: "14:00" },
  ];

  const periodsToCreate = [];

  // Generate a realistic weekly timetable (Monday - Saturday)
  // Teacher teaches Math to 8A, 10A and Physics to 9B, 11 Science
  
  // Define a mapping
  const classSubjMap = [
    { class: classes[0], subject: subjects[0] }, // 8A Math
    { class: classes[1], subject: subjects[1] }, // 9B Physics
    { class: classes[2], subject: subjects[2] }, // 10A Math
    { class: classes[3], subject: subjects[3] }, // 11 Science Physics
  ];

  for (let day = 1; day <= 6; day++) {
    // 6 periods a day for this teacher, leaving one free period
    const classesToday = [1, 2, 3, 4, 5, 6, 7].sort(() => 0.5 - Math.random()).slice(0, 6);
    
    for (const pNum of classesToday) {
      const time = periodTimings.find(pt => pt.num === pNum);
      const mapping = classSubjMap[Math.floor(Math.random() * classSubjMap.length)];
      
      periodsToCreate.push({
        teacherId: teacher.id,
        classId: mapping.class.id,
        subjectId: mapping.subject.id,
        dayOfWeek: day,
        periodNumber: pNum,
        startTime: time.start,
        endTime: time.end,
        roomNumber: `Room ${101 + classSubjMap.indexOf(mapping)}`,
      });
    }
  }

  await prisma.timetablePeriod.createMany({
    data: periodsToCreate
  });

  console.log(`✅ Successfully seeded ${periodsToCreate.length} timetable periods for Rajesh Singh!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
