import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, reason } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "employeeId is required" }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Look up real employee UUID
    const employee = await prisma.employee.findUnique({
      where: { employeeIdCode: employeeId }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        punchOut: null
      }
    });

    if (!attendance) {
      return NextResponse.json({ success: false, error: "No active punch-in found for today." }, { status: 404 });
    }

    if (attendance.punchOutRequestStatus === "PENDING") {
      return NextResponse.json({ success: false, error: "You already have a pending punch-out request." }, { status: 400 });
    }

    // Calculate hours worked
    const now = new Date();
    const diffMs = now.getTime() - attendance.punchIn.getTime();
    const hoursWorked = diffMs / (1000 * 60 * 60);

    if (hoursWorked >= 8) {
      // Direct punch out
      const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          punchOut: now,
          totalMinutes: Math.floor(diffMs / 60000),
          status: "PRESENT"
        }
      });
      return NextResponse.json({ success: true, directPunchOut: true, data: updated });
    } else {
      // Needs reason and approval
      if (!reason || reason.trim() === "") {
        return NextResponse.json({ success: false, requireReason: true, error: "You have worked less than 8 hours. A reason is required to punch out early." }, { status: 400 });
      }

      const updated = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          punchOutReason: reason,
          punchOutRequestStatus: "PENDING",
          punchOutRequestedAt: now,
        }
      });
      return NextResponse.json({ success: true, directPunchOut: false, data: updated });
    }

  } catch (error) {
    console.error("Punch Out Request Error:", error);
    return NextResponse.json({ success: false, error: "Failed to request punch out" }, { status: 500 });
  }
}
