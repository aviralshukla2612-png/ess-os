import { prisma } from "./prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export type RoleContext = "OWNER" | "SALES" | "EMPLOYEE" | "CLIENT" | "SUB_ADMIN";

export interface CurrentUserSession {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  activeRole: RoleContext;
  subAdminPermissions?: string[];
  avatarUrl: string | null;
  employeeId?: string;
}

/**
 * Retrieves the currently authenticated user based on the secure server session.
 * Does NOT accept a client-provided email or user ID.
 */
export async function getCurrentUser(): Promise<CurrentUserSession | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { employeeProfile: true },
  });

  if (!user || !user.isActive) return null;

  let parsedPermissions: string[] = [];
  try {
    if (user.subAdminPermissions) {
      parsedPermissions = JSON.parse(user.subAdminPermissions);
    }
  } catch {}

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    designation: user.designation,
    department: user.department,
    activeRole: user.activeRole as RoleContext,
    subAdminPermissions: parsedPermissions,
    avatarUrl: user.avatarUrl,
    employeeId: user.employeeProfile?.id,
  };
}

/**
 * Standardized auth helper for APIs. 
 * Returns the CurrentUserSession, or a 401 NextResponse if unauthenticated.
 */
export async function requireAuth(): Promise<CurrentUserSession | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

/**
 * Standardized role authorization helper for APIs.
 * Returns the CurrentUserSession if they have the role, or a 401/403 NextResponse otherwise.
 * For SUB_ADMIN, permits access to OWNER routes if they have the required module permission.
 */
export async function requireRole(
  allowedRoles: RoleContext[],
  requiredModule?: string
): Promise<CurrentUserSession | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Owner always has universal access
  if (user.activeRole === "OWNER") {
    return user;
  }

  // Sub-Admin role verification
  if (user.activeRole === "SUB_ADMIN") {
    if (allowedRoles.includes("SUB_ADMIN") || allowedRoles.includes("OWNER")) {
      if (requiredModule) {
        const hasPerm = user.subAdminPermissions?.includes(requiredModule);
        if (!hasPerm) {
          return NextResponse.json(
            { success: false, error: `Forbidden: Sub-Admin lacks '${requiredModule}' access.` },
            { status: 403 }
          );
        }
      }
      return user;
    }
  }
  
  if (!allowedRoles.includes(user.activeRole)) {
    return NextResponse.json({ success: false, error: "Forbidden: Insufficient Permissions" }, { status: 403 });
  }
  
  return user;
}
