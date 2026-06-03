const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'teacher@school.com' }});
  console.log("User:", user);
}

main().finally(() => prisma.$disconnect());
