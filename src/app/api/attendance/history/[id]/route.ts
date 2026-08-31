import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing attendance id" }, { status: 400 });
    }

    // Security check: Only OWNER can delete attendance records
    if (authRes.activeRole !== "OWNER") {
      return NextResponse.json({ success: false, error: "Forbidden: Only owners can delete attendance records" }, { status: 403 });
    }

    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete attendance error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
