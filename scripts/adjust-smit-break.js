const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching users to locate employee Smit Katri / Smit Khatri...");

  const allUsers = await prisma.user.findMany({
    include: {
      employeeProfile: true
    }
  });

  const matchedUsers = allUsers.filter(u => {
    const n = (u.name || "").toLowerCase();
    const e = (u.email || "").toLowerCase();
    return n.includes("smit") || n.includes("katri") || n.includes("khatri") || e.includes("smit");
  });

  if (matchedUsers.length === 0) {
    console.log("No user found matching 'smit' or 'katri' or 'khatri'.");
    console.log("All registered users in DB:");
    allUsers.forEach(u => {
      console.log(`- ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | EmpID: ${u.employeeProfile?.id || "None"}`);
    });
    return;
  }

  for (const user of matchedUsers) {
    console.log(`\n========================================`);
    console.log(`Processing: ${user.name} (${user.email})`);
    if (!user.employeeProfile) {
      console.log("  ⚠️ No employee profile linked to this user.");
      continue;
    }
    const empId = user.employeeProfile.id;
    console.log(`  Employee Profile ID: ${empId}`);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const events = await prisma.employeeStatusEvent.findMany({
      where: {
        employeeId: empId,
        startedAt: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { startedAt: "asc" }
    });

    console.log(`\n  Today's Status Events for ${user.name} (${events.length} records):`);
    events.forEach((ev, idx) => {
      const startStr = new Date(ev.startedAt).toLocaleTimeString();
      const endStr = ev.endedAt ? new Date(ev.endedAt).toLocaleTimeString() : "ONGOING";
      const durSec = ev.endedAt
        ? Math.floor((new Date(ev.endedAt).getTime() - new Date(ev.startedAt).getTime()) / 1000)
        : Math.floor((Date.now() - new Date(ev.startedAt).getTime()) / 1000);
      const durMin = (durSec / 60).toFixed(1);
      console.log(`    [${idx + 1}] ID: ${ev.id} | ${ev.statusType} | Notes: ${ev.notes || "-"} | ${startStr} -> ${endStr} (${durMin} min / ${durSec}s)`);
    });

    const breakEvents = events.filter(e => e.statusType !== "WORKING");
    if (breakEvents.length === 0) {
      console.log("\n  ⚠️ No break events found today for this employee.");
      continue;
    }

    const REDUCE_MS = 20 * 60 * 1000; // 20 minutes (1200000 ms)
    let remainingToReduce = REDUCE_MS;

    for (let i = breakEvents.length - 1; i >= 0 && remainingToReduce > 0; i--) {
      const bEv = breakEvents[i];
      const startMs = new Date(bEv.startedAt).getTime();
      const endMs = bEv.endedAt ? new Date(bEv.endedAt).getTime() : Date.now();
      const currentDurationMs = endMs - startMs;

      const reduceThis = Math.min(remainingToReduce, currentDurationMs);
      if (reduceThis <= 0) continue;

      if (bEv.endedAt) {
        // Shift endedAt earlier by reduceThis
        const newEndedAt = new Date(new Date(bEv.endedAt).getTime() - reduceThis);
        await prisma.employeeStatusEvent.update({
          where: { id: bEv.id },
          data: { endedAt: newEndedAt }
        });
        console.log(`\n  ✓ Reduced Break Event [${bEv.id}] duration by ${reduceThis / 60000} mins. New endedAt: ${newEndedAt.toLocaleTimeString()}`);
      } else {
        // Ongoing break: Shift startedAt forward by reduceThis
        const newStartedAt = new Date(new Date(bEv.startedAt).getTime() + reduceThis);
        await prisma.employeeStatusEvent.update({
          where: { id: bEv.id },
          data: { startedAt: newStartedAt }
        });
        console.log(`\n  ✓ Shifted Ongoing Break Event [${bEv.id}] startedAt forward by ${reduceThis / 60000} mins. New startedAt: ${newStartedAt.toLocaleTimeString()}`);
      }

      // Adjust adjacent WORKING event so the 20 minutes is counted as WORK time
      const nextWorkEv = events.find(e => e.statusType === "WORKING" && Math.abs(new Date(e.startedAt).getTime() - endMs) < 60000);
      if (nextWorkEv) {
        const newWorkStart = new Date(new Date(nextWorkEv.startedAt).getTime() - reduceThis);
        await prisma.employeeStatusEvent.update({
          where: { id: nextWorkEv.id },
          data: { startedAt: newWorkStart }
        });
        console.log(`  ✓ Extended subsequent WORKING Event [${nextWorkEv.id}] earlier by ${reduceThis / 60000} mins to credit work time.`);
      } else {
        const prevWorkEv = events.find(e => e.statusType === "WORKING" && e.endedAt && Math.abs(new Date(e.endedAt).getTime() - startMs) < 60000);
        if (prevWorkEv && prevWorkEv.endedAt) {
          const newWorkEnd = new Date(new Date(prevWorkEv.endedAt).getTime() + reduceThis);
          await prisma.employeeStatusEvent.update({
            where: { id: prevWorkEv.id },
            data: { endedAt: newWorkEnd }
          });
          console.log(`  ✓ Extended previous WORKING Event [${prevWorkEv.id}] later by ${reduceThis / 60000} mins to credit work time.`);
        }
      }

      remainingToReduce -= reduceThis;
    }

    console.log(`\n========================================`);
    console.log(`✅ Successfully reduced 20 minutes break time for ${user.name} only!`);
    console.log(`========================================\n`);
  }
}

main()
  .catch(e => {
    console.error("Error executing break adjustment:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
