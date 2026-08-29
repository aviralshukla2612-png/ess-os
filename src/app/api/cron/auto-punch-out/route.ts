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
 * Vercel Cron example (vercel.json):
 * {
 *   "crons": [{ "path": "/api/cron/auto-punch-out", "schedule": "59 23 * * *" }]
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
    const now = new Date();

    // "Today" starts at midnight of the current calendar day (server TZ)
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Find every attendance record that is still open and belongs to a previous day
    const openRecords = await prisma.attendance.findMany({
      where: {
        punchOut: null,
        date: { lt: startOfToday },
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

    for (const record of openRecords) {
      // Auto punch-out time = 23:59:59 of the day the record belongs to
      const autoPunchOut = new Date(record.date);
      autoPunchOut.setHours(23, 59, 59, 0);

      // Total worked minutes = elapsed from punch-in to 23:59:59 (cap at 0)
      const punchInMs = new Date(record.punchIn).getTime();
      const totalMinutes = Math.max(0, Math.floor((autoPunchOut.getTime() - punchInMs) / 60000));

      const startOfDay = new Date(record.date);
      startOfDay.setHours(0, 0, 0, 0);

      await prisma.$transaction([
        // Close the attendance record
        prisma.attendance.update({
          where: { id: record.id },
          data: {
            punchOut: autoPunchOut,
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
              gte: startOfDay,
              lte: autoPunchOut,
            },
          },
          data: { endedAt: autoPunchOut },
        }),
      ]);

      closedCount++;
      console.log(
        `[auto-punch-out] Closed record for ${record.employee.user.name} ` +
        `(${record.employee.employeeIdCode}) on ${startOfDay.toDateString()} ` +
        `at ${autoPunchOut.toTimeString().slice(0, 8)}`
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
