import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];
  
  if (arg === "create") {
    const user = await prisma.user.create({
      data: {
        email: "persistence_test_2026@mdzcompany.com",
        name: "Persistence Test",
        passwordHash: "test1234",
        activeRole: "EMPLOYEE",
        isActive: true,
        designation: "Test Bot",
        department: "Testing",
      }
    });
    console.log("Created user with ID:", user.id);
  } else if (arg === "verify") {
    const user = await prisma.user.findUnique({
      where: { email: "persistence_test_2026@mdzcompany.com" }
    });
    if (user) {
      console.log("Verification successful. User found:", user.id);
      
      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
      console.log("Cleanup successful.");
    } else {
      console.error("Verification failed. User not found.");
      process.exit(1);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
