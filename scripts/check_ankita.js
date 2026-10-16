const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dbPath = path.resolve(__dirname, '../production-data/production.db');
const prisma = new PrismaClient({
  datasources: { db: { url: 'file:' + dbPath.replace(/\\/g, '/') } }
});

async function main() {
  const users = await prisma.user.findMany({
    where: { 
      OR: [
        { email: { contains: 'ankita' } },
        { name: { contains: 'Ankita' } }
      ] 
    }
  });
  const bcrypt = require('bcryptjs');
  console.log('Found users:', users.length);
  const commonPasswords = [
    'password123', 'password', '123456', '12345678', 'ankita123', 
    'ankita', 'Ankita@123', 'Ankita123', 'EMP-185', 'emp185', 'admin123', 'seo123'
  ];
  for (const u of users) {
    console.log('User:', u.name, '| Email:', u.email, '| Hash:', u.passwordHash);
    for (const p of commonPasswords) {
      if (await bcrypt.compare(p, u.passwordHash)) {
        console.log(`>>> MATCH FOUND: Password for ${u.email} is "${p}" <<<`);
        return;
      }
    }
    console.log('None of the common passwords matched.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
