import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { recalculateProjectProgress } from "@/lib/projectUtils";

export async function PATCH(req: Request, { params }: { params: { id: string; taskId: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { id: projectId, taskId } = params;

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, projectId },
    });

    if (!existingTask) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.isMostImportant !== undefined) updateData.isMostImportant = Boolean(body.isMostImportant);
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;

    if (body.assignedToId !== undefined) {
      let assignedToUserId = body.assignedToId || null;
      if (assignedToUserId) {
        const employee = await prisma.employee.findUnique({
          where: { id: assignedToUserId },
          select: { userId: true },
        });
        if (employee?.userId) {
          assignedToUserId = employee.userId;
        }
      }
      updateData.assignedToId = assignedToUserId;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "COMPLETED" || body.status === "DONE") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedTo: true,
      },
    });

    const newProgress = await recalculateProjectProgress(projectId);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        assignee: updatedTask.assignedTo?.name || "Unassigned",
        assigneeId: updatedTask.assignedToId,
        status: updatedTask.status,
        priority: updatedTask.priority,
        isMostImportant: updatedTask.isMostImportant,
        deadline: updatedTask.deadline ? new Date(updatedTask.deadline).toLocaleDateString() : null,
        completedAt: updatedTask.completedAt,
      },
      progressPercentage: newProgress,
    });
  } catch (error) {
    console.error("PATCH /api/projects/[id]/tasks/[taskId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string; taskId: string } }) {
  const authRes = await requireAuth();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { id: projectId, taskId } = params;

    await prisma.task.delete({
      where: { id: taskId },
    });

    const newProgress = await recalculateProjectProgress(projectId);

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
      progressPercentage: newProgress,
    });
  } catch (error) {
    console.error("DELETE /api/projects/[id]/tasks/[taskId] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete task" }, { status: 500 });
  }
}
