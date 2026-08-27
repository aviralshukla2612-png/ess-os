import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== "OWNER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { action, rejectionReason } = await req.json();

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
    });

    if (!leaveRequest) {
      return NextResponse.json({ success: false, error: "Leave request not found" }, { status: 404 });
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json({ success: false, error: "Leave request is already processed" }, { status: 400 });
    }

    if (action === "APPROVE") {
      // Find employee to update used balance
      const employee = await prisma.employee.findUnique({
        where: { id: leaveRequest.employeeId }
      });

      if (!employee) {
        return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
      }

      const updateData: any = {};
      if (leaveRequest.leaveType === "SICK") {
        updateData.sickLeaveUsed = employee.sickLeaveUsed + leaveRequest.days;
      } else if (leaveRequest.leaveType === "CASUAL") {
        updateData.casualLeaveUsed = employee.casualLeaveUsed + leaveRequest.days;
      } else if (leaveRequest.leaveType === "PAID") {
        updateData.paidLeaveUsed = employee.paidLeaveUsed + leaveRequest.days;
      }

      await prisma.$transaction([
        prisma.leaveRequest.update({
          where: { id: params.id },
          data: {
            status: "APPROVED",
            approvedById: session.user.id,
            approvedAt: new Date()
          }
        }),
        prisma.employee.update({
          where: { id: leaveRequest.employeeId },
          data: updateData
        })
      ]);
    } else if (action === "REJECT") {
      await prisma.leaveRequest.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || null,
          approvedById: session.user.id, // we can store who rejected it here as well
          approvedAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true, message: `Leave request ${action.toLowerCase()}d` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
