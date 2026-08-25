import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ownerUser = await prisma.user.findUnique({ where: { email: "owner@esscompany.com" } });
  if (ownerUser) {
    await prisma.employee.upsert({
      where: { userId: ownerUser.id },
      update: {},
      create: {
        userId: ownerUser.id,
        employeeIdCode: "EMP-OWNER",
        salaryMonthly: 500000,
        skillsJson: JSON.stringify(["Management", "Strategy", "Operations"]),
      },
    });
    console.log("Owner employee profile created!");
  }

  const salesUser = await prisma.user.findUnique({ where: { email: "karan.sales@esscompany.com" } });
  if (salesUser) {
    await prisma.employee.upsert({
      where: { userId: salesUser.id },
      update: {},
      create: {
        userId: salesUser.id,
        employeeIdCode: "EMP-SALES",
        salaryMonthly: 150000,
        skillsJson: JSON.stringify(["Sales", "Negotiation", "CRM"]),
      },
    });
    console.log("Sales employee profile created!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
