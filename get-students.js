const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getAnotherStudent() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    take: 5
  });
  console.table(students.map(s => ({ Name: s.name, Email: s.email })));
}

getAnotherStudent()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
