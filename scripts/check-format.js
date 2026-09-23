const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.$queryRawUnsafe(`SELECT * FROM EmployeeStatusEvent LIMIT 3`);
  console.log("Raw events:", events);
}

main().finally(() => prisma.$disconnect());
