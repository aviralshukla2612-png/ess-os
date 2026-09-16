import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: authRes.id,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: authRes.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 });
  }
}
