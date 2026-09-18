import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAndSendNotification } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const projectId = params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Accepts either single employeeId or array employeeIds
    const employeeList: { employeeId: string; role?: string; compensationAmount?: number }[] = [];
    if (Array.isArray(body.employeeIds)) {
      body.employeeIds.forEach((item: any) => {
        if (typeof item === "string") {
          employeeList.push({ employeeId: item, role: body.roleInProject || "Member" });
        } else if (item && item.employeeId) {
          employeeList.push({
            employeeId: item.employeeId,
            role: item.roleInProject || body.roleInProject || "Member",
            compensationAmount: item.compensationAmount ? Number(item.compensationAmount) : undefined,
          });
        }
      });
    } else if (body.employeeId) {
      employeeList.push({
        employeeId: body.employeeId,
        role: body.roleInProject || "Member",
        compensationAmount: body.compensationAmount ? Number(body.compensationAmount) : undefined,
      });
    }

    if (employeeList.length === 0) {
      return NextResponse.json({ success: false, error: "No valid employeeId provided" }, { status: 400 });
    }

    const assignedMembers: any[] = [];

    for (const item of employeeList) {
      const existingMembership = await prisma.projectMembership.findFirst({
        where: {
          projectId,
          employeeId: item.employeeId,
        },
      });

      let membership;
      if (existingMembership) {
        // Reactivate without replacing or deactivating others
        membership = await prisma.projectMembership.update({
          where: { id: existingMembership.id },
          data: {
            isActive: true,
            roleInProject: item.role || existingMembership.roleInProject,
            compensationAmount: item.compensationAmount !== undefined ? item.compensationAmount : existingMembership.compensationAmount,
            removedAt: null,
            removedById: null,
            removalReason: null,
            assignedById: authRes.id,
          },
          include: {
            employee: { include: { user: true } },
          },
        });
      } else {
        membership = await prisma.projectMembership.create({
          data: {
            projectId,
            employeeId: item.employeeId,
            roleInProject: item.role || "Member",
            compensationAmount: item.compensationAmount,
            isActive: true,
            assignedById: authRes.id,
          },
          include: {
            employee: { include: { user: true } },
          },
        });
      }

      // Notify the assigned employee
      if (membership.employee?.userId && membership.employee.userId !== authRes.id) {
        await createAndSendNotification({
          recipientId: membership.employee.userId,
          title: `👥 Added to Team: ${project.name}`,
          message: `You have been assigned to project "${project.name}" as ${membership.roleInProject}.`,
          type: "PROJECT_ASSIGNMENT",
          urgency: "HIGH",
          linkUrl: `/projects/${project.id}`,
        });
      }

      assignedMembers.push(membership);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignedMembers.length} team member(s)`,
      data: assignedMembers,
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/members error:", error);
    return NextResponse.json({ success: false, error: "Failed to assign project members" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const membershipId = searchParams.get("membershipId");
    const employeeId = searchParams.get("employeeId");
    const reason = searchParams.get("reason") || "Reassigned to another project";

    if (!membershipId && !employeeId) {
      return NextResponse.json({ success: false, error: "membershipId or employeeId is required" }, { status: 400 });
    }

    const whereClause: any = { projectId: params.id };
    if (membershipId) whereClause.id = membershipId;
    if (employeeId) whereClause.employeeId = employeeId;

    const existing = await prisma.projectMembership.findFirst({
      where: whereClause,
      include: { employee: { include: { user: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Project membership not found" }, { status: 404 });
    }

    const updated = await prisma.projectMembership.update({
      where: { id: existing.id },
      data: {
        isActive: false,
        removedAt: new Date(),
        removedById: authRes.id,
        removalReason: reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deactivated team member ${existing.employee?.user?.name || "employee"}`,
      data: updated,
    });
  } catch (error) {
    console.error("DELETE /api/projects/[id]/members error:", error);
    return NextResponse.json({ success: false, error: "Failed to deactivate team member" }, { status: 500 });
  }
}
