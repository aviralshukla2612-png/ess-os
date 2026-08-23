import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Simple query to verify DB is reachable
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "ok",
      database: "ok"
    }, { status: 200 });
  } catch (error) {
    console.error("Health check failed");
    return NextResponse.json({
      status: "error",
      database: "error"
    }, { status: 503 });
  }
}
