import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET() {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  if (authRes.activeRole === "CLIENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let whereClause = {};
  if (authRes.activeRole === "EMPLOYEE") {
    if (!authRes.employeeId) {
      return NextResponse.json({ success: false, error: "Forbidden: No employee profile linked" }, { status: 403 });
    }
    whereClause = {
      memberships: {
        some: { employeeId: authRes.employeeId, isActive: true }
      }
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
        },
        documents: true,
        changeRequests: true,
      },
    });

    const formatted = projects.map((p) => {
      const tmMembership = p.memberships.find((m) => m.roleInProject === "TM" && m.isActive);
      return {
        id: p.id,
        projectCode: p.projectNumber,
        name: p.name,
        clientId: p.clientId,
        clientName: p.client ? p.client.companyName : "Client Account",
        tmId: tmMembership?.employee.id || "UNASSIGNED",
        tmName: tmMembership?.employee.user.name ? `${tmMembership.employee.user.name} (Tech Lead)` : "Unassigned",
        progress: p.progressPercentage,
        currentStage: p.status,
        contractValue: p.contractValue,
        paidValue: 100000,
        overdueValue: 100000,
        deadline: p.targetDeadline ? new Date(p.targetDeadline).toLocaleDateString() : "15 Sep 2026",
        status: p.status,
        health: p.priority === "URGENT" ? "AT_RISK" : "ON_TRACK",
        scopeItems: p.scopeText ? p.scopeText.split("\n") : ["Storefront Next.js App Router"],
        teamMembers: p.memberships.map((m) => ({
          id: m.employee.id,
          name: m.employee.user.name,
          role: m.roleInProject,
          assignedDate: new Date(m.assignedAt).toLocaleDateString(),
          active: m.isActive,
        })),
        removalHistory: p.memberships
          .filter((m) => !m.isActive)
          .map((m) => ({
            id: m.id,
            name: m.employee.user.name,
            role: m.roleInProject,
            removedDate: m.removedAt ? new Date(m.removedAt).toLocaleDateString() : "Jul 20, 2026",
            reason: m.removalReason || "Reassigned to another project",
          })),
        tasks: p.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          assignee: t.assignedTo?.name || "Unassigned",
          status: t.status,
          priority: t.priority,
          blockedReason: t.status === "BLOCKED" ? "Waiting for client input" : undefined,
        })),
        livingDocs: p.documents.map((d) => ({
          id: d.id,
          title: d.title,
          version: `v${d.version}.0`,
          lastUpdated: new Date(d.updatedAt).toLocaleDateString(),
          author: "Meet Shah",
          content: d.content,
        })),
        changeRequests: p.changeRequests.map((cr) => ({
          id: cr.requestNumber,
          title: cr.requestedChange,
          value: cr.costImpactAmount,
          status: cr.status,
          date: new Date(cr.createdAt).toLocaleDateString(),
        })),
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch projects from database" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authRes = await requireRole(["OWNER", "SALES"]);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const firstClient = await prisma.client.findFirst();

    const uniqueCode = `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`;

    const data: any = {
      projectNumber: uniqueCode,
      name: body.name || "New Digital Solution",
      clientId: body.clientId || (firstClient ? firstClient.id : "CLT-001"),
      contractValue: body.contractValue || 450000,
      status: body.status || "IN_PROGRESS",
      priority: body.priority || "HIGH",
      progressPercentage: body.progressPercentage || 25,
      targetDeadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 86400000 * 45),
      createdById: authRes.id,
    };

    if (body.assigneeId) {
      data.memberships = {
        create: [
          {
            employeeId: body.assigneeId,
            roleInProject: "TM",
            isActive: true,
            assignedById: authRes.id,
          }
        ]
      };
    }

    const newProject = await prisma.project.create({
      data,
      include: {
        client: true,
        memberships: {
          include: {
            employee: {
              include: { user: true }
            }
          }
        }
      },
    });

    const tmMembership = newProject.memberships?.find((m: any) => m.roleInProject === "TM" && m.isActive);

    const formattedProject = {
      id: newProject.id,
      projectCode: newProject.projectNumber,
      name: newProject.name,
      clientId: newProject.clientId,
      clientName: newProject.client ? newProject.client.companyName : "Client Account",
      tmId: tmMembership?.employee.id || "UNASSIGNED",
      tmName: tmMembership?.employee.user.name ? `${tmMembership.employee.user.name} (Tech Lead)` : "Unassigned",
      progress: newProject.progressPercentage,
      currentStage: newProject.status,
      contractValue: newProject.contractValue,
      paidValue: 0,
      overdueValue: 0,
      deadline: newProject.targetDeadline ? new Date(newProject.targetDeadline).toLocaleDateString() : "15 Sep 2026",
      status: newProject.status,
      health: newProject.priority === "URGENT" ? "AT_RISK" : "ON_TRACK",
      scopeItems: newProject.scopeText ? newProject.scopeText.split("\n") : ["Storefront Next.js App Router"],
      teamMembers: [],
      removalHistory: [],
      tasks: [],
      livingDocs: [],
      changeRequests: [],
    };

    return NextResponse.json({ success: true, data: formattedProject });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create project" }, { status: 500 });
  }
}
