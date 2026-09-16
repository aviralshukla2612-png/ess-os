import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const authRes = await requireAuth();
    if (authRes instanceof NextResponse) return authRes;

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    try {
      // Save token for user, ignoring if it already exists
      await prisma.userFcmToken.upsert({
        where: {
          userId_token: {
            userId: authRes.id,
            token: token,
          },
        },
        update: {
          userId: authRes.id,
        },
        create: {
          userId: authRes.id,
          token: token,
        },
      });
    } catch (dbErr: any) {
      console.warn("UserFcmToken storage warning (sync database via prisma db push):", dbErr?.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save FCM token", error);
    return NextResponse.json({ success: false, error: "Failed to save FCM token" }, { status: 500 });
  }
}
