import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { attendanceId, action, adminId } = body;

    if (!attendanceId || !action || !adminId) {
      return NextResponse.json({ success: false, error: "attendanceId, action, and adminId are required" }, { status: 400 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });

    if (!attendance) {
      return NextResponse.json({ success: false, error: "Attendance record not found" }, { status: 404 });
    }

    if (attendance.punchOutRequestStatus !== "PENDING") {
      return NextResponse.json({ success: false, error: "This request is not pending." }, { status: 400 });
    }

    if (action === "APPROVE") {
      const punchOutTime = attendance.punchOutRequestedAt || new Date();
      const diffMs = punchOutTime.getTime() - attendance.punchIn.getTime();
      
      const updated = await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
          punchOutRequestStatus: "APPROVED",
          punchOutApprovedById: adminId,
          punchOut: punchOutTime,
          totalMinutes: Math.floor(diffMs / 60000),
          status: "PRESENT" // or HALF_DAY based on minutes if desired
        }
      });
      return NextResponse.json({ success: true, data: updated });
    } else if (action === "REJECT") {
      const updated = await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
          punchOutRequestStatus: "REJECTED",
          punchOutApprovedById: adminId,
          // They remain punched in
        }
      });
      return NextResponse.json({ success: true, data: updated });
    } else {
      return NextResponse.json({ success: false, error: "Invalid action. Use APPROVE or REJECT." }, { status: 400 });
    }

  } catch (error) {
    console.error("Approve Punch Out Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process punch out request" }, { status: 500 });
  }
}
