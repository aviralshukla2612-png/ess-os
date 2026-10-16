import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AttendanceAnalyticsOrchestrator } from "@/lib/attendance/ai/orchestrator";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    const body = await req.json().catch(() => ({}));
    const question = body.message || body.question;

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'message' in request body." },
        { status: 400 }
      );
    }

    const response = await AttendanceAnalyticsOrchestrator.processQuestion(question, user);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[API /api/attendance/analytics Error]:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error in Analytics Assistant" },
      { status: 500 }
    );
  }
}
