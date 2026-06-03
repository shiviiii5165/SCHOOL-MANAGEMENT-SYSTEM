process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'; 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  const notifs = await prisma.notification.findMany({ take: 10, orderBy: { createdAt: 'desc' } }); 
  console.log(JSON.stringify(notifs, null, 2)); 
} 
main().catch(console.error).finally(() => prisma.$disconnect());
