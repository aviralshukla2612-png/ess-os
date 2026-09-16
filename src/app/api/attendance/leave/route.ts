import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { notifyAdmins } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    let leaves: any[] = [];
    let employeeBalances = null;

    if (employeeId) {
      // Get for specific employee
      leaves = await prisma.leaveRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
        include: {
          approvedBy: { select: { name: true } }
        }
      });
      employeeBalances = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          sickLeaveTotal: true, sickLeaveUsed: true,
          casualLeaveTotal: true, casualLeaveUsed: true,
          paidLeaveTotal: true, paidLeaveUsed: true,
        }
      });
    } else if (session.user.role === "OWNER") {
      // Get all for owner
      leaves = await prisma.leaveRequest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            include: { user: { select: { name: true, email: true, avatarUrl: true } } }
          },
          approvedBy: { select: { name: true } }
        }
      });
    }

    return NextResponse.json({ success: true, data: { leaves, balances: employeeBalances } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId, leaveType, startDate, endDate, days, reason } = await req.json();

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const newLeave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        days: parseFloat(days),
        reason
      }
    });

    // Notify all admins/owners about the new leave application
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true }
    });
    const empName = employee?.user?.name || "An employee";
    notifyAdmins({
      title: `📅 New Leave Request: ${empName}`,
      message: `${empName} applied for ${days} day(s) of ${leaveType} leave. Reason: "${reason}".`,
      linkUrl: "/attendance",
      type: "LEAVE_REQUEST",
      urgency: "HIGH",
      metadata: {
        employeeId,
        leaveType,
        days: String(days),
        reason,
      }
    }).catch((err) => console.error("Admin notification error on leave request:", err));

    return NextResponse.json({ success: true, data: newLeave });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
