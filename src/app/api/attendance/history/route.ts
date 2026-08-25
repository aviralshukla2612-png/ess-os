import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employeeId = req.nextUrl.searchParams.get("employeeId") || authRes.employeeId;
    const startDateParam = req.nextUrl.searchParams.get("startDate");
    const endDateParam = req.nextUrl.searchParams.get("endDate");

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Missing employeeId" }, { status: 400 });
    }

    // Security check: Only OWNER can view other employees' histories
    if (authRes.activeRole !== "OWNER" && authRes.employeeId !== employeeId) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot view another employee's history" }, { status: 403 });
    }

    let dateFilter: any = {};
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);

      dateFilter = {
        gte: start,
        lte: end,
      };
    }
    
    const whereClause: any = {};
    if (dateFilter && Object.keys(dateFilter).length > 0) {
      whereClause.date = dateFilter;
    }
    if (employeeId !== "ALL") {
      whereClause.employeeId = employeeId;
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ success: true, data: attendanceRecords });

  } catch (error) {
    console.error("Fetch attendance history error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
