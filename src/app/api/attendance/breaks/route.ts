import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { notifyAdmins, formatToIST } from "@/lib/notifications";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (!authRes.employeeId) {
    return NextResponse.json({ success: false, error: "Forbidden: No employee profile linked" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, statusType, notes } = body;
    const employeeId = authRes.employeeId;

    if (!action) {
      return NextResponse.json({ success: false, error: "Missing action parameter" }, { status: 400 });
    }

    // Look up real employee UUID with user details
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: employeeId },
          { employeeIdCode: employeeId }
        ]
      },
      include: {
        user: true,
      }
    });
    
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee profile not found" }, { status: 404 });
    }

    const empName = employee.user?.name || "An employee";
    const timeFormatted = formatToIST();

    if (action === "START") {
      // End any previously open events just in case
      await prisma.employeeStatusEvent.updateMany({
        where: { employeeId: employee.id, endedAt: null },
        data: { endedAt: new Date() }
      });

      // Start new break event
      const event = await prisma.employeeStatusEvent.create({
        data: {
          employeeId: employee.id,
          statusType: statusType || "BREAK",
          notes: notes || null,
        }
      });

      // Notify admins
      const breakLabel = (statusType || "break").replace(/_/g, " ").toLowerCase();
      notifyAdmins({
        title: `☕ Break Started: ${empName}`,
        message: `${empName} started a ${breakLabel}${notes ? ` ("${notes}")` : ""} at ${timeFormatted}.`,
        linkUrl: "/attendance",
        type: "BREAK_START",
        metadata: {
          employeeId: employee.id,
          employeeName: empName,
          statusType: statusType || "BREAK",
          time: timeFormatted,
        },
      }).catch((err) => console.error("Admin notification error on break start:", err));

      return NextResponse.json({ success: true, data: event });

    } else if (action === "END") {
      // Close ALL open events to clean up any duplicates
      const openEventsCount = await prisma.employeeStatusEvent.count({
        where: { employeeId: employee.id, endedAt: null }
      });

      let responsePayload;
      if (openEventsCount > 0) {
        const [updated, newWorkEvent] = await prisma.$transaction([
          prisma.employeeStatusEvent.updateMany({
            where: { employeeId: employee.id, endedAt: null },
            data: { endedAt: new Date() }
          }),
          prisma.employeeStatusEvent.create({
            data: {
              employeeId: employee.id,
              statusType: "WORKING",
              startedAt: new Date(),
              notes: "Resumed work after break"
            }
          })
        ]);
        responsePayload = { success: true, data: updated, newEvent: newWorkEvent };
      } else {
        const newWorkEvent = await prisma.employeeStatusEvent.create({
          data: {
            employeeId: employee.id,
            statusType: "WORKING",
            startedAt: new Date(),
            notes: "Resumed work after break"
          }
        });
        responsePayload = { success: true, newEvent: newWorkEvent };
      }

      // Notify admins
      notifyAdmins({
        title: `▶️ Work Resumed: ${empName}`,
        message: `${empName} finished their break and resumed work at ${timeFormatted}.`,
        linkUrl: "/attendance",
        type: "BREAK_END",
        metadata: {
          employeeId: employee.id,
          employeeName: empName,
          time: timeFormatted,
        },
      }).catch((err) => console.error("Admin notification error on break end:", err));

      return NextResponse.json(responsePayload);
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Break Event API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process break event" }, { status: 500 });
  }
}
