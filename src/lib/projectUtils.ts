import { prisma } from "@/lib/prisma";

/**
 * Helper function to dynamically recalculate overall project progress percentage
 * based on active and completed tasks.
 */
export async function recalculateProjectProgress(projectId: string): Promise<number> {
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
