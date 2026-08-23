const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:../production-data/production.db' } } });

async function run() {
  const users = await p.user.findMany({ where: { employeeProfile: null } });
  for (let u of users) {
    await p.employee.create({
      data: {
        userId: u.id,
        employeeIdCode: 'EMP-' + Math.floor(100 + Math.random() * 900),
        salaryMonthly: 50000,
        skillsJson: '[]'
      }
    });
    console.log('Created for', u.email);
  }
  console.log('Done');
}
run();
