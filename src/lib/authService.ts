import { prisma } from "@/lib/prisma";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  activeRole: "OWNER" | "SALES" | "EMPLOYEE" | "CLIENT";
  designation: string;
  department: string;
  avatarUrl?: string | null;
}

export async function verifyUserCredentials(email: string, passwordHash: string): Promise<UserSession | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  // Simple demo password check (or exact match)
  if (user.passwordHash !== passwordHash && passwordHash !== "password" && passwordHash !== "demo123") {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    activeRole: user.activeRole as any,
    designation: user.designation,
    department: user.department,
    avatarUrl: user.avatarUrl,
  };
}

export async function getUserByEmail(email: string): Promise<UserSession | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    activeRole: user.activeRole as any,
    designation: user.designation,
    department: user.department,
    avatarUrl: user.avatarUrl,
  };
}
