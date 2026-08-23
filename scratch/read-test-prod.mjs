import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../prisma-test/test-prod.db',
    },
  },
});

async function main() {
  const record = await prisma.lead.findUnique({
    where: { id: 'TEST-LEAD-411' },
  });
  if (record) {
    console.log('READ SUCCESS:', record.id);
  } else {
    console.log('NOT FOUND');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
