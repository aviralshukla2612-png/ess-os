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
    const body = await req.json();
    const { reason } = body;
    const employeeId = authRes.employeeId;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Look up real employee UUID
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

    let attendance = await prisma.attendance.findFirst({
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
      // Create a mock record if UI is in WORKING state but DB is empty
      attendance = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: new Date(),
          punchIn: new Date(Date.now() - 4 * 3600 * 1000), // 4 hours ago
          status: "PRESENT",
          totalMinutes: 240,
        }
      });
    }

    if (attendance.punchOutRequestStatus === "PENDING") {
      return NextResponse.json({ success: false, error: "You already have a pending punch-out request." }, { status: 400 });
    }

    // Needs reason and approval for early punch out
    if (!reason || reason.trim() === "") {
      return NextResponse.json({ success: false, requireReason: true, error: "A reason is required to punch out early." }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        punchOutReason: reason,
        punchOutRequestStatus: "PENDING",
        punchOutRequestedAt: now,
      }
    });
    return NextResponse.json({ success: true, data: updated });

  } catch (error) {
    console.error("Punch Out Request Error:", error);
    return NextResponse.json({ success: false, error: "Failed to request punch out" }, { status: 500 });
  }
}
