import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { notificationIds, all } = body;
    
    if (all) {
      await prisma.notification.updateMany({
        where: {
          recipientId: authRes.id,
          isRead: false,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        recipientId: authRes.id,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
