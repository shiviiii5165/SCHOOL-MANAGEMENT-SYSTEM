const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getParentDetails() {
  const nidhiUser = await prisma.user.findUnique({
    where: { email: "9b015@student.dpsrajasthan.edu.in" }
  });

  if (!nidhiUser) {
    console.log("Nidhi not found");
    return;
  }

  const studentRecord = await prisma.student.findUnique({
    where: { userId: nidhiUser.id },
    include: {
      parent: {
        include: {
          user: true
        }
      }
    }
  });

  if (studentRecord?.parent?.user) {
    console.log("Parent Name:", studentRecord.parent.user.name);
    console.log("Parent Email:", studentRecord.parent.user.email);
    console.log("Password: Parent@1234 (default for seeded parents)");
  } else {
    console.log("No parent record found for Nidhi.");
  }
}

getParentDetails()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
