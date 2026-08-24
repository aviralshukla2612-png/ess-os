import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employee = await prisma.employee.findFirst({
      where: { OR: [{ id: params.id }, { employeeIdCode: params.id }] },
      include: {
        user: true,
        attendances: true,
        workSessions: { include: { project: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    // IDOR Protection: Only OWNER or the employee themselves can access this profile
    if (authRes.activeRole !== "OWNER" && authRes.employeeId !== employee.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot access another employee's profile" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    
    const existing = await prisma.employee.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: params.id },
        data: {
          salaryMonthly: body.salaryMonthly !== undefined ? Number(body.salaryMonthly) : undefined,
          status: body.status,
        },
      });

      const userUpdateData: any = {};
      if (body.name) userUpdateData.name = body.name;
      if (body.designation) userUpdateData.designation = body.designation;
      if (body.department) userUpdateData.department = body.department;
      if (body.isActive !== undefined) userUpdateData.isActive = body.isActive;

      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userUpdateData,
        });
      }

      return await tx.employee.findUnique({
        where: { id: params.id },
        include: { user: true }
      });
    });

    if (updatedEmployee && updatedEmployee.user) {
      const { passwordHash, ...safeUser } = updatedEmployee.user;
      (updatedEmployee as any).user = safeUser;
    }

    return NextResponse.json({ success: true, data: updatedEmployee });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    // Since Employee deletes cascade from User, deleting the User cleans up everything cleanly.
    await prisma.user.delete({
      where: { id: employee.userId },
    });

    return NextResponse.json({ success: true, data: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete employee" }, { status: 500 });
  }
}

