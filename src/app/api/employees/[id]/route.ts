import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch employee" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        salaryMonthly: body.salaryMonthly,
        status: body.status,
      },
      include: { user: true },
    });

    if (body.name || body.designation || body.department) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: {
          name: body.name,
          designation: body.designation,
          department: body.department,
        },
      });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const emp = await prisma.employee.findUnique({ where: { id: params.id } });
    if (emp) {
      await prisma.user.delete({ where: { id: emp.userId } });
    }

    return NextResponse.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete employee" }, { status: 500 });
  }
}
