import { prisma } from "./prisma";

export async function logActivityEvent(params: {
  eventType: string;
  actorId: string;
  entityType: string;
  entityId: string;
  projectId?: string;
  clientId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    return await prisma.activityEvent.create({
      data: {
        eventType: params.eventType,
        actorId: params.actorId,
        entityType: params.entityType,
        entityId: params.entityId,
        projectId: params.projectId,
        clientId: params.clientId,
        metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to log activity event:", error);
  }
}
