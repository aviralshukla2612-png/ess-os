import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const attendances = await prisma.attendance.findMany({
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
    const body = await req.json();
    const { employeeId, actionType, timestamp, notes, dateOffsetDays } = body;

    const emp = await prisma.employee.findFirst({
      where: { OR: [{ id: employeeId }, { employeeIdCode: employeeId }] },
    });

    if (!emp) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const logDate = dateOffsetDays ? new Date(Date.now() - 86400000 * dateOffsetDays) : new Date();

    if (actionType === "PUNCH_IN") {
      const att = await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: logDate,
          punchIn: logDate,
          status: "PRESENT",
          totalMinutes: 480,
        },
      });

      await prisma.employeeStatusEvent.create({
        data: {
          employeeId: emp.id,
          statusType: "WORKING",
          startedAt: logDate,
          notes: notes || "Punched in for daily sprint tasks",
        },
      });

      return NextResponse.json({ success: true, data: att });
    } else if (actionType === "PUNCH_OUT") {
      const att = await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: logDate,
          punchIn: new Date(logDate.getTime() - 28800000),
          punchOut: logDate,
          status: "PRESENT",
          totalMinutes: 480,
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
