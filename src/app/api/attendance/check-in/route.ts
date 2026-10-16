import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AttendanceService, AttendanceServiceError } from "@/lib/attendance/attendanceService";
import { CheckInSchema } from "@/lib/attendance/types";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    // Check device header (desktop/laptop requirement)
    const userAgent = req.headers.get("user-agent") || "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
    if (isMobile) {
      return NextResponse.json(
        {
          success: false,
          error: "Punch In restricted: You must use a laptop or desktop computer to punch in.",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = CheckInSchema.safeParse(body);
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

    const data = await AttendanceService.checkIn(user, parseResult.data);

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
    console.error("[API /api/attendance/check-in POST Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to process check-in" }, { status: 500 });
  }
}
