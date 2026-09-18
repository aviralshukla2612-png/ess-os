import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAndSendNotification } from "@/lib/notifications";

export async function GET() {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.activeRole === "CLIENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let whereClause: any = {};
  if (authRes.activeRole === "EMPLOYEE") {
    if (!authRes.employeeId) {
      return NextResponse.json({ success: false, error: "Forbidden: No employee profile linked" }, { status: 403 });
    }
    whereClause = {
      memberships: {
        some: { employeeId: authRes.employeeId, isActive: true },
      },
    };
  }

  try {
    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        memberships: {
          include: {
            employee: {
              include: { user: true },
            },
          },
        },
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
      },
    });

    const isEmployee = authRes.activeRole === "EMPLOYEE";

    const formatted = projects.map((p) => {
      const tmMembership = p.memberships.find((m) => (m.roleInProject === "TM" || m.roleInProject === "Tech Lead") && m.isActive);
      const activeTasks = p.tasks.filter((t) => t.status !== "ARCHIVED");
      const completedTasks = activeTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE");
      const calculatedProgress = activeTasks.length > 0 ? Math.round((completedTasks.length / activeTasks.length) * 100) : (p.progressPercentage || 0);

      return {
        id: p.id,
        projectCode: p.projectNumber,
        name: p.name,
        clientId: p.clientId,
        clientName: p.client ? p.client.companyName : "Client Account",
        tmId: tmMembership?.employee?.id || "UNASSIGNED",
        tmName: tmMembership?.employee?.user?.name ? `${tmMembership.employee.user.name} (Tech Lead)` : "Unassigned",
        progress: calculatedProgress,
        currentStage: p.status,
        status: p.status,
        priority: p.priority,
        health: p.priority === "URGENT" || p.priority === "HIGH" ? "AT_RISK" : "ON_TRACK",
        // Strict privacy rule: Financial contract values hidden from employees
        contractValue: isEmployee ? null : p.contractValue,
        paidValue: isEmployee ? null : 0,
        overdueValue: isEmployee ? null : 0,
        deadline: p.targetDeadline ? new Date(p.targetDeadline).toLocaleDateString() : "TBD",
        targetDeadline: p.targetDeadline,
        stagingUrl: p.stagingUrl || null,
        liveUrl: p.liveUrl || null,
        designUrl: p.designUrl || null,
        scopeItems: p.scopeText ? p.scopeText.split("\n").filter(Boolean) : [],
        teamMembers: p.memberships.map((m) => ({
          id: m.id,
          employeeId: m.employee?.id || m.employeeId,
          name: m.employee?.user?.name || "Team Member",
          email: m.employee?.user?.email || "",
          role: m.roleInProject || "Member",
          active: m.isActive,
          assignedDate: new Date(m.assignedAt).toLocaleDateString(),
          compensationAmount: isEmployee ? null : m.compensationAmount,
        })),
        removalHistory: p.memberships
          .filter((m) => !m.isActive)
          .map((m) => ({
            id: m.id,
            employeeId: m.employee?.id || m.employeeId,
            name: m.employee?.user?.name || "Former Member",
            role: m.roleInProject,
            removedDate: m.removedAt ? new Date(m.removedAt).toLocaleDateString() : "Recently",
            reason: m.removalReason || "Reassigned",
          })),
        tasks: (isEmployee
          ? p.tasks.filter((t) => t.assignedToId === authRes.id || !t.assignedToId)
          : p.tasks
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
          completedAt: t.completedAt,
        })),
        livingDocs: p.documents.map((d) => ({
          id: d.id,
          title: d.title,
          version: `v${d.version}.0`,
          lastUpdated: new Date(d.updatedAt).toLocaleDateString(),
          author: "Admin",
          content: d.content,
        })),
        changeRequests: p.changeRequests.map((cr) => ({
          id: cr.requestNumber,
          title: cr.requestedChange,
          value: isEmployee ? null : cr.costImpactAmount,
          status: cr.status,
          date: new Date(cr.createdAt).toLocaleDateString(),
        })),
        clientUpdates: p.clientUpdates.map((u) => ({
          id: u.id,
          title: u.title,
          content: u.content,
          authorName: u.author?.name || "Team Member",
          createdAt: u.createdAt,
        })),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  // Allow OWNER, SUB_ADMIN, SALES, EMPLOYEE
  if (!["OWNER", "SUB_ADMIN", "SALES", "EMPLOYEE"].includes(authRes.activeRole)) {
    return NextResponse.json({ success: false, error: "Forbidden: Role not authorized" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // 1. Handle or Auto-generate Client
    let targetClientId = body.clientId;
    if (!targetClientId && body.clientName) {
      let existingClient = await prisma.client.findFirst({
        where: { companyName: { equals: body.clientName.trim() } },
      });
      if (!existingClient) {
        const clientCount = await prisma.client.count();
        existingClient = await prisma.client.create({
          data: {
            clientNumber: `CLT-2026-${String(clientCount + 101).padStart(3, "0")}`,
            companyName: body.clientName.trim(),
            phone: "+91 98000 00000",
            email: `contact@${body.clientName.toLowerCase().replace(/[^a-z0-9]/g, "") || "client"}.com`,
            createdById: authRes.id,
          },
        });
      }
      targetClientId = existingClient.id;
    } else if (!targetClientId) {
      const firstClient = await prisma.client.findFirst();
      if (firstClient) {
        targetClientId = firstClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: {
            clientNumber: "CLT-2026-001",
            companyName: "Default Client Account",
            phone: "+91 98000 00000",
            email: "contact@client.com",
            createdById: authRes.id,
          },
        });
        targetClientId = newClient.id;
      }
    }

    // 2. Generate unique project number
    const projectCount = await prisma.project.count();
    const uniqueCode = `PRJ-${new Date().getFullYear()}-${String(projectCount + 101).padStart(3, "0")}`;

    const parsedContractValue = Number(body.contractValue) || 0;

    const data: any = {
      projectNumber: uniqueCode,
      name: body.name || "New Digital Solution",
      clientId: targetClientId,
      description: body.description || null,
      scopeText: body.scopeText || null,
      contractValue: parsedContractValue,
      status: body.status || "PLANNING",
      priority: body.priority || "HIGH",
      progressPercentage: body.progressPercentage !== undefined ? Number(body.progressPercentage) : 0,
      targetDeadline: body.deadline ? new Date(body.deadline) : body.targetDeadline ? new Date(body.targetDeadline) : null,
      stagingUrl: body.stagingUrl || null,
      liveUrl: body.liveUrl || null,
      designUrl: body.designUrl || null,
      createdById: authRes.id,
    };

    // 3. Handle initial assignments
    const membershipsToCreate: any[] = [];

    if (body.assigneeId) {
      const emp = await prisma.employee.findUnique({ where: { id: body.assigneeId } });
      if (emp) {
        membershipsToCreate.push({
          employeeId: body.assigneeId,
          roleInProject: body.assigneeRole || "TM",
          isActive: true,
          assignedById: authRes.id,
        });
      }
    }

    // Auto-membership for Employee creators if not designated
    if (authRes.activeRole === "EMPLOYEE" && authRes.employeeId) {
      const alreadyAssigned = membershipsToCreate.some((m) => m.employeeId === authRes.employeeId);
      if (!alreadyAssigned) {
        membershipsToCreate.push({
          employeeId: authRes.employeeId,
          roleInProject: "Web Developer",
          isActive: true,
          assignedById: authRes.id,
        });
      }
    }

    if (membershipsToCreate.length > 0) {
      data.memberships = {
        create: membershipsToCreate,
      };
    }

    const newProject = await prisma.project.create({
      data,
      include: {
        client: true,
        memberships: {
          include: {
            employee: {
              include: { user: true },
            },
          },
        },
      },
    });

    // Notify assigned employees
    for (const mem of newProject.memberships) {
      if (mem.employee?.userId && mem.employee.userId !== authRes.id) {
        await createAndSendNotification({
          recipientId: mem.employee.userId,
          title: `📁 Project Assigned: ${newProject.name}`,
          message: `You have been allocated to "${newProject.name}" as ${mem.roleInProject}.`,
          type: "PROJECT_ASSIGNMENT",
          urgency: "HIGH",
          linkUrl: `/projects/${newProject.id}`,
        });
      }
    }

    const isEmployee = authRes.activeRole === "EMPLOYEE";

    const formattedProject = {
      id: newProject.id,
      projectCode: newProject.projectNumber,
      name: newProject.name,
      clientId: newProject.clientId,
      clientName: newProject.client ? newProject.client.companyName : "Client Account",
      tmId: newProject.memberships[0]?.employeeId || "UNASSIGNED",
      tmName: newProject.memberships[0]?.employee?.user?.name || "Unassigned",
      progress: newProject.progressPercentage,
      currentStage: newProject.status,
      status: newProject.status,
      priority: newProject.priority,
      contractValue: isEmployee ? null : newProject.contractValue,
      paidValue: isEmployee ? null : 0,
      overdueValue: isEmployee ? null : 0,
      deadline: newProject.targetDeadline ? new Date(newProject.targetDeadline).toLocaleDateString() : "TBD",
      targetDeadline: newProject.targetDeadline,
      stagingUrl: newProject.stagingUrl,
      liveUrl: newProject.liveUrl,
      designUrl: newProject.designUrl,
      health: newProject.priority === "URGENT" || newProject.priority === "HIGH" ? "AT_RISK" : "ON_TRACK",
      scopeItems: newProject.scopeText ? newProject.scopeText.split("\n").filter(Boolean) : [],
      teamMembers: newProject.memberships.map((m) => ({
        id: m.id,
        employeeId: m.employeeId,
        name: m.employee?.user?.name || "Team Member",
        role: m.roleInProject,
        active: m.isActive,
        assignedDate: new Date(m.assignedAt).toLocaleDateString(),
      })),
      removalHistory: [],
      tasks: [],
      livingDocs: [],
      changeRequests: [],
      clientUpdates: [],
    };

    return NextResponse.json({ success: true, data: formattedProject });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 });
  }
}
