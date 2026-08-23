import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../prisma-test/test-prod.db',
    },
  },
});

async function main() {
  const user = await prisma.user.findFirst();
  await prisma.lead.create({
    data: {
      id: 'TEST-LEAD-411',
      companyName: 'Test Corp',
      contactPerson: 'Test Name',
      email: 'test@test.com',
      status: 'NEW',
      leadNumber: 'L-411',
      mobile: '+123456789',
      interestedService: 'Testing',
      createdById: user.id,
    },
  });
  console.log('CREATED');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
