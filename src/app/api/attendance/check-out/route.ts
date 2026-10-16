import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AttendanceService, AttendanceServiceError } from "@/lib/attendance/attendanceService";
import { CheckOutSchema } from "@/lib/attendance/types";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const body = await req.json().catch(() => ({}));
    const parseResult = CheckOutSchema.safeParse(body);
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

    const data = await AttendanceService.checkOut(user, parseResult.data);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    if (error instanceof AttendanceServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error("[API /api/attendance/check-out POST Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to process check-out" }, { status: 500 });
  }
}
