import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cron/auto-punch-out
 *
 * Closes every open attendance record (punchOut IS NULL) that belongs to a
 * previous calendar day by setting punchOut to 23:59:59 of that day.
 *
 * Intended to be called once nightly (e.g. 23:58 or 00:05 the next day).
 *
 * Security: protected by a shared CRON_SECRET env variable.
 * Call with:  Authorization: Bearer <CRON_SECRET>
 *
 * Vercel Cron example (vercel.json) - Runs at 11:59 PM IST (18:29 UTC):
 * {
 *   "crons": [{ "path": "/api/cron/auto-punch-out", "schedule": "29 18 * * *" }]
 * }
 */
export async function POST(req: NextRequest) {
  // ── Auth: only allow requests with the correct cron secret ──────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // Find every attendance record that is still open
    // We will punch them out at 23:59:59 IST of their respective punch-in day
    const openRecords = await prisma.attendance.findMany({
      where: {
        punchOut: null,
      },
      include: {
        employee: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (openRecords.length === 0) {
      return NextResponse.json({ success: true, closedCount: 0, message: "No open records found." });
    }

    let closedCount = 0;

    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    for (const record of openRecords) {
      // 1. Convert the punch-in time from UTC to IST
      const punchInUTC = new Date(record.punchIn);
      const punchInIST = new Date(punchInUTC.getTime() + IST_OFFSET_MS);

      // 2. Set the auto punch-out time to 23:59:59 of that IST day
      const autoPunchOutIST = new Date(punchInIST);
      autoPunchOutIST.setUTCHours(23, 59, 59, 0);

      // 3. Convert that 23:59:59 IST time back to UTC to store in DB
      const autoPunchOutUTC = new Date(autoPunchOutIST.getTime() - IST_OFFSET_MS);

      // 4. Same for start of day for closing status events
      const startOfDayIST = new Date(punchInIST);
      startOfDayIST.setUTCHours(0, 0, 0, 0);
      const startOfDayUTC = new Date(startOfDayIST.getTime() - IST_OFFSET_MS);

      // Total worked minutes = elapsed from punch-in to 23:59:59 (cap at 0)
      const totalMinutes = Math.max(0, Math.floor((autoPunchOutUTC.getTime() - punchInUTC.getTime()) / 60000));

      await prisma.$transaction([
        // Close the attendance record
        prisma.attendance.update({
          where: { id: record.id },
          data: {
            punchOut: autoPunchOutUTC,
            totalMinutes,
            status: "PRESENT",
            punchOutReason: "Auto punch-out: employee did not punch out before midnight.",
          },
        }),
        // Close any dangling EmployeeStatusEvents for that day
        prisma.employeeStatusEvent.updateMany({
          where: {
            employeeId: record.employeeId,
            endedAt: null,
            startedAt: {
              gte: startOfDayUTC,
              lte: autoPunchOutUTC,
            },
          },
          data: { endedAt: autoPunchOutUTC },
        }),
      ]);

      closedCount++;
      console.log(
        `[auto-punch-out] Closed record for ${record.employee.user.name} ` +
        `(${record.employee.employeeIdCode}) on ${startOfDayUTC.toDateString()} ` +
        `at ${autoPunchOutUTC.toTimeString().slice(0, 8)} (UTC)`
      );
    }

    return NextResponse.json({
      success: true,
      closedCount,
      message: `Auto punch-out applied to ${closedCount} record(s).`,
    });
  } catch (error) {
    console.error("[auto-punch-out] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * GET is intentionally disabled for this endpoint.
 */
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
