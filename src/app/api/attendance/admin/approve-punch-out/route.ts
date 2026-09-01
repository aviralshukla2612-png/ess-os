import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { attendanceId, action } = body;
    const adminId = authRes.id;

    if (!attendanceId || !action) {
      return NextResponse.json({ success: false, error: "attendanceId and action are required" }, { status: 400 });
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
      
      // Calculate true worked minutes excluding breaks (similar to normal punch out)
      const breakEvents = await prisma.employeeStatusEvent.findMany({
        where: {
          employeeId: attendance.employeeId,
          startedAt: { gte: attendance.punchIn },
          statusType: { not: "WORKING" }
        }
      });
      let totalBreakMinutes = 0;
      for (const b of breakEvents) {
        const end = b.endedAt || punchOutTime;
        const diffMs = end.getTime() - b.startedAt.getTime();
        totalBreakMinutes += Math.floor(diffMs / 60000);
      }
      const elapsedMs = punchOutTime.getTime() - attendance.punchIn.getTime();
      const workedMinutes = Math.max(0, Math.floor(elapsedMs / 60000) - totalBreakMinutes);

      // Atomic conditional update wrapped in a transaction
      try {
        await prisma.$transaction(async (tx) => {
          const { count } = await tx.attendance.updateMany({
            where: { id: attendanceId, punchOutRequestStatus: "PENDING" },
            data: {
              punchOutRequestStatus: "APPROVED",
              punchOutApprovedById: adminId,
              punchOut: punchOutTime,
              totalMinutes: workedMinutes,
              status: "COMPLETED" // Status completed upon approval
            }
          });
          
          if (count === 0) {
            throw new Error("Concurrency conflict: Request is no longer PENDING.");
          }

          // Close open EmployeeStatusEvents
          await tx.employeeStatusEvent.updateMany({
            where: { 
              employeeId: attendance.employeeId, 
              endedAt: null,
              startedAt: { lte: punchOutTime }
            },
            data: { endedAt: punchOutTime }
          });
        });
      } catch (err: any) {
        if (err.message.includes("Concurrency conflict")) {
          return NextResponse.json({ success: false, error: err.message }, { status: 409 });
        }
        throw err;
      }

      return NextResponse.json({ success: true, message: "Punch out approved" });
    } else if (action === "REJECT") {
      const { count } = await prisma.attendance.updateMany({
        where: { id: attendanceId, punchOutRequestStatus: "PENDING" },
        data: {
          punchOutRequestStatus: "REJECTED",
          punchOutApprovedById: adminId,
          // They remain punched in and WORKING
        }
      });

      if (count === 0) {
        return NextResponse.json({ success: false, error: "Concurrency conflict: Request is no longer PENDING." }, { status: 409 });
      }
      
      return NextResponse.json({ success: true, message: "Punch out rejected" });
    } else {
      return NextResponse.json({ success: false, error: "Invalid action. Use APPROVE or REJECT." }, { status: 400 });
    }

  } catch (error) {
    console.error("Approve Punch Out Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process punch out request" }, { status: 500 });
  }
}
