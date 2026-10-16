import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AttendanceService, AttendanceServiceError } from "@/lib/attendance/attendanceService";
import { AttendanceQuerySchema, CheckInSchema } from "@/lib/attendance/types";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { searchParams } = new URL(req.url);
    const rawQuery: Record<string, any> = {};

    for (const [key, value] of searchParams.entries()) {
      if (value !== undefined && value !== "") {
        rawQuery[key] = value;
      }
    }

    const parseResult = AttendanceQuerySchema.safeParse(rawQuery);
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

    const result = await AttendanceService.listAttendance(parseResult.data, user);

    // Keep backwards compatibility for any client expecting "name"
    const backwardsCompatibleData = result.data.map((item) => ({
      ...item,
      name: item.employeeName,
    }));

    return NextResponse.json({
      success: true,
      data: backwardsCompatibleData,
      pagination: result.pagination,
    });
  } catch (error: any) {
    if (error instanceof AttendanceServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error("[API /api/attendance GET Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch attendance records" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const body = await req.json().catch(() => ({}));
    const actionType = body.actionType;

    // Standardized check-in / check-out routing
    if (actionType === "PUNCH_IN" || !actionType) {
      const parsed = CheckInSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: "Validation Error", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const data = await AttendanceService.checkIn(user, parsed.data);
      return NextResponse.json({ success: true, data });
    } else if (actionType === "PUNCH_OUT") {
      const data = await AttendanceService.checkOut(user, {
        reason: body.notes || body.reason || "Punched out via API",
      });
      return NextResponse.json({ success: true, data });
    } else if (actionType === "BREAK") {
      if (!user.employeeId) {
        return NextResponse.json({ success: false, error: "Not associated with an employee profile" }, { status: 403 });
      }
      const evt = await prisma.employeeStatusEvent.create({
        data: {
          employeeId: user.employeeId,
          statusType: body.breakType || "BREAK",
          startedAt: new Date(),
          notes: body.notes || body.breakReason || "Tea / Lunch break",
        },
      });
      return NextResponse.json({ success: true, data: evt });
    } else if (actionType === "RESUME") {
      if (!user.employeeId) {
        return NextResponse.json({ success: false, error: "Not associated with an employee profile" }, { status: 403 });
      }
      // End active breaks
      await prisma.employeeStatusEvent.updateMany({
        where: {
          employeeId: user.employeeId,
          endedAt: null,
          statusType: { not: "WORKING" },
        },
        data: { endedAt: new Date() },
      });
      const evt = await prisma.employeeStatusEvent.create({
        data: {
          employeeId: user.employeeId,
          statusType: "WORKING",
          startedAt: new Date(),
          notes: body.task || "Resumed work sprint",
        },
      });
      return NextResponse.json({ success: true, data: evt });
    }

    return NextResponse.json({ success: false, error: `Unsupported actionType: ${actionType}` }, { status: 400 });
  } catch (error: any) {
    if (error instanceof AttendanceServiceError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }
    console.error("[API /api/attendance POST Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to record attendance action" }, { status: 500 });
  }
}
