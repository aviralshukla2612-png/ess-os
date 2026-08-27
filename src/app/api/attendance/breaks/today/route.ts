import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysBreaks = await prisma.employeeStatusEvent.findMany({
      where: {
        startedAt: {
          gte: today,
        },
        statusType: {
          in: ["BREAK", "Lunch", "Tea", "LUNCH", "TEA_BREAK"]
        }
      },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc' // Order descending so first one is latest
      }
    });

    return NextResponse.json({ success: true, data: todaysBreaks });
  } catch (error) {
    console.error("Fetch Today Breaks Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch today's breaks" }, { status: 500 });
  }
}
