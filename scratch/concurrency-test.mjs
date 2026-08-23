import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../prisma-test/test-prod.db',
    },
  },
});

async function main() {
  const user = await prisma.user.findFirst({ where: { activeRole: 'EMPLOYEE' } });
  if (!user) {
    console.log("No user found");
    return;
  }
  
  // We cannot easily test API concurrency without a full NextAuth token unless we mock the token or use Playwright.
  // We can test Prisma concurrency directly.
  
  console.log("Simulating concurrent DB insertions...");
  try {
    await Promise.all([
      prisma.lead.create({ data: { id: 'dup', leadNumber: 'DUP1', contactPerson: '1', mobile: '1', createdById: user.id } }),
      prisma.lead.create({ data: { id: 'dup', leadNumber: 'DUP1', contactPerson: '1', mobile: '1', createdById: user.id } })
    ]);
    console.log("FAIL: Both succeeded");
  } catch (err) {
    console.log("PASS: Caught constraint violation on concurrent insert", err.code);
  }
}

main().finally(() => prisma.$disconnect());
