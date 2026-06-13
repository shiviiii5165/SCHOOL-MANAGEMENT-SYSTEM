const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.notice.deleteMany({}).then(() => console.log('Deleted')).finally(() => prisma.$disconnect());
