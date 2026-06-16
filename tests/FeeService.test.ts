// Basic test scaffold for FeeService
// Run with: npx tsx tests/FeeService.test.ts
import { FeeService } from '../services/FeeService';
import { prisma } from '../lib/prisma';

async function runTests() {
  console.log("Running FeeService Tests...");
  
  try {
    // 1. Test Admin validation logic
    const adminIds = await (FeeService as any).getAuthorizedStudentIds('admin-123', 'ADMIN', 'student-123');
    if (adminIds[0] === 'student-123') {
      console.log("✅ Admin access to specific student ID passed");
    } else {
      console.error("❌ Admin access failed");
    }

    // 2. Test fallback protection for admin without ID
    try {
      await (FeeService as any).getAuthorizedStudentIds('admin-123', 'ADMIN');
      console.error("❌ Admin missing student ID fallback failed (should throw error)");
    } catch (e: any) {
      if (e.message.includes("Admin must specify a studentId")) {
        console.log("✅ Admin missing student ID fallback passed");
      }
    }

  } catch (e) {
    console.error("Test Suite Failed:", e);
  } finally {
    await prisma.$disconnect();
    console.log("Tests Complete.");
  }
}

// execute if running directly
if (require.main === module) {
  runTests();
}
