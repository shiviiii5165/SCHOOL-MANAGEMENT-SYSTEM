const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.assignment.count();
  console.log("Assignments:", count);
}
check().finally(() => prisma.$disconnect());
