import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// Helper function to recalculate project progress
export async function recalculateProjectProgress(projectId: string) {
  const allTasks = await prisma.task.findMany({
    where: { projectId },
  });
  const activeTasks = allTasks.filter((t) => t.status !== "ARCHIVED");
  const completedTasks = activeTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE");
  const progressPercentage = activeTasks.length > 0 ? Math.round((completedTasks.length / activeTasks.length) * 100) : 0;

  await prisma.project.update({
    where: { id: projectId },
    data: { progressPercentage },
  });

  return progressPercentage;
}

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
