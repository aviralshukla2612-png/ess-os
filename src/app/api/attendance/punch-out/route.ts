import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  const employeeId = authRes.employeeId;
  if (!employeeId) {
    return NextResponse.json({ success: false, error: "Forbidden: No employee profile" }, { status: 403 });
  }

  try {
    const serverNow = new Date();

    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: employeeId },
          { employeeIdCode: employeeId }
        ]
      }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
    }

    // 1. Find the active attendance for today
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        punchOut: null,
      },
      orderBy: { punchIn: "desc" }
    });

    if (!activeAttendance) {
      return NextResponse.json({ success: false, error: "No active attendance found to punch out from" }, { status: 400 });
    }

    // 2. Fetch all break intervals for today to subtract them
    // An EmployeeStatusEvent represents a break if statusType != 'WORKING'
    const breakEvents = await prisma.employeeStatusEvent.findMany({
      where: {
        employeeId: employee.id,
        startedAt: { gte: activeAttendance.punchIn },
        statusType: { not: "WORKING" }
      }
    });

    let totalBreakMinutes = 0;
    for (const b of breakEvents) {
      const end = b.endedAt || serverNow; // if they forgot to end break before punch out
      const diffMs = end.getTime() - b.startedAt.getTime();
      totalBreakMinutes += Math.floor(diffMs / 60000);
    }

    // 3. Calculate total worked minutes
    const elapsedMs = serverNow.getTime() - activeAttendance.punchIn.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const workedMinutes = Math.max(0, elapsedMinutes - totalBreakMinutes);

    // 4. Perform the transactional update
    const [updatedAttendance] = await prisma.$transaction([
      // Close the attendance
      prisma.attendance.update({
        where: { id: activeAttendance.id },
        data: {
          punchOut: serverNow,
          totalMinutes: workedMinutes,
          status: "COMPLETED",
        }
      }),
      // Close any open status events (e.g. WORKING or stray breaks)
      prisma.employeeStatusEvent.updateMany({
        where: { employeeId: employee.id, endedAt: null },
        data: { endedAt: serverNow }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: updatedAttendance
    });
  } catch (error) {
    console.error("Normal Punch Out Error:", error);
    return NextResponse.json({ success: false, error: "Failed to punch out" }, { status: 500 });
  }
}
