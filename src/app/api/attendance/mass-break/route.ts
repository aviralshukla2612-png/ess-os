import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.activeRole !== "OWNER") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "START_LUNCH") {
      // Find all active WORKING events
      const activeWorkEvents = await prisma.employeeStatusEvent.findMany({
        where: {
          endedAt: null,
          statusType: "WORKING",
        }
      });

      if (activeWorkEvents.length === 0) {
        return NextResponse.json({ success: true, message: "No active employees to put on break." });
      }

      const now = new Date();
      
      // We need to run these updates in a transaction
      await prisma.$transaction(async (tx) => {
        // End all working events
        await tx.employeeStatusEvent.updateMany({
          where: {
            endedAt: null,
            statusType: "WORKING"
          },
          data: {
            endedAt: now
          }
        });

        // Create new Break events for each
        const newBreakEvents = activeWorkEvents.map(event => ({
          employeeId: event.employeeId,
          statusType: "Lunch",
          startedAt: now,
          notes: "Admin Triggered Mass Lunch Break"
        }));

        await tx.employeeStatusEvent.createMany({
          data: newBreakEvents
        });
      });

      return NextResponse.json({ success: true, count: activeWorkEvents.length });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Mass break error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
