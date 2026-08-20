const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const breaks = await prisma.employeeStatusEvent.findMany();
  console.log(breaks);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
