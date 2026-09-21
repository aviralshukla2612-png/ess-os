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

let dbInitPromise: Promise<void> | null = null;

async function runMigrations() {
  const tryAddCol = async (table: string, col: string, def: string) => {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${col}" ${def}`);
      console.log(`[DB Migration] Added column ${table}.${col}`);
    } catch {
      // Column already exists or table not yet created
    }
  };

  try {
    // 1. Create missing tables if they don't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserFcmToken" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ClientUpdate" (
        "id" TEXT PRIMARY KEY,
        "projectId" TEXT NOT NULL,
        "authorId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "blockers" TEXT,
        "healthStatus" TEXT NOT NULL DEFAULT 'ON_TRACK',
        "visibility" TEXT NOT NULL DEFAULT 'CLIENT_VISIBLE',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LeaveRequest" (
        "id" TEXT PRIMARY KEY,
        "employeeId" TEXT NOT NULL,
        "leaveType" TEXT NOT NULL,
        "startDate" DATETIME NOT NULL,
        "endDate" DATETIME NOT NULL,
        "days" REAL NOT NULL DEFAULT 1,
        "reason" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "approvedById" TEXT,
        "approvedAt" DATETIME,
        "rejectionReason" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CompanyHoliday" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "date" DATETIME NOT NULL,
        "description" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {});

    // 2. ClientUpdate table columns (Fixes missing blockers/healthStatus/visibility)
    await tryAddCol("ClientUpdate", "blockers", "TEXT");
    await tryAddCol("ClientUpdate", "healthStatus", "TEXT DEFAULT 'ON_TRACK'");
    await tryAddCol("ClientUpdate", "visibility", "TEXT DEFAULT 'CLIENT_VISIBLE'");
    await tryAddCol("ClientUpdate", "title", "TEXT");
    await tryAddCol("ClientUpdate", "content", "TEXT");
    await tryAddCol("ClientUpdate", "authorId", "TEXT");
    await tryAddCol("ClientUpdate", "projectId", "TEXT");

    // 3. Task table columns
    await tryAddCol("Task", "completedAt", "DATETIME");
    await tryAddCol("Task", "startDate", "DATETIME");
    await tryAddCol("Task", "deadline", "DATETIME");
    await tryAddCol("Task", "stageId", "TEXT");
    await tryAddCol("Task", "estimatedHours", "REAL DEFAULT 0");
    await tryAddCol("Task", "actualHours", "REAL DEFAULT 0");
    await tryAddCol("Task", "isMostImportant", "BOOLEAN DEFAULT 0");
    await tryAddCol("Task", "assignedToId", "TEXT");
    await tryAddCol("Task", "priority", "TEXT DEFAULT 'MEDIUM'");
    await tryAddCol("Task", "status", "TEXT DEFAULT 'PLANNING'");

    // 4. ProjectMembership table columns
    await tryAddCol("ProjectMembership", "compensationAmount", "REAL");
    await tryAddCol("ProjectMembership", "removedAt", "DATETIME");
    await tryAddCol("ProjectMembership", "removedById", "TEXT");
    await tryAddCol("ProjectMembership", "removalReason", "TEXT");
    await tryAddCol("ProjectMembership", "isActive", "BOOLEAN DEFAULT 1");
    await tryAddCol("ProjectMembership", "roleInProject", "TEXT DEFAULT 'MEMBER'");

    // 5. Project table columns
    await tryAddCol("Project", "designUrl", "TEXT");
    await tryAddCol("Project", "stagingUrl", "TEXT");
    await tryAddCol("Project", "liveUrl", "TEXT");
    await tryAddCol("Project", "scopeText", "TEXT");
    await tryAddCol("Project", "progressPercentage", "REAL DEFAULT 0");
    await tryAddCol("Project", "contractValue", "REAL DEFAULT 0");
    await tryAddCol("Project", "startDate", "DATETIME");
    await tryAddCol("Project", "targetDeadline", "DATETIME");
    await tryAddCol("Project", "actualCompletionDate", "DATETIME");
    await tryAddCol("Project", "projectTypeId", "TEXT");
    await tryAddCol("Project", "status", "TEXT DEFAULT 'DRAFT'");
    await tryAddCol("Project", "priority", "TEXT DEFAULT 'MEDIUM'");

    // 6. ChangeRequest table columns
    await tryAddCol("ChangeRequest", "requestNumber", "TEXT");
    await tryAddCol("ChangeRequest", "requestedBy", "TEXT");
    await tryAddCol("ChangeRequest", "source", "TEXT DEFAULT 'CLIENT'");
    await tryAddCol("ChangeRequest", "originalRequirement", "TEXT");
    await tryAddCol("ChangeRequest", "requestedChange", "TEXT");
    await tryAddCol("ChangeRequest", "reason", "TEXT");
    await tryAddCol("ChangeRequest", "technicalImpact", "TEXT");
    await tryAddCol("ChangeRequest", "timelineImpactDays", "INTEGER DEFAULT 0");
    await tryAddCol("ChangeRequest", "costImpactAmount", "REAL DEFAULT 0");
    await tryAddCol("ChangeRequest", "estimatedHours", "REAL DEFAULT 0");
    await tryAddCol("ChangeRequest", "status", "TEXT DEFAULT 'DRAFT'");
    await tryAddCol("ChangeRequest", "approvedById", "TEXT");
    await tryAddCol("ChangeRequest", "approvedAt", "DATETIME");

    // 7. ProjectDocument & DocumentVersion table columns
    await tryAddCol("ProjectDocument", "category", "TEXT DEFAULT 'GENERAL'");
    await tryAddCol("ProjectDocument", "version", "INTEGER DEFAULT 1");
    await tryAddCol("ProjectDocument", "createdById", "TEXT");
    await tryAddCol("ProjectDocument", "updatedById", "TEXT");

    // 8. Employee table columns
    await tryAddCol("Employee", "sickLeaveTotal", "INTEGER DEFAULT 10");
    await tryAddCol("Employee", "sickLeaveUsed", "REAL DEFAULT 0");
    await tryAddCol("Employee", "casualLeaveTotal", "INTEGER DEFAULT 15");
    await tryAddCol("Employee", "casualLeaveUsed", "REAL DEFAULT 0");
    await tryAddCol("Employee", "paidLeaveTotal", "INTEGER DEFAULT 15");
    await tryAddCol("Employee", "paidLeaveUsed", "REAL DEFAULT 0");
    await tryAddCol("Employee", "reportingManagerId", "TEXT");
    await tryAddCol("Employee", "skillsJson", "TEXT DEFAULT '[]'");
    await tryAddCol("Employee", "status", "TEXT DEFAULT 'ACTIVE'");
    await tryAddCol("Employee", "salaryMonthly", "REAL DEFAULT 0");

    // 9. User table columns
    await tryAddCol("User", "subAdminPermissions", "TEXT DEFAULT '[]'");
    await tryAddCol("User", "activeRole", "TEXT DEFAULT 'EMPLOYEE'");
    await tryAddCol("User", "avatarUrl", "TEXT");
    await tryAddCol("User", "isActive", "BOOLEAN DEFAULT 1");

    // 10. Attendance table columns
    await tryAddCol("Attendance", "punchOutReason", "TEXT");
    await tryAddCol("Attendance", "punchOutRequestStatus", "TEXT");
    await tryAddCol("Attendance", "punchOutRequestedAt", "DATETIME");
    await tryAddCol("Attendance", "punchOutApprovedById", "TEXT");
    await tryAddCol("Attendance", "totalMinutes", "INTEGER DEFAULT 0");

    // 11. Client table columns
    await tryAddCol("Client", "totalBusiness", "REAL DEFAULT 0");
    await tryAddCol("Client", "outstandingBalance", "REAL DEFAULT 0");
    await tryAddCol("Client", "billingAddress", "TEXT");
    await tryAddCol("Client", "taxId", "TEXT");
    await tryAddCol("Client", "notes", "TEXT");

    console.log("[DB Migration] Schema synchronization complete.");
  } catch (err) {
    console.warn("[DB Migration] Schema synchronization notice:", err);
  }
}

export async function ensureDbReady(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = runMigrations();
  }
  return dbInitPromise;
}

// Trigger background migration on startup as well
ensureDbReady().catch(() => {});
