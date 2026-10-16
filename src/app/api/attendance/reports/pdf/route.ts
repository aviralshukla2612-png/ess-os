import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AttendanceService } from "@/lib/attendance/attendanceService";
import { generateAttendancePdf } from "@/lib/attendance/pdfReportGenerator";
import { getISTDateString } from "@/lib/attendance/dateUtils";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;

    const result = await AttendanceService.listAttendance(
      {
        startDate,
        endDate,
        employeeId,
        departmentId,
        page: 1,
        limit: 100,
        sortBy: "date",
        sortOrder: "desc",
      },
      user
    );

    const records = result.data;
    let totalMinutes = 0;
    let totalLate = 0;

    for (const r of records) {
      totalMinutes += r.totalMinutes || 0;
      if (r.isLate) totalLate++;
    }

    const pdfBuffer = await generateAttendancePdf({
      title: departmentId ? `${departmentId} Department Attendance Report` : "Workforce Attendance & Hours Report",
      generatedBy: `${user.name} (${user.activeRole})`,
      dateRange: startDate && endDate ? `${startDate} to ${endDate}` : `Up to ${getISTDateString()}`,
      summary: {
        totalRecords: records.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalLate,
        department: departmentId || "Entire Company",
      },
      records: records.map((r) => ({
        employeeName: r.employeeName,
        employeeCode: r.employeeCode,
        department: r.department,
        date: r.date,
        punchIn: r.punchIn || "--:--",
        punchOut: r.punchOut || "--:--",
        status: r.status,
        workHours: r.workHours,
      })),
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="attendance-report-${getISTDateString()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[API /api/attendance/reports/pdf Error]:", error);
    const statusCode = typeof error.statusCode === "number" ? error.statusCode : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate attendance report PDF" },
      { status: statusCode }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
