import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET() {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const holidays = await prisma.companyHoliday.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json({ success: true, data: holidays });
  } catch (error) {
    console.error("Fetch Holidays Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { title, date, description } = body;

    if (!title || !date) {
      return NextResponse.json({ success: false, error: "Title and date are required" }, { status: 400 });
    }

    const holiday = await prisma.companyHoliday.create({
      data: {
        title,
        date: new Date(date),
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, data: holiday });
  } catch (error) {
    console.error("Create Holiday Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create holiday" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing holiday id" }, { status: 400 });
    }

    await prisma.companyHoliday.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Delete Holiday Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete holiday" }, { status: 500 });
  }
}
