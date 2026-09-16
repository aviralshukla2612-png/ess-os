import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: params.id },
          { employeeIdCode: params.id },
          { userId: params.id },
          { memberships: { some: { id: params.id } } },
        ],
      },
      include: {
        user: true,
        attendances: { orderBy: { date: 'desc' } },
        statusEvents: { orderBy: { startedAt: 'desc' } },
        workSessions: { include: { project: true }, orderBy: { startedAt: 'desc' } },
      },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    // Permission check: OWNER, the employee themselves, or SUB_ADMIN with relevant permissions
    const isSubAdminAllowed = authRes.activeRole === "SUB_ADMIN" && (
      authRes.subAdminPermissions?.includes("employees") ||
      authRes.subAdminPermissions?.includes("attendance") ||
      authRes.subAdminPermissions?.includes("projects") ||
      false
    );

    if (authRes.activeRole !== "OWNER" && !isSubAdminAllowed && authRes.employeeId !== employee.id) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot access another employee's profile" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireRole(["OWNER"], "employees");
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();

    // Prevent non-owners from creating or modifying Sub-Admins
    if ((body.role === "SUB_ADMIN" || body.subAdminPermissions !== undefined) && authRes.activeRole !== "OWNER") {
      return NextResponse.json({ success: false, error: "Forbidden: Only the Owner can manage Sub-Admin privileges" }, { status: 403 });
    }
    
    const existing = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: params.id },
          { employeeIdCode: params.id },
          { userId: params.id },
          { memberships: { some: { id: params.id } } },
        ],
      },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: existing.id },
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
      if (body.role !== undefined && (body.role !== "SUB_ADMIN" || authRes.activeRole === "OWNER")) {
        userUpdateData.activeRole = body.role;
      }
      if (body.subAdminPermissions !== undefined && authRes.activeRole === "OWNER") {
        userUpdateData.subAdminPermissions = Array.isArray(body.subAdminPermissions)
          ? JSON.stringify(body.subAdminPermissions)
          : (typeof body.subAdminPermissions === "string" ? body.subAdminPermissions : "[]");
      }

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

    // We cannot delete the User record because they might be the "createdBy" on Projects/Leads.
    // Doing so would cascade-delete important company data or fail due to FK constraints.
    // Instead, we delete the Employee profile (which cascades to attendances, memberships) 
    // and soft-delete/deactivate the User account.
    
    await prisma.$transaction([
      prisma.employee.delete({
        where: { id: params.id },
      }),
      prisma.user.update({
        where: { id: employee.userId },
        data: { 
          isActive: false,
          activeRole: "DEACTIVATED",
        }
      }),
      // Remove all specific role assignments
      prisma.userRole.deleteMany({
        where: { userId: employee.userId }
      })
    ]);

    return NextResponse.json({ success: true, data: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete employee" }, { status: 500 });
  }
}

