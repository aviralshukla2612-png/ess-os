import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AttendanceService, AttendanceServiceError } from "@/lib/attendance/attendanceService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing employee ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const result = await AttendanceService.getEmployeeHistory(
      id,
      { startDate, endDate, page, limit },
      user
    );

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    if (error instanceof AttendanceServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error("[API /api/attendance/employees/[id] GET Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch employee attendance history" }, { status: 500 });
  }
}
