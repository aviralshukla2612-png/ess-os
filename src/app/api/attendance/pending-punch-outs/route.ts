import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const pendingRequests = await prisma.attendance.findMany({
      where: {
        punchOutRequestStatus: { not: null }
      },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        punchOutRequestedAt: "desc"
      }
    });

    return NextResponse.json({ success: true, data: pendingRequests });
  } catch (error) {
    console.error("Fetch Pending Punch Outs Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch pending requests" }, { status: 500 });
  }
}
