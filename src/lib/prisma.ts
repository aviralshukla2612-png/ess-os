import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitialized: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

async function ensureSchema() {
  if (globalForPrisma.dbInitialized) return;
  globalForPrisma.dbInitialized = true;

  try {
    // 1. Check & add missing columns in ProjectMembership
    const membershipCols: any = await prisma.$queryRawUnsafe("PRAGMA table_info('ProjectMembership')");
    if (Array.isArray(membershipCols) && membershipCols.length > 0) {
      const colNames = membershipCols.map((c: any) => c.name);
      if (!colNames.includes("compensationAmount")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "ProjectMembership" ADD COLUMN "compensationAmount" REAL');
        console.log("Auto-migrated: Added compensationAmount to ProjectMembership");
      }
      if (!colNames.includes("removedAt")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "ProjectMembership" ADD COLUMN "removedAt" DATETIME');
      }
      if (!colNames.includes("removedById")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "ProjectMembership" ADD COLUMN "removedById" TEXT');
      }
      if (!colNames.includes("removalReason")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "ProjectMembership" ADD COLUMN "removalReason" TEXT');
      }
      if (!colNames.includes("isActive")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "ProjectMembership" ADD COLUMN "isActive" BOOLEAN DEFAULT 1');
      }
    }

    // 2. Check & add missing columns in Project
    const projectCols: any = await prisma.$queryRawUnsafe("PRAGMA table_info('Project')");
    if (Array.isArray(projectCols) && projectCols.length > 0) {
      const colNames = projectCols.map((c: any) => c.name);
      if (!colNames.includes("designUrl")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Project" ADD COLUMN "designUrl" TEXT');
      }
      if (!colNames.includes("stagingUrl")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Project" ADD COLUMN "stagingUrl" TEXT');
      }
      if (!colNames.includes("liveUrl")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Project" ADD COLUMN "liveUrl" TEXT');
      }
      if (!colNames.includes("scopeText")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Project" ADD COLUMN "scopeText" TEXT');
      }
      if (!colNames.includes("progressPercentage")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Project" ADD COLUMN "progressPercentage" REAL DEFAULT 0');
      }
      if (!colNames.includes("contractValue")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Project" ADD COLUMN "contractValue" REAL DEFAULT 0');
      }
    }

    // 3. Check & add missing columns in Task
    const taskCols: any = await prisma.$queryRawUnsafe("PRAGMA table_info('Task')");
    if (Array.isArray(taskCols) && taskCols.length > 0) {
      const colNames = taskCols.map((c: any) => c.name);
      if (!colNames.includes("isMostImportant")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Task" ADD COLUMN "isMostImportant" BOOLEAN DEFAULT 0');
      }
    }

    // 4. Check & add missing columns in Employee
    const employeeCols: any = await prisma.$queryRawUnsafe("PRAGMA table_info('Employee')");
    if (Array.isArray(employeeCols) && employeeCols.length > 0) {
      const colNames = employeeCols.map((c: any) => c.name);
      if (!colNames.includes("sickLeaveTotal")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN "sickLeaveTotal" INTEGER DEFAULT 10');
      }
      if (!colNames.includes("sickLeaveUsed")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN "sickLeaveUsed" REAL DEFAULT 0');
      }
      if (!colNames.includes("casualLeaveTotal")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN "casualLeaveTotal" INTEGER DEFAULT 15');
      }
      if (!colNames.includes("casualLeaveUsed")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN "casualLeaveUsed" REAL DEFAULT 0');
      }
      if (!colNames.includes("paidLeaveTotal")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN "paidLeaveTotal" INTEGER DEFAULT 15');
      }
      if (!colNames.includes("paidLeaveUsed")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "Employee" ADD COLUMN "paidLeaveUsed" REAL DEFAULT 0');
      }
    }

    // 5. Check & add missing columns in User
    const userCols: any = await prisma.$queryRawUnsafe("PRAGMA table_info('User')");
    if (Array.isArray(userCols) && userCols.length > 0) {
      const colNames = userCols.map((c: any) => c.name);
      if (!colNames.includes("subAdminPermissions")) {
        await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN "subAdminPermissions" TEXT DEFAULT \'[]\'');
      }
    }
  } catch (err) {
    console.warn("Auto-schema migration notice:", err);
  }
}

// Run auto-migration on server load
ensureSchema().catch((e) => console.warn("Schema initialization warning:", e));
