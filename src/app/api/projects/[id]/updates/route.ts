import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAndSendNotification } from "@/lib/notifications";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const updates = await prisma.clientUpdate.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true,
            avatarUrl: true,
            activeRole: true,
            employeeProfile: {
              select: { id: true, employeeIdCode: true },
            },
          },
        },
        project: {
          select: {
            id: true,
            projectNumber: true,
            name: true,
            memberships: {
              where: { isActive: true },
              select: {
                employeeId: true,
                roleInProject: true,
                employee: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    const formatted = updates.map((u) => {
      const membership = u.project.memberships.find(
        (m) => m.employee.userId === u.author.id
      );

      return {
        id: u.id,
        projectId: u.projectId,
        projectCode: u.project.projectNumber,
        projectName: u.project.name,
        title: u.title,
        content: u.content,
        blockers: u.blockers || null,
        healthStatus: u.healthStatus || "ON_TRACK",
        visibility: u.visibility,
        createdAt: u.createdAt,
        formattedDate: new Date(u.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        author: {
          id: u.author.id,
          name: u.author.name,
          email: u.author.email,
          designation: u.author.designation || "Team Member",
          department: u.author.department,
          avatarUrl: u.author.avatarUrl,
          roleInProject: membership?.roleInProject || u.author.designation || "Contributor",
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/updates error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch project updates" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const projectId = params.id;

    if (!body.title || !body.content) {
      return NextResponse.json({ success: false, error: "Title and content are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { employee: { select: { userId: true } } },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Role verification: If EMPLOYEE, verify assigned
    if (authRes.activeRole === "EMPLOYEE") {
      const isAssigned = project.memberships.some(
        (m) => m.employeeId === authRes.employeeId
      );
      if (!isAssigned) {
        return NextResponse.json(
          { success: false, error: "Forbidden: You are not an active member on this project" },
          { status: 403 }
        );
      }
    }

    const healthStatus = ["ON_TRACK", "AT_RISK", "BLOCKED"].includes(body.healthStatus)
      ? body.healthStatus
      : "ON_TRACK";

    const newUpdate = await prisma.clientUpdate.create({
      data: {
        projectId,
        title: body.title.trim(),
        content: body.content.trim(),
        blockers: body.blockers?.trim() || null,
        healthStatus,
        visibility: body.visibility || "CLIENT_VISIBLE",
        authorId: authRes.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify TM (Tech Lead) and Admins
    const notifyUserIds = new Set<string>();

    // 1. Tech Lead
    const tm = project.memberships.find(
      (m) => (m.roleInProject === "TM" || m.roleInProject === "Tech Lead") && m.employee?.userId !== authRes.id
    );
    if (tm?.employee?.userId) notifyUserIds.add(tm.employee.userId);

    // 2. Admins & Owners
    const admins = await prisma.user.findMany({
      where: {
        activeRole: { in: ["OWNER", "SUB_ADMIN"] },
        id: { not: authRes.id },
      },
      select: { id: true },
    });
    admins.forEach((a) => notifyUserIds.add(a.id));

    // Send notifications
    for (const recipientId of notifyUserIds) {
      const isBlocker = healthStatus === "BLOCKED" || Boolean(body.blockers?.trim());
      await createAndSendNotification({
        recipientId,
        title: `${isBlocker ? "🚨 Blocker Reported" : "📝 Daily Progress Update"}: ${project.name}`,
        message: `${authRes.name} posted: "${newUpdate.title}". ${
          newUpdate.blockers ? `Blocker: ${newUpdate.blockers}` : ""
        }`,
        type: "PROJECT_UPDATE",
        urgency: isBlocker ? "HIGH" : "MEDIUM",
        linkUrl: `/projects/${project.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Daily progress report submitted successfully",
      data: {
        id: newUpdate.id,
        projectId: newUpdate.projectId,
        projectCode: project.projectNumber,
        projectName: project.name,
        title: newUpdate.title,
        content: newUpdate.content,
        blockers: newUpdate.blockers,
        healthStatus: newUpdate.healthStatus,
        visibility: newUpdate.visibility,
        createdAt: newUpdate.createdAt,
        formattedDate: new Date(newUpdate.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        author: {
          id: newUpdate.author.id,
          name: newUpdate.author.name,
          email: newUpdate.author.email,
          designation: newUpdate.author.designation,
          avatarUrl: newUpdate.author.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/updates error:", error);
    return NextResponse.json({ success: false, error: "Failed to post progress update" }, { status: 500 });
  }
}
