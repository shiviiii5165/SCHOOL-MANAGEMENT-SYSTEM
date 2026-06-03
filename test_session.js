const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres.rnbhlpavfrdsgumxesra:aMazon%402029999999@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pool_mode=session&sslmode=require'
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
