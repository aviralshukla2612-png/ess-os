import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, action, statusType, notes } = body;

    if (!employeeId || !action) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
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
        const updated = await prisma.employeeStatusEvent.update({
          where: { id: openEvent.id },
          data: { endedAt: new Date() }
        });
        return NextResponse.json({ success: true, data: updated });
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
