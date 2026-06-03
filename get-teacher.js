const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getTeacherDetails() {
  const class10A = await prisma.class.findFirst({
    where: { name: "Class 10", section: "A" },
    include: {
      teacher: {
        include: {
          user: true
        }
      }
    }
  });

  if (!class10A || !class10A.teacher) {
    console.log("No teacher found for Class 10-A");
    return;
  }

  console.log("Class:", class10A.name, "-", class10A.section);
  console.log("Teacher Name:", class10A.teacher.user.name);
  console.log("Teacher Email:", class10A.teacher.user.email);
  console.log("Password: Teacher@1234 (default for seeded teachers)");
}

getTeacherDetails()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
