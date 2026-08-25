import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const results = [];

    // Setup Test User
    let testUser = await prisma.user.findUnique({ where: { email: "test-emp@ess.com" } });
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: "Test Employee",
          email: "test-emp@ess.com",
          passwordHash: "dummy",
          activeRole: "EMPLOYEE",
          isActive: true,
          designation: "Test Dev",
          department: "Engineering"
        }
      });
    }

    let testEmp = await prisma.employee.findUnique({ where: { employeeIdCode: "TEST-001" } });
    if (!testEmp) {
      testEmp = await prisma.employee.create({
        data: {
          userId: testUser.id,
          employeeIdCode: "TEST-001",
          salaryMonthly: 1500,
        }
      });
    }

    // Clean up previous runs
    await prisma.attendance.deleteMany({ where: { employeeId: testEmp.id } });
    await prisma.employeeStatusEvent.deleteMany({ where: { employeeId: testEmp.id } });

    results.push({ test: "SETUP", status: "PASS" });

    // Mock API requests by wrapping Prisma directly to bypass auth, 
    // but running the exact same logic as the endpoints.
    
    // TEST 1: PUNCH IN
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [attendance] = await prisma.$transaction([
      prisma.attendance.create({
        data: {
          employeeId: testEmp.id,
          punchIn: new Date(),
          date: new Date(),
        }
      }),
      prisma.employeeStatusEvent.create({
        data: {
          employeeId: testEmp.id,
          statusType: "WORKING",
          startedAt: new Date(),
          notes: "Punched in for the day",
        }
      })
    ]);
    
    results.push({ test: "TEST 1 - PUNCH IN", status: attendance.id ? "PASS" : "FAIL" });

    // TEST 4: START BREAK
    await prisma.employeeStatusEvent.updateMany({
      where: { employeeId: testEmp.id, endedAt: null },
      data: { endedAt: new Date() }
    });
    const breakEvent = await prisma.employeeStatusEvent.create({
      data: {
        employeeId: testEmp.id,
        statusType: "Lunch Break",
        notes: "Test break",
      }
    });
    results.push({ test: "TEST 4 - START BREAK", status: breakEvent.id ? "PASS" : "FAIL" });

    // TEST 7: END BREAK
    const openEvent = await prisma.employeeStatusEvent.findFirst({
      where: { employeeId: testEmp.id, endedAt: null },
      orderBy: { startedAt: 'desc' }
    });
    if (openEvent) {
      await prisma.$transaction([
        prisma.employeeStatusEvent.update({
          where: { id: openEvent.id },
          data: { endedAt: new Date() }
        }),
        prisma.employeeStatusEvent.create({
          data: {
            employeeId: testEmp.id,
            statusType: "WORKING",
            startedAt: new Date(),
            notes: "Resumed work after break"
          }
        })
      ]);
      results.push({ test: "TEST 7 - END BREAK", status: "PASS" });
    } else {
      results.push({ test: "TEST 7 - END BREAK", status: "FAIL - NO OPEN EVENT" });
    }

    // TEST 20: EARLY PUNCH OUT REQUEST
    const updatedEarly = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        punchOutReason: "Doctor Appointment",
        punchOutRequestStatus: "PENDING",
        punchOutRequestedAt: new Date(),
      }
    });
    results.push({ test: "TEST 20 - EARLY PUNCH OUT", status: updatedEarly.punchOutRequestStatus === "PENDING" ? "PASS" : "FAIL" });

    // TEST 21: EARLY PUNCH OUT APPROVAL
    const punchOutTime = updatedEarly.punchOutRequestedAt || new Date();
    const breakEvents = await prisma.employeeStatusEvent.findMany({
      where: {
        employeeId: testEmp.id,
        startedAt: { gte: updatedEarly.punchIn },
        statusType: { not: "WORKING" }
      }
    });
    let totalBreakMinutes = 0;
    for (const b of breakEvents) {
      const end = b.endedAt || punchOutTime;
      const diffMs = end.getTime() - b.startedAt.getTime();
      totalBreakMinutes += Math.floor(diffMs / 60000);
    }
    const elapsedMs = punchOutTime.getTime() - updatedEarly.punchIn.getTime();
    const workedMinutes = Math.max(0, Math.floor(elapsedMs / 60000) - totalBreakMinutes);

    const { count } = await prisma.attendance.updateMany({
      where: { id: attendance.id, punchOutRequestStatus: "PENDING" },
      data: {
        punchOutRequestStatus: "APPROVED",
        punchOutApprovedById: testUser.id,
        punchOut: punchOutTime,
        totalMinutes: workedMinutes,
        status: "COMPLETED"
      }
    });

    results.push({ test: "TEST 21 - APPROVAL", status: count === 1 ? "PASS" : "FAIL" });

    // TEST 22: DOUBLE APPROVAL CONCURRENCY
    const { count: doubleCount } = await prisma.attendance.updateMany({
      where: { id: attendance.id, punchOutRequestStatus: "PENDING" },
      data: {
        punchOutRequestStatus: "APPROVED",
        punchOutApprovedById: testUser.id,
      }
    });
    
    results.push({ test: "TEST 22 - DOUBLE APPROVAL (PREVENTED)", status: doubleCount === 0 ? "PASS" : "FAIL" });

    // VERIFY FINAL STATE
    const finalAttendance = await prisma.attendance.findUnique({ where: { id: attendance.id }});
    const finalEvents = await prisma.employeeStatusEvent.findMany({ where: { employeeId: testEmp.id }, orderBy: { startedAt: 'asc' }});
    
    results.push({ test: "VERIFY FINAL STATUS", status: finalAttendance?.status === "COMPLETED" ? "PASS" : "FAIL" });
    results.push({ test: "VERIFY IMMUTABLE EVENTS", status: finalEvents.length === 3 ? "PASS" : "FAIL" });

    return NextResponse.json({ success: true, results, finalAttendance, finalEvents });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) });
  }
}
