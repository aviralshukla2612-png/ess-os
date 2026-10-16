import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AttendanceService, AttendanceServiceError } from "@/lib/attendance/attendanceService";
import { MonthlyQuerySchema } from "@/lib/attendance/types";
import { getISTDateString } from "@/lib/attendance/dateUtils";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { searchParams } = new URL(req.url);
    const currentDateIST = getISTDateString();
    const [currentYearStr, currentMonthStr] = currentDateIST.split("-");

    const rawQuery = {
      month: searchParams.get("month") || currentMonthStr,
      year: searchParams.get("year") || currentYearStr,
      employeeId: searchParams.get("employeeId") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      status: searchParams.get("status") || "ALL",
    };

    const parseResult = MonthlyQuerySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const report = await AttendanceService.getMonthlyReport(parseResult.data, user);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    if (error instanceof AttendanceServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error("[API /api/attendance/monthly GET Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to generate monthly attendance report" }, { status: 500 });
  }
}
