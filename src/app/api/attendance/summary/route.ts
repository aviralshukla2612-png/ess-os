import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AttendanceService, AttendanceServiceError } from "@/lib/attendance/attendanceService";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || undefined;

    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { success: false, error: "Invalid date format. Expected YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const summary = await AttendanceService.getAttendanceSummary(dateParam, user);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    if (error instanceof AttendanceServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error("[API /api/attendance/summary GET Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to generate attendance summary" }, { status: 500 });
  }
}
