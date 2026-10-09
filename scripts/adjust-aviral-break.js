const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Searching for employee Aviral Shukla...");

  const allUsers = await prisma.user.findMany({
    include: {
      employeeProfile: true
    }
  });

  const matchedUsers = allUsers.filter(u => {
    const n = (u.name || "").toLowerCase();
    const e = (u.email || "").toLowerCase();
    return n.includes("aviral") || n.includes("shukla") || e.includes("aviral");
  });

  if (matchedUsers.length === 0) {
    console.log("⚠️ No user found matching 'Aviral' or 'Shukla'.");
    console.log("Registered users with employee profiles in DB:");
    allUsers.forEach(u => {
      console.log(`- ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | EmpID: ${u.employeeProfile?.id || "None"}`);
    });
    return;
  }

  for (const user of matchedUsers) {
    console.log(`\n========================================`);
    console.log(`Target Employee: ${user.name} (${user.email})`);
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
    let initialBreakMs = 0;
    let initialWorkMs = 0;
    const nowMs = Date.now();

    events.forEach((ev, idx) => {
      const sMs = new Date(ev.startedAt).getTime();
      const eMs = ev.endedAt ? new Date(ev.endedAt).getTime() : nowMs;
      const durMs = Math.max(0, eMs - sMs);
      const durMin = (durMs / 60000).toFixed(1);
      const startStr = new Date(ev.startedAt).toLocaleTimeString();
      const endStr = ev.endedAt ? new Date(ev.endedAt).toLocaleTimeString() : "ONGOING";

      console.log(`    [${idx + 1}] ID: ${ev.id} | ${ev.statusType} | Notes: ${ev.notes || "-"} | ${startStr} -> ${endStr} (${durMin} min)`);

      if (ev.statusType === "WORKING") {
        initialWorkMs += durMs;
      } else {
        initialBreakMs += durMs;
      }
    });

    console.log(`\n  Current Recorded Break Time: ${(initialBreakMs / 60000).toFixed(1)} minutes (${Math.floor(initialBreakMs / 3600000)}h ${Math.round((initialBreakMs % 3600000) / 60000)}m)`);
    console.log(`  Current Recorded Work Time : ${(initialWorkMs / 60000).toFixed(1)} minutes (${Math.floor(initialWorkMs / 3600000)}h ${Math.round((initialWorkMs % 3600000) / 60000)}m)`);

    const TARGET_BREAK_MS = 20 * 60 * 1000; // Exactly 20 minutes (1,200,000 ms)

    if (initialBreakMs <= TARGET_BREAK_MS) {
      console.log(`\n  ℹ️ Break time is already ${(initialBreakMs / 60000).toFixed(1)} mins (<= 20 minutes). No reduction needed.`);
      continue;
    }

    const excessToReduceMs = initialBreakMs - TARGET_BREAK_MS;
    console.log(`\n  🎯 Target Break Time: 20.0 minutes`);
    console.log(`  ✂️ Excess Break Time to convert to Work: ${(excessToReduceMs / 60000).toFixed(1)} mins (${Math.floor(excessToReduceMs / 3600000)}h ${Math.round((excessToReduceMs % 3600000) / 60000)}m)`);

    const breakEvents = events.filter(e => e.statusType !== "WORKING");
    // Sort break events from longest duration to shortest
    breakEvents.sort((a, b) => {
      const durA = (a.endedAt ? new Date(a.endedAt).getTime() : nowMs) - new Date(a.startedAt).getTime();
      const durB = (b.endedAt ? new Date(b.endedAt).getTime() : nowMs) - new Date(b.startedAt).getTime();
      return durB - durA;
    });

    let remainingToCut = excessToReduceMs;

    for (const bEv of breakEvents) {
      if (remainingToCut <= 0) break;

      const sMs = new Date(bEv.startedAt).getTime();
      const origEndMs = bEv.endedAt ? new Date(bEv.endedAt).getTime() : nowMs;
      const currentDur = origEndMs - sMs;

      // Ensure we don't cut more than the event's duration (leave at least 1 minute unless it's the exact target)
      const cutThis = Math.min(remainingToCut, Math.max(0, currentDur));
      if (cutThis <= 0) continue;

      const newEndMs = origEndMs - cutThis;
      const newEndedAt = new Date(newEndMs);

      if (bEv.endedAt) {
        await prisma.employeeStatusEvent.update({
          where: { id: bEv.id },
          data: { endedAt: newEndedAt }
        });
        console.log(`  ✓ Trimmed break [${bEv.id}] endedAt earlier by ${(cutThis / 60000).toFixed(1)} mins -> now ends at ${newEndedAt.toLocaleTimeString()}`);
      } else {
        // If it was ongoing, shift startedAt forward
        const newStartedAt = new Date(sMs + cutThis);
        await prisma.employeeStatusEvent.update({
          where: { id: bEv.id },
          data: { startedAt: newStartedAt }
        });
        console.log(`  ✓ Shifted ongoing break [${bEv.id}] startedAt forward by ${(cutThis / 60000).toFixed(1)} mins`);
      }

      // Now credit the cut time into WORKING time
      // 1. Check if there is an adjacent subsequent WORKING event starting near the old end
      const nextWork = events.find(e => e.statusType === "WORKING" && Math.abs(new Date(e.startedAt).getTime() - origEndMs) < 120000);
      if (nextWork) {
        const newWorkStart = new Date(new Date(nextWork.startedAt).getTime() - cutThis);
        await prisma.employeeStatusEvent.update({
          where: { id: nextWork.id },
          data: { startedAt: newWorkStart }
        });
        console.log(`  ✓ Extended subsequent WORKING event [${nextWork.id}] earlier by ${(cutThis / 60000).toFixed(1)} mins (starts ${newWorkStart.toLocaleTimeString()})`);
      } else {
        // 2. Check if there is an adjacent previous WORKING event
        const prevWork = events.find(e => e.statusType === "WORKING" && e.endedAt && Math.abs(new Date(e.endedAt).getTime() - sMs) < 120000);
        if (prevWork && prevWork.endedAt) {
          const newWorkEnd = new Date(new Date(prevWork.endedAt).getTime() + cutThis);
          await prisma.employeeStatusEvent.update({
            where: { id: prevWork.id },
            data: { endedAt: newWorkEnd }
          });
          console.log(`  ✓ Extended previous WORKING event [${prevWork.id}] later by ${(cutThis / 60000).toFixed(1)} mins (ends ${newWorkEnd.toLocaleTimeString()})`);
        } else {
          // 3. Insert a working event bridging the gap
          await prisma.employeeStatusEvent.create({
            data: {
              employeeId: empId,
              statusType: "WORKING",
              startedAt: newEndedAt,
              endedAt: new Date(origEndMs),
              notes: "Credited work time from break adjustment"
            }
          });
          console.log(`  ✓ Created new WORKING event bridging ${newEndedAt.toLocaleTimeString()} -> ${new Date(origEndMs).toLocaleTimeString()} (+${(cutThis / 60000).toFixed(1)} mins work)`);
        }
      }

      remainingToCut -= cutThis;
    }

    // Recalculate and display final status
    const updatedEvents = await prisma.employeeStatusEvent.findMany({
      where: {
        employeeId: empId,
        startedAt: { gte: startOfDay, lte: endOfDay }
      },
      orderBy: { startedAt: "asc" }
    });

    let finalBreakMs = 0;
    let finalWorkMs = 0;
    updatedEvents.forEach(ev => {
      const s = new Date(ev.startedAt).getTime();
      const e = ev.endedAt ? new Date(ev.endedAt).getTime() : nowMs;
      const d = Math.max(0, e - s);
      if (ev.statusType === "WORKING") finalWorkMs += d;
      else finalBreakMs += d;
    });

    console.log(`\n========================================`);
    console.log(`✅ RESULT FOR ${user.name}:`);
    console.log(`   Total Break Time: ${(finalBreakMs / 60000).toFixed(1)} mins (${Math.round(finalBreakMs / 60000)}m) [Target: 20 mins]`);
    console.log(`   Total Work Time : ${(finalWorkMs / 60000).toFixed(1)} mins (${Math.floor(finalWorkMs / 3600000)}h ${Math.round((finalWorkMs % 3600000) / 60000)}m)`);
    console.log(`========================================\n`);
  }
}

main()
  .catch(e => {
    console.error("Error executing adjustment:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
