import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const safeFormatDate = (dateVal: any, fallback = "TBD") => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? fallback : d.toLocaleDateString();
  } catch {
    return fallback;
  }
};

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

    const memberships = project.memberships || [];
    const tasks = project.tasks || [];
    const documents = project.documents || [];
    const changeRequests = project.changeRequests || [];
    const clientUpdates = project.clientUpdates || [];

    const isEmployee = authRes.activeRole === "EMPLOYEE";

    if (isEmployee) {
      const isAssigned = memberships.some(
        (m) =>
          (m.employeeId === authRes.employeeId ||
            m.employeeId === authRes.id ||
            m.employee?.userId === authRes.id) &&
          m.isActive
      );
      if (!isAssigned) {
        return NextResponse.json({ success: false, error: "Forbidden: You are not assigned to this project workspace" }, { status: 403 });
      }
    }

    const tmMembership = memberships.find((m) => (m.roleInProject === "TM" || m.roleInProject === "Tech Lead") && m.isActive);
    const activeTasks = tasks.filter((t) => t.status !== "ARCHIVED");
    const completedTasks = activeTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE");
    const calculatedProgress = activeTasks.length > 0 ? Math.round((completedTasks.length / activeTasks.length) * 100) : (project.progressPercentage || 0);

    const formatted = {
      id: project.id,
      projectCode: project.projectNumber || project.id,
      name: project.name || "Untitled Project",
      clientId: project.clientId,
      clientName: project.client ? project.client.companyName : "Client Account",
      tmId: tmMembership?.employee?.id || "UNASSIGNED",
      tmName: tmMembership?.employee?.user?.name ? `${tmMembership.employee.user.name} (Tech Lead)` : "Unassigned",
      progress: calculatedProgress,
      currentStage: project.status || "PLANNING",
      status: project.status || "PLANNING",
      priority: project.priority || "MEDIUM",
      health: project.priority === "URGENT" || project.priority === "HIGH" ? "AT_RISK" : "ON_TRACK",
      contractValue: isEmployee ? null : (project.contractValue || 0),
      paidValue: isEmployee ? null : 0,
      overdueValue: isEmployee ? null : 0,
      deadline: safeFormatDate(project.targetDeadline, "TBD"),
      targetDeadline: project.targetDeadline,
      stagingUrl: project.stagingUrl || null,
      liveUrl: project.liveUrl || null,
      designUrl: project.designUrl || null,
      scopeItems: project.scopeText ? project.scopeText.split("\n").filter(Boolean) : [],
      teamMembers: memberships.map((m) => ({
        id: m.id,
        membershipId: m.id,
        employeeId: m.employee?.id || m.employeeId,
        name: m.employee?.user?.name || "Team Member",
        email: m.employee?.user?.email || "",
        role: m.roleInProject || "Member",
        active: m.isActive,
        assignedDate: safeFormatDate(m.assignedAt, "Recently"),
        compensationAmount: isEmployee ? null : m.compensationAmount,
      })),
      removalHistory: memberships
        .filter((m) => !m.isActive)
        .map((m) => ({
          id: m.id,
          membershipId: m.id,
          employeeId: m.employee?.id || m.employeeId,
          name: m.employee?.user?.name || "Former Member",
          role: m.roleInProject || "Member",
          removedDate: safeFormatDate(m.removedAt, "Recently"),
          reason: m.removalReason || "Reassigned",
        })),
      tasks: (isEmployee
        ? tasks.filter((t) => t.assignedToId === authRes.id || !t.assignedToId)
        : tasks
      ).map((t) => ({
        id: t.id,
        title: t.title || "Task",
        description: t.description || "",
        assignee: t.assignedTo?.name || "Unassigned",
        assigneeId: t.assignedToId,
        status: t.status || "PLANNING",
        priority: t.priority || "MEDIUM",
        isMostImportant: t.isMostImportant || false,
        deadline: safeFormatDate(t.deadline, null as any),
        targetDeadline: t.deadline,
        completedAt: t.completedAt,
      })),
      livingDocs: documents.map((d) => ({
        id: d.id,
        title: d.title || "Document",
        version: `v${d.version || 1}.0`,
        lastUpdated: safeFormatDate(d.updatedAt, "Recently"),
        author: "Admin",
        content: d.content || "",
      })),
      changeRequests: changeRequests.map((cr) => ({
        id: cr.requestNumber || cr.id,
        title: cr.requestedChange,
        value: isEmployee ? null : cr.costImpactAmount,
        status: cr.status || "PENDING",
        date: safeFormatDate(cr.createdAt, "Recently"),
      })),
      clientUpdates: clientUpdates.map((u) => ({
        id: u.id,
        title: u.title || "Update",
        content: u.content || "",
        authorName: u.author?.name || "Team Member",
        createdAt: u.createdAt,
      })),
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error("GET /api/projects/[id] error:", error?.message || error, error?.stack);
    return NextResponse.json({ success: false, error: error?.message || "Failed to fetch project" }, { status: 500 });
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
