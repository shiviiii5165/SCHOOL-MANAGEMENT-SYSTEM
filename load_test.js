const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateLoad(concurrentUsers, operation) {
  const start = performance.now();
  
  const promises = [];
  for(let i = 0; i < concurrentUsers; i++) {
    promises.push(operation().catch(() => null));
  }
  
  await Promise.all(promises);
  
  const end = performance.now();
  const totalMs = end - start;
  const avgMs = totalMs / concurrentUsers;
  
  console.log(`[${concurrentUsers} Users] Total Time: ${totalMs.toFixed(2)}ms | Avg Latency: ${avgMs.toFixed(2)}ms`);
  return { totalMs, avgMs };
}

async function runLoadTests() {
  console.log("--- LOAD TEST RESULTS ---");
  
  try {
    // 100 Users
    console.log("\nSimulating 100 Concurrent Users (Fees Fetch)...");
    await simulateLoad(100, () => prisma.feeRecord.findMany({ take: 10 }));
    
    // 250 Users
    console.log("\nSimulating 250 Concurrent Users (Fees Fetch)...");
    await simulateLoad(250, () => prisma.feeRecord.findMany({ take: 10 }));
    
    // 500 Users
    console.log("\nSimulating 500 Concurrent Users (Fees Fetch)...");
    await simulateLoad(500, () => prisma.feeRecord.findMany({ take: 10 }));
    
  } catch(e) {
    console.error("Load test failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

runLoadTests();
