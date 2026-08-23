import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const activeBreaks = await prisma.employeeStatusEvent.findMany({
      where: {
        endedAt: null,
      },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, data: activeBreaks });
  } catch (error) {
    console.error("Fetch Active Breaks Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch active breaks" }, { status: 500 });
  }
}
