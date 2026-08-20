import { prisma } from "./prisma";

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

export async function getCurrentUser(email?: string): Promise<CurrentUserSession | null> {
  const targetEmail = email || "owner@mdzcompany.com"; // Default to Owner for initial setup
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: { employeeProfile: true },
  });

  if (!user) return null;

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
