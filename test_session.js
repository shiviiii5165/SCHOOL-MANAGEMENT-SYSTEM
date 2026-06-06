const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function test() {
  try {
    const u = await prisma.user.count();
    console.log('success', u);
  } catch(e) {
    console.log(e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
