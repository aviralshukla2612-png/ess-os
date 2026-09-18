import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // e.g. "2026-09-18"
    const employeeId = searchParams.get("employeeId");
    const projectId = searchParams.get("projectId");
    const healthStatus = searchParams.get("healthStatus");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const isEmployee = authRes.activeRole === "EMPLOYEE";
    const whereClause: any = {};

    // Strict Role Privacy:
    // If EMPLOYEE, restrict strictly to their own submitted daily updates
    if (isEmployee) {
      whereClause.authorId = authRes.id;
    } else {
      // Admin / Sub-Admin can filter by any employee
      if (employeeId && employeeId !== "ALL") {
        const emp = await prisma.employee.findUnique({
          where: { id: employeeId },
          select: { userId: true },
        });
        if (emp?.userId) {
          whereClause.authorId = emp.userId;
        } else {
          whereClause.authorId = employeeId;
        }
      }
    }

    // Date filtering: defaults to all or filtered by start/end of chosen day
    if (dateParam) {
      const startOfDay = new Date(`${dateParam}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateParam}T23:59:59.999Z`);
      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (healthStatus && healthStatus !== "ALL") {
      whereClause.healthStatus = healthStatus;
    }

    const [totalCount, rawUpdates] = await Promise.all([
      prisma.clientUpdate.count({ where: whereClause }),
      prisma.clientUpdate.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
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
              client: { select: { companyName: true } },
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
      }),
    ]);

    // Calculate Summary Stats (Scoped to user permissions)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const statsWhere: any = { createdAt: { gte: todayStart } };
    if (isEmployee) {
      statsWhere.authorId = authRes.id;
    }

    const [todayUpdatesCount, distinctProjectsCount, blockersCount, criticalCount] = await Promise.all([
      prisma.clientUpdate.count({
        where: statsWhere,
      }),
      prisma.clientUpdate.groupBy({
        by: ["projectId"],
        where: statsWhere,
      }),
      prisma.clientUpdate.count({
        where: {
          ...statsWhere,
          blockers: { not: null },
        },
      }),
      prisma.clientUpdate.count({
        where: {
          ...statsWhere,
          healthStatus: { in: ["AT_RISK", "BLOCKED"] },
        },
      }),
    ]);

    const formattedUpdates = rawUpdates.map((u) => {
      const membership = u.project.memberships.find((m) => m.employee.userId === u.author.id);

      return {
        id: u.id,
        projectId: u.projectId,
        projectCode: u.project.projectNumber,
        projectName: u.project.name,
        clientName: u.project.client?.companyName || "Client Account",
        title: u.title,
        content: u.content,
        blockers: u.blockers || null,
        healthStatus: u.healthStatus || "ON_TRACK",
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
          employeeId: u.author.employeeProfile?.id,
          name: u.author.name,
          email: u.author.email,
          designation: u.author.designation || "Staff",
          avatarUrl: u.author.avatarUrl,
          roleInProject: membership?.roleInProject || u.author.designation || "Team Member",
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        updates: formattedUpdates,
        isEmployeeView: isEmployee,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
        stats: {
          totalSubmissionsToday: todayUpdatesCount,
          projectsUpdatedToday: distinctProjectsCount.length,
          blockersCount,
          criticalAlertsCount: criticalCount,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/daily-updates error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch master daily updates feed" }, { status: 500 });
  }
}
