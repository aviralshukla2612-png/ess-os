import { prisma } from "./prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";

export type RoleContext = "OWNER" | "SALES" | "EMPLOYEE" | "CLIENT";

export interface CurrentUserSession {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  activeRole: RoleContext;
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

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    designation: user.designation,
    department: user.department,
    activeRole: user.activeRole as RoleContext,
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
 */
export async function requireRole(allowedRoles: RoleContext[]): Promise<CurrentUserSession | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  if (!allowedRoles.includes(user.activeRole)) {
    return NextResponse.json({ success: false, error: "Forbidden: Insufficient Permissions" }, { status: 403 });
  }
  
  return user;
}
