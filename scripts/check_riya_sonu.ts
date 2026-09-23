import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== EMPLOYEES & USERS ===");
  const users = await prisma.user.findMany({
    include: {
      employeeProfile: true,
    },
  });
  for (const u of users) {
    console.log(`User: ${u.id} | ${u.name} | ${u.email} | EmpID: ${u.employeeProfile?.id} (${u.employeeProfile?.employeeIdCode})`);
  }

  console.log("\n=== RECENT ATTENDANCE RECORDS (Past 30) ===");
  const attendances = await prisma.attendance.findMany({
    take: 30,
    orderBy: { date: "desc" },
    include: {
      employee: {
        include: { user: true },
      },
    },
  });

  for (const a of attendances) {
    console.log(
      `ID: ${a.id} | Name: ${a.employee?.user?.name} (${a.employee?.employeeIdCode}) | Date: ${a.date.toISOString()} | PunchIn: ${a.punchIn?.toISOString()} | PunchOut: ${a.punchOut?.toISOString()} | TotalMin: ${a.totalMinutes} | Status: ${a.status} | ReqStatus: ${a.punchOutRequestStatus}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
