const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function testLogin() {
  const email = "9b015@student.dpsrajasthan.edu.in";
  const password = "Student@1234";

  console.log(`Testing login for: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    console.log("❌ User not found with email:", email);
    
    // Let's find ANY user with Nidhi in the name
    const nidhis = await prisma.user.findMany({
      where: { name: { contains: "Nidhi", mode: "insensitive" } },
      select: { name: true, email: true, role: true }
    });
    console.log("Users containing 'Nidhi':", nidhis);
    
    return;
  }

  console.log("✅ User found:", user.name, user.email, user.role);

  const passwordsMatch = await bcrypt.compare(password, user.password);

  if (!passwordsMatch) {
    console.log("❌ Password mismatch!");
  } else {
    console.log("✅ Password matches!");
  }
}

testLogin()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
