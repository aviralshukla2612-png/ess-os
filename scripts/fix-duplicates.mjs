import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find all attendance records grouped by employee + calendar day
  const all = await prisma.attendance.findMany({
    orderBy: { punchIn: "asc" },
    include: { employee: { include: { user: { select: { name: true } } } } },
  });

  // Group by employeeId + calendar day (YYYY-MM-DD)
  const groups = {};
  for (const record of all) {
    const day = new Date(record.date).toISOString().split("T")[0];
    const key = `${record.employeeId}::${day}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
  }

  let totalDeleted = 0;

  for (const [key, records] of Object.entries(groups)) {
    if (records.length <= 1) continue;

    const [empId, day] = key.split("::");
    const name = records[0].employee?.user?.name || empId;
    console.log(`\n[DUPLICATE] ${name} on ${day} — ${records.length} records found`);

    // Keep the first (earliest punchIn), delete the rest
    const [keep, ...toDelete] = records;
    console.log(`  Keeping : ${keep.id} (punchIn: ${keep.punchIn})`);
    for (const dup of toDelete) {
      console.log(`  Deleting: ${dup.id} (punchIn: ${dup.punchIn})`);
      await prisma.attendance.delete({ where: { id: dup.id } });
      totalDeleted++;
    }
  }

  console.log(`\n✅ Done. Deleted ${totalDeleted} duplicate attendance record(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
