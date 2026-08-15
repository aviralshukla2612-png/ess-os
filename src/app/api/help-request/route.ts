import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const helpRequests = await prisma.helpRequest.findMany({
      orderBy: { requestedAt: "desc" },
      include: {
        employee: { include: { user: true } },
        project: true,
        task: true,
      },
    });

    return NextResponse.json({ success: true, data: helpRequests });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch help requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, projectId, message, urgency, category, dateOffsetDays } = body;

    const count = await prisma.helpRequest.count();
    const emp = await prisma.employee.findFirst({
      where: { OR: [{ id: employeeId }, { employeeIdCode: employeeId }] },
    });

    if (!emp) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const logDate = dateOffsetDays ? new Date(Date.now() - 86400000 * dateOffsetDays) : new Date();

    const helpReq = await prisma.helpRequest.create({
      data: {
        requestNumber: `HELP-2026-0${count + 10}`,
        employeeId: emp.id,
        projectId: projectId,
        category: category || "TECHNICAL_BLOCKER",
        message: message || "Sir Help: Escalated Technical Blocker needing Owner intervention.",
        urgency: urgency || "HIGH",
        status: "IN_QUEUE",
        requestedAt: logDate,
      },
    });

    return NextResponse.json({ success: true, data: helpReq });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create help request" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, ownerAction, ownerComment } = body;

    const updated = await prisma.helpRequest.update({
      where: { id },
      data: {
        status: status || "RESOLVED",
        ownerAction: ownerAction || "RESOLVED",
        ownerComment: ownerComment || "Approved solution. Blocker cleared.",
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update help request" }, { status: 500 });
  }
}
