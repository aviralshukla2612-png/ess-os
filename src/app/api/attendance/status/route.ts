import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employeeIdCode = req.nextUrl.searchParams.get("employeeId");

    if (!employeeIdCode) {
      return NextResponse.json({ success: false, error: "Missing employeeId" }, { status: 400 });
    }

    // Look up the real Employee by UUID or employeeIdCode
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: employeeIdCode },
          { employeeIdCode: employeeIdCode }
        ]
      }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    if (authRes.activeRole !== "OWNER" && authRes.employeeId !== employee.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot view another employee's status" }, { status: 403 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      orderBy: {
        punchIn: 'desc'
      }
    });

    if (!attendance) {
      return NextResponse.json({ success: true, data: { status: "NOT_PUNCHED_IN" } });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        status: attendance.punchOut ? "DAY_COMPLETE" : "WORKING",
        punchOutRequestStatus: attendance.punchOutRequestStatus, // PENDING, APPROVED, REJECTED, or null
        punchOut: attendance.punchOut,
      } 
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
