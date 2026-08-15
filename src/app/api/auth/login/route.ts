import { NextResponse } from "next/server";
import { verifyUserCredentials } from "@/lib/authService";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const session = await verifyUserCredentials(email, password || "password");
    if (!session) {
      return NextResponse.json({ success: false, error: "Invalid credentials or account inactive" }, { status: 401 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Authentication server error" }, { status: 500 });
  }
}
