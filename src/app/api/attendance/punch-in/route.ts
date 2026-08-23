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
    const employeeId = authRes.employeeId;

    // Check if the employee already punched in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Look up the real Employee UUID directly from session ID
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
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
