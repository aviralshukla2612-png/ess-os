import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (!authRes.employeeId) {
    return NextResponse.json({ success: false, error: "Forbidden: No employee profile linked" }, { status: 403 });
  }

  try {
    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
    
    if (isMobile) {
      return NextResponse.json({ 
        success: false, 
        error: "Punch In restricted: You must use a laptop or desktop computer to punch in." 
      }, { status: 403 });
    }

    const employeeId = authRes.employeeId;

    // Check if the employee already punched in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Look up the real Employee by UUID or employeeIdCode
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

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      }
    });

    if (existingAttendance) {
      return NextResponse.json({ 
        success: false, 
        error: "Already punched in today.",
        attendance: existingAttendance
      }, { status: 400 });
    }

    // ── Auto-close any forgotten punch-outs from previous days ──────────────
    // If the employee forgot to punch out yesterday (or earlier), we close
    // those records at 23:59:59 of their respective day before creating today's.
    const forgottenRecords = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        punchOut: null,
        date: { lt: startOfDay }, // strictly before today
      },
    });

    for (const forgotten of forgottenRecords) {
      // Set punch-out to 23:59:59 of the day the record belongs to
      const autoPunchOut = new Date(forgotten.date);
      autoPunchOut.setHours(23, 59, 59, 0);

      const punchInMs = new Date(forgotten.punchIn).getTime();
      const totalMinutes = Math.max(0, Math.floor((autoPunchOut.getTime() - punchInMs) / 60000));

      await prisma.$transaction([
        prisma.attendance.update({
          where: { id: forgotten.id },
          data: {
            punchOut: autoPunchOut,
            totalMinutes,
            status: "PRESENT",
            punchOutReason: "Auto punch-out: employee did not punch out before midnight.",
          },
        }),
        // Close any dangling status events (breaks/working) for that day
        prisma.employeeStatusEvent.updateMany({
          where: {
            employeeId: employee.id,
            endedAt: null,
            startedAt: {
              gte: new Date(new Date(forgotten.date).setHours(0, 0, 0, 0)),
              lte: autoPunchOut,
            },
          },
          data: { endedAt: autoPunchOut },
        }),
      ]);
    }
    // ────────────────────────────────────────────────────────────────────────

    // Create new attendance and initial working status event
    const [attendance] = await prisma.$transaction([
      prisma.attendance.create({
        data: {
          employeeId: employee.id,
          punchIn: new Date(),
          date: new Date(),
        }
      }),
      prisma.employeeStatusEvent.create({
        data: {
          employeeId: employee.id,
          statusType: "WORKING",
          startedAt: new Date(),
          notes: "Punched in for the day",
        }
      })
    ]);

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Punch In Error:", error);
    return NextResponse.json({ success: false, error: "Failed to punch in" }, { status: 500 });
  }
}
