const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testSubmission() {
  try {
    console.log("Looking for a test student and assignment...");
    const student = await prisma.student.findFirst();
    const assignment = await prisma.assignment.findFirst();

    if (!student || !assignment) {
      console.log("Could not find a student or an assignment to test with. Please create some sample data first.");
      return;
    }

    console.log(`Found Student ID: ${student.id}`);
    console.log(`Found Assignment ID: ${assignment.id}`);

    // Check if a submission already exists
    let existingSubmission = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: assignment.id,
          studentId: student.id,
        }
      }
    });

    if (existingSubmission) {
        console.log("A submission already exists for this student and assignment. Deleting it to run the test...");
        await prisma.submission.delete({
            where: { id: existingSubmission.id }
        });
    }

    console.log("Attempting to create first submission...");
    const submission1 = await prisma.submission.create({
      data: {
        assignmentId: assignment.id,
        studentId: student.id,
        fileUrl: "https://example.com/test-submission.pdf",
        marks: null,
      }
    });
    console.log("✅ First submission created successfully:", submission1.id);

    console.log("Attempting to create duplicate submission (should fail due to our new unique constraint)...");
    try {
      await prisma.submission.create({
        data: {
          assignmentId: assignment.id,
          studentId: student.id,
          fileUrl: "https://example.com/duplicate.pdf",
          marks: null,
        }
      });
      console.log("❌ ERROR: Duplicate submission was created. The unique constraint did NOT work.");
    } catch (error) {
      if (error.code === 'P2002') {
         console.log("✅ SUCCESS: Duplicate submission was prevented! The unique constraint [assignmentId, studentId] is working correctly.");
      } else {
         console.log("❌ Unexpected error:", error);
      }
    }

    // Clean up test data
    console.log("Cleaning up test submission...");
    await prisma.submission.delete({
        where: { id: submission1.id }
    });
    console.log("✅ Cleanup complete.");

  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubmission();
