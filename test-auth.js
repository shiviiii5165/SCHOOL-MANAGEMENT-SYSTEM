const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const u = await prisma.user.findUnique({where:{email:'teacher@school.com'}});
    if (!u) {
      console.log('User not found');
      return;
    }
    console.log('Found user:', u.email);
    console.log('Stored Hash:', u.password);
    
    const match = await bcrypt.compare('Teacher@123', u.password);
    console.log('Does Teacher@123 match?', match);
    
    const match2 = await bcrypt.compare('teacher@123', u.password);
    console.log('Does teacher@123 match?', match2);
  } catch(e) {
    console.error('DB Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
