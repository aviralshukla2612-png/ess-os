import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const authRes = await requireRole(["OWNER", "ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { user: { name: 'asc' } }
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { 
      employeeId, 
      sickLeaveTotal, casualLeaveTotal, paidLeaveTotal,
      sickLeaveUsed, casualLeaveUsed, paidLeaveUsed
    } = body;

    if (!employeeId) {
      return NextResponse.json({ success: false, error: "Employee ID is required" }, { status: 400 });
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        sickLeaveTotal: sickLeaveTotal !== undefined ? Number(sickLeaveTotal) : undefined,
        casualLeaveTotal: casualLeaveTotal !== undefined ? Number(casualLeaveTotal) : undefined,
        paidLeaveTotal: paidLeaveTotal !== undefined ? Number(paidLeaveTotal) : undefined,
        sickLeaveUsed: sickLeaveUsed !== undefined ? Number(sickLeaveUsed) : undefined,
        casualLeaveUsed: casualLeaveUsed !== undefined ? Number(casualLeaveUsed) : undefined,
        paidLeaveUsed: paidLeaveUsed !== undefined ? Number(paidLeaveUsed) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "ADMIN"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { sickLeaveTotal, casualLeaveTotal, paidLeaveTotal } = body;

    const updated = await prisma.employee.updateMany({
      data: {
        sickLeaveTotal: sickLeaveTotal !== undefined ? Number(sickLeaveTotal) : undefined,
        casualLeaveTotal: casualLeaveTotal !== undefined ? Number(casualLeaveTotal) : undefined,
        paidLeaveTotal: paidLeaveTotal !== undefined ? Number(paidLeaveTotal) : undefined,
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
