import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { notifyAdmins, formatToIST } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const authRes = await requireAuth();
    if (authRes instanceof NextResponse) return authRes;

    const body = await req.json().catch(() => ({}));

    // Resolve employeeId from session or body as fallback
    let employeeId = authRes.employeeId || body?.employeeId;

    if (!employeeId) {
      // Check if user has an employee profile attached in DB
      const userWithEmp = await prisma.user.findUnique({
        where: { id: authRes.id },
        include: { employeeProfile: true },
      });
      if (userWithEmp?.employeeProfile?.id) {
        employeeId = userWithEmp.employeeProfile.id;
      }
    }

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Forbidden: No employee profile linked to this account" }, { status: 403 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
    
    if (isMobile) {
      return NextResponse.json({ 
        success: false, 
        error: "Punch In restricted: You must use a laptop or desktop computer to punch in." 
      }, { status: 403 });
    }

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
          { employeeIdCode: employeeId },
          { userId: authRes.id }
        ]
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found in database" }, { status: 404 });
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
    try {
      const forgottenRecords = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          punchOut: null,
          date: { lt: startOfDay }, // strictly before today
        },
      });

      for (const forgotten of forgottenRecords) {
        const autoPunchOut = new Date(forgotten.date || Date.now());
        autoPunchOut.setHours(23, 59, 59, 0);

        const punchInMs = forgotten.punchIn ? new Date(forgotten.punchIn).getTime() : autoPunchOut.getTime();
        const totalMinutes = isNaN(punchInMs) ? 0 : Math.max(0, Math.floor((autoPunchOut.getTime() - punchInMs) / 60000));

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
                gte: new Date(new Date(forgotten.date || Date.now()).setHours(0, 0, 0, 0)),
                lte: autoPunchOut,
              },
            },
            data: { endedAt: autoPunchOut },
          }),
        ]);
      }
    } catch (cleanupErr) {
      console.warn("Non-blocking error during forgotten punch-out cleanup:", cleanupErr);
    }
    // ────────────────────────────────────────────────────────────────────────

    // Create new attendance and initial working status event
    // Wrap in a transaction to prevent race conditions from multiple simultaneous clicks
    let attendance;
    try {
      const punchInTime = new Date();
      const [newAttendance] = await prisma.$transaction([
        prisma.attendance.create({
          data: {
            employeeId: employee.id,
            punchIn: punchInTime,
            date: punchInTime,
          }
        }),
        prisma.employeeStatusEvent.create({
          data: {
            employeeId: employee.id,
            statusType: "WORKING",
            startedAt: punchInTime,
            notes: "Punched in for the day",
          }
        })
      ]);
      attendance = newAttendance;

      // Dispatch real-time push notification to all admins/owners
      try {
        const timeFormatted = formatToIST(punchInTime);
        const empName = employee.user?.name || "An employee";
        const empCode = employee.employeeIdCode ? ` (${employee.employeeIdCode})` : "";

        notifyAdmins({
          title: `🟢 Punch-In: ${empName}`,
          message: `${empName}${empCode} punched in for work at ${timeFormatted}.`,
          linkUrl: "/attendance",
          type: "PUNCH_IN",
          metadata: {
            employeeId: employee.id,
            employeeName: empName,
            time: timeFormatted,
          },
        }).catch((err) => console.error("Admin notification error on punch-in:", err));
      } catch (notifErr) {
        console.error("Non-blocking notification error:", notifErr);
      }
    } catch (createError: any) {
      // P2002 = Prisma unique constraint violation
      // If two requests raced and one already created the record, return the existing one
      if (createError?.code === "P2002") {
        const existing = await prisma.attendance.findFirst({
          where: { employeeId: employee.id, date: { gte: startOfDay, lte: endOfDay } }
        });
        return NextResponse.json({ 
          success: false, 
          error: "Already punched in today.",
          attendance: existing
        }, { status: 400 });
      }
      throw createError;
    }

    return NextResponse.json({ success: true, data: attendance });
  } catch (error: any) {
    console.error("Punch In Error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to punch in" }, { status: 500 });
  }
}
