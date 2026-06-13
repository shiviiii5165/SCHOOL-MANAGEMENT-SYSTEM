const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding notices...");

  // Find an admin and a teacher to act as authors
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });

  if (!admin) {
    console.log("No admin found. Cannot seed notices without an author.");
    return;
  }

  const notices: any[] = [
    {
      title: "School Closed for Diwali",
      content: "Please note that the school will remain closed from tomorrow for Diwali holidays. Classes will resume next Monday.",
      category: "HOLIDAY",
      priority: "HIGH",
      targetAudience: "EVERYONE",
      createdById: admin.id,
      createdByRole: "ADMIN",
      isPinned: true
    },
    {
      title: "Fee Payment Deadline",
      content: "The deadline for the second term fee payment is approaching. Please ensure all dues are cleared by the 15th.",
      category: "FEE_RELATED",
      priority: "URGENT",
      targetAudience: "ALL_PARENTS",
      createdById: admin.id,
      createdByRole: "ADMIN",
      isPinned: true
    },
    {
      title: "Annual Sports Day Registration",
      content: "Registration for the Annual Sports Day is now open. Students interested in participating can sign up with their class teachers.",
      category: "EVENT",
      priority: "NORMAL",
      targetAudience: "ALL_STUDENTS",
      createdById: admin.id,
      createdByRole: "ADMIN",
      isPinned: false
    },
    {
      title: "Science Exhibition Next Week",
      content: "The annual science exhibition will be held next Wednesday in the main auditorium. All parents are welcome.",
      category: "ACADEMIC",
      priority: "NORMAL",
      targetAudience: "EVERYONE",
      createdById: admin.id,
      createdByRole: "ADMIN",
      isPinned: false
    }
  ];

  if (teacher) {
    // Add a class-specific notice if teacher has a class
    const tProfile = await prisma.teacher.findUnique({ where: { userId: teacher.id }, include: { classes: true } });
    if (tProfile && tProfile.classes.length > 0) {
      notices.push({
        title: "Extra Math Class",
        content: "We will have an extra mathematics class this Saturday to cover the pending syllabus. Attendance is mandatory.",
        category: "ACADEMIC",
        priority: "NORMAL",
        targetAudience: "SPECIFIC_CLASS",
        targetClassId: tProfile.classes[0].id,
        createdById: teacher.id,
        createdByRole: "TEACHER",
        isPinned: false
      });
    }
  }

  for (const notice of notices) {
    const exists = await prisma.notice.findFirst({
      where: { title: notice.title }
    });
    
    if (!exists) {
      await prisma.notice.create({
        data: notice as any
      });
      console.log(`Created notice: ${notice.title}`);
    } else {
      console.log(`Notice already exists: ${notice.title}`);
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
