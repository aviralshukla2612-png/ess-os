import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { recalculateProjectProgress } from "@/lib/projectUtils";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const projectId = params.id;

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ success: false, error: "Task title is required" }, { status: 400 });
    }

    let assignedToUserId = body.assignedToId || null;
    // If an employeeId is provided instead of a userId, resolve it
    if (assignedToUserId) {
      const employee = await prisma.employee.findUnique({
        where: { id: assignedToUserId },
        select: { userId: true },
      });
      if (employee?.userId) {
        assignedToUserId = employee.userId;
      }
    }

    const newTask = await prisma.task.create({
      data: {
        projectId,
        title: body.title.trim(),
        description: body.description || null,
        priority: body.priority || "MEDIUM",
        status: body.status || "PLANNING",
        isMostImportant: Boolean(body.isMostImportant),
        assignedToId: assignedToUserId,
        deadline: body.deadline ? new Date(body.deadline) : null,
        createdById: authRes.id,
      },
      include: {
        assignedTo: true,
      },
    });

    const newProgress = await recalculateProjectProgress(projectId);

    return NextResponse.json({
      success: true,
      data: {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        assignee: newTask.assignedTo?.name || "Unassigned",
        assigneeId: newTask.assignedToId,
        status: newTask.status,
        priority: newTask.priority,
        isMostImportant: newTask.isMostImportant,
        deadline: newTask.deadline ? new Date(newTask.deadline).toLocaleDateString() : null,
      },
      progressPercentage: newProgress,
    });
  } catch (error) {
    console.error("POST /api/projects/[id]/tasks error:", error);
    return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 });
  }
}
