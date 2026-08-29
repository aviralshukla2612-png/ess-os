import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const unread = await prisma.notification.findMany({
      where: {
        recipientId: authRes.id,
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: unread });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
