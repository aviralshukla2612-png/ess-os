import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    let whereClause = {};
    if (user.activeRole !== "OWNER") {
      if (!user.employeeId) {
        return NextResponse.json({ success: false, data: [] });
      }
      whereClause = { employeeId: user.employeeId };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        employee: {
          include: { user: true },
        },
      },
    });

    const formatted = attendances.map((a) => ({
      id: a.id,
      employeeId: a.employee.employeeIdCode,
      name: a.employee.user.name,
      date: new Date(a.date).toLocaleDateString(),
      punchIn: a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
      punchOut: a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "06:00 PM",
      status: a.status,
      workHours: `${Math.floor((a.totalMinutes || 0) / 60)}h ${(a.totalMinutes || 0) % 60}m`,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    if (!user.employeeId) {
      return NextResponse.json({ success: false, error: "Not associated with an employee profile" }, { status: 403 });
    }

    const body = await req.json();
    // IGNORE browser employeeId! Use server-derived employeeId.
    const { actionType, notes, dateOffsetDays } = body;

    const emp = await prisma.employee.findUnique({
      where: { id: user.employeeId },
    });

    if (!emp) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const logDate = dateOffsetDays ? new Date(Date.now() - 86400000 * dateOffsetDays) : new Date();

    if (actionType === "PUNCH_IN") {
      const [att] = await prisma.$transaction([
        prisma.attendance.create({
          data: {
            employeeId: emp.id,
            date: logDate,
            punchIn: logDate,
            status: "PRESENT",
            totalMinutes: 540,
          },
        }),
        prisma.employeeStatusEvent.create({
          data: {
            employeeId: emp.id,
            statusType: "WORKING",
            startedAt: logDate,
            notes: notes || "Punched in for daily sprint tasks",
          },
        })
      ]);

      return NextResponse.json({ success: true, data: att });
    } else if (actionType === "PUNCH_OUT") {
      const att = await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: logDate,
          punchIn: new Date(logDate.getTime() - 32400000), // 9 hours
          punchOut: logDate,
          status: "PRESENT",
          totalMinutes: 540,
        },
      });

      return NextResponse.json({ success: true, data: att });
    } else if (actionType === "BREAK") {
      const evt = await prisma.employeeStatusEvent.create({
        data: {
          employeeId: emp.id,
          statusType: "BREAK",
          startedAt: logDate,
          notes: notes || "Tea / Lunch break",
        },
      });
      return NextResponse.json({ success: true, data: evt });
    }

    return NextResponse.json({ success: true, message: "Attendance event recorded" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to record attendance" }, { status: 500 });
  }
}
