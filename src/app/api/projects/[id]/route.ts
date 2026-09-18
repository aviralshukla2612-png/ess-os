import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.activeRole === "CLIENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: params.id }, { projectNumber: params.id }] },
      include: {
        client: true,
        tasks: {
          include: { assignedTo: true },
          orderBy: { createdAt: "desc" },
        },
        documents: true,
        changeRequests: true,
        clientUpdates: {
          include: { author: true },
          orderBy: { createdAt: "desc" },
        },
        memberships: {
          include: { employee: { include: { user: true } } },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const isEmployee = authRes.activeRole === "EMPLOYEE";

    if (isEmployee) {
      const isAssigned = project.memberships.some((m) => m.employeeId === authRes.employeeId && m.isActive);
      if (!isAssigned) {
        return NextResponse.json({ success: false, error: "Forbidden: You are not assigned to this project workspace" }, { status: 403 });
      }
    }

    const tmMembership = project.memberships.find((m) => (m.roleInProject === "TM" || m.roleInProject === "Tech Lead") && m.isActive);
    const activeTasks = project.tasks.filter((t) => t.status !== "ARCHIVED");
    const completedTasks = activeTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE");
    const calculatedProgress = activeTasks.length > 0 ? Math.round((completedTasks.length / activeTasks.length) * 100) : (project.progressPercentage || 0);

    const formatted = {
      id: project.id,
      projectCode: project.projectNumber,
      name: project.name,
      clientId: project.clientId,
      clientName: project.client ? project.client.companyName : "Client Account",
      tmId: tmMembership?.employee?.id || "UNASSIGNED",
      tmName: tmMembership?.employee?.user?.name ? `${tmMembership.employee.user.name} (Tech Lead)` : "Unassigned",
      progress: calculatedProgress,
      currentStage: project.status,
      status: project.status,
      priority: project.priority,
      health: project.priority === "URGENT" || project.priority === "HIGH" ? "AT_RISK" : "ON_TRACK",
      contractValue: isEmployee ? null : project.contractValue,
      paidValue: isEmployee ? null : 0,
      overdueValue: isEmployee ? null : 0,
      deadline: project.targetDeadline ? new Date(project.targetDeadline).toLocaleDateString() : "TBD",
      targetDeadline: project.targetDeadline,
      stagingUrl: project.stagingUrl || null,
      liveUrl: project.liveUrl || null,
      designUrl: project.designUrl || null,
      scopeItems: project.scopeText ? project.scopeText.split("\n").filter(Boolean) : [],
      teamMembers: project.memberships.map((m) => ({
        id: m.id,
        membershipId: m.id,
        employeeId: m.employee?.id || m.employeeId,
        name: m.employee?.user?.name || "Team Member",
        email: m.employee?.user?.email || "",
        role: m.roleInProject || "Member",
        active: m.isActive,
        assignedDate: new Date(m.assignedAt).toLocaleDateString(),
        compensationAmount: isEmployee ? null : m.compensationAmount,
      })),
      removalHistory: project.memberships
        .filter((m) => !m.isActive)
        .map((m) => ({
          id: m.id,
          membershipId: m.id,
          employeeId: m.employee?.id || m.employeeId,
          name: m.employee?.user?.name || "Former Member",
          role: m.roleInProject,
          removedDate: m.removedAt ? new Date(m.removedAt).toLocaleDateString() : "Recently",
          reason: m.removalReason || "Reassigned",
        })),
      tasks: (isEmployee
        ? project.tasks.filter((t) => t.assignedToId === authRes.id || !t.assignedToId)
        : project.tasks
      ).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assignee: t.assignedTo?.name || "Unassigned",
        assigneeId: t.assignedToId,
        status: t.status,
        priority: t.priority,
        isMostImportant: t.isMostImportant || false,
        deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : null,
        targetDeadline: t.deadline,
        completedAt: t.completedAt,
      })),
      livingDocs: project.documents.map((d) => ({
        id: d.id,
        title: d.title,
        version: `v${d.version}.0`,
        lastUpdated: new Date(d.updatedAt).toLocaleDateString(),
        author: "Admin",
        content: d.content,
      })),
      changeRequests: project.changeRequests.map((cr) => ({
        id: cr.requestNumber,
        title: cr.requestedChange,
        value: isEmployee ? null : cr.costImpactAmount,
        status: cr.status,
        date: new Date(cr.createdAt).toLocaleDateString(),
      })),
      clientUpdates: project.clientUpdates.map((u) => ({
        id: u.id,
        title: u.title,
        content: u.content,
        authorName: u.author?.name || "Team Member",
        createdAt: u.createdAt,
      })),
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const isEmployee = authRes.activeRole === "EMPLOYEE";

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.progressPercentage !== undefined) updateData.progressPercentage = Number(body.progressPercentage);
    if (body.stagingUrl !== undefined) updateData.stagingUrl = body.stagingUrl;
    if (body.liveUrl !== undefined) updateData.liveUrl = body.liveUrl;
    if (body.designUrl !== undefined) updateData.designUrl = body.designUrl;
    if (body.scopeText !== undefined) updateData.scopeText = body.scopeText;
    if (body.targetDeadline !== undefined) {
      updateData.targetDeadline = body.targetDeadline ? new Date(body.targetDeadline) : null;
    }

    // Only non-employees can update contractValue
    if (!isEmployee && body.contractValue !== undefined) {
      updateData.contractValue = Number(body.contractValue) || 0;
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (!["OWNER", "SUB_ADMIN", "SALES"].includes(authRes.activeRole)) {
    return NextResponse.json({ success: false, error: "Forbidden: Not authorized to delete projects" }, { status: 403 });
  }

  try {
    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}
