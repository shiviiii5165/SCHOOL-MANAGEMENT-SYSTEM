const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const allUsers = await prisma.user.count({ where: { isActive: true } });
    console.log('Successfully connected to DB! Total active users:', allUsers);
  } catch (e) {
    console.error('DB Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
