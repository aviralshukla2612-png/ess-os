import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "employeeId is required" }, { status: 400 });
    }

    // Check if the employee already punched in today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Look up the real Employee UUID
    const employee = await prisma.employee.findUnique({
      where: { employeeIdCode: employeeId }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
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

    // Create new attendance
    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        punchIn: new Date(),
        date: new Date(),
      }
    });

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    console.error("Punch In Error:", error);
    return NextResponse.json({ success: false, error: "Failed to punch in" }, { status: 500 });
  }
}
