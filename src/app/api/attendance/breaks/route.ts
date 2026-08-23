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
    const { action, statusType, notes } = body;
    const employeeId = authRes.employeeId;

    if (!action) {
      return NextResponse.json({ success: false, error: "Missing action parameter" }, { status: 400 });
    }

    if (action === "START") {
      // End any previously open events just in case
      await prisma.employeeStatusEvent.updateMany({
        where: { employeeId, endedAt: null },
        data: { endedAt: new Date() }
      });

      // Start new break event
      const event = await prisma.employeeStatusEvent.create({
        data: {
          employeeId,
          statusType: statusType || "BREAK",
          notes: notes || null,
        }
      });
      return NextResponse.json({ success: true, data: event });

    } else if (action === "END") {
      // Find the most recent open event and close it
      const openEvent = await prisma.employeeStatusEvent.findFirst({
        where: { employeeId, endedAt: null },
        orderBy: { startedAt: 'desc' }
      });

      if (openEvent) {
        const [updated, newWorkEvent] = await prisma.$transaction([
          prisma.employeeStatusEvent.update({
            where: { id: openEvent.id },
            data: { endedAt: new Date() }
          }),
          prisma.employeeStatusEvent.create({
            data: {
              employeeId,
              statusType: "WORKING",
              startedAt: new Date(),
              notes: "Resumed work after break"
            }
          })
        ]);
        return NextResponse.json({ success: true, data: updated, newEvent: newWorkEvent });
      } else {
        return NextResponse.json({ success: true, message: "No open event found" });
      }
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Break Event API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process break event" }, { status: 500 });
  }
}
