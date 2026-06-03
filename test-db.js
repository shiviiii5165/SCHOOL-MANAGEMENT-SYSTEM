const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const users = await prisma.user.findMany(); 
  const classes = await prisma.class.findMany();
  console.log('USERS:', JSON.stringify(users, null, 2)); 
  console.log('CLASSES:', JSON.stringify(classes, null, 2)); 
} 

main().catch(console.error).finally(() => prisma.$disconnect());
