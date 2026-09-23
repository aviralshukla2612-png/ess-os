const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.$queryRawUnsafe(`SELECT typeof(startedAt) as t_start, startedAt, typeof(endedAt) as t_end, endedAt FROM EmployeeStatusEvent LIMIT 3`);
  console.log("Column types and values:", events);
}

main().finally(() => prisma.$disconnect());
