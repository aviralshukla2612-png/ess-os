import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    // Save token for user, ignoring if it already exists
    await prisma.userFcmToken.upsert({
      where: {
        userId_token: {
          userId: session.user.id,
          token: token,
        },
      },
      update: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        token: token,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save FCM token", error);
    return NextResponse.json({ success: false, error: "Failed to save FCM token" }, { status: 500 });
  }
}
