import { prisma } from "./prisma";
import { CurrentUserSession, RoleContext } from "./auth";

export function hasRoleContext(user: CurrentUserSession, role: RoleContext): boolean {
  return user.activeRole === role;
}

export function isOwner(user: CurrentUserSession): boolean {
  return user.activeRole === "OWNER";
}

export function isSales(user: CurrentUserSession): boolean {
  return user.activeRole === "SALES" || user.activeRole === "OWNER";
}

export function isEmployee(user: CurrentUserSession): boolean {
  return user.activeRole === "EMPLOYEE" || user.activeRole === "OWNER";
}

export function isClient(user: CurrentUserSession): boolean {
  return user.activeRole === "CLIENT";
}

/**
 * Evaluates contextual Team Manager (TM) authority for a specific project.
 * An employee may be TM on Project A while acting as a standard Member on Project B.
 */
export async function isProjectTM(userId: string, projectId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { employeeProfile: true },
  });

  if (user?.activeRole === "OWNER") return true; // Owner has universal TM authority

  if (!user?.employeeProfile) return false;

  const membership = await prisma.projectMembership.findFirst({
    where: {
      projectId,
      employeeId: user.employeeProfile.id,
      isActive: true,
    },
  });

  return membership?.roleInProject === "TM";
}
