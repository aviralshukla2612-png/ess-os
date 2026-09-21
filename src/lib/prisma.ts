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
    const helperAddColumn = async (tableName: string, colName: string, colDef: string) => {
      try {
        const cols: any = await prisma.$queryRawUnsafe(`PRAGMA table_info("${tableName}")`);
        if (Array.isArray(cols) && cols.length > 0) {
          const names = cols.map((c: any) => c.name);
          if (!names.includes(colName)) {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${tableName}" ADD COLUMN "${colName}" ${colDef}`);
            console.log(`Auto-migrated: Added ${colName} to ${tableName}`);
          }
        }
      } catch (e) {
        // Table may not exist yet or column already exists
      }
    };

    // 1. Create missing tables if needed
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

    // 2. ProjectMembership columns
    await helperAddColumn("ProjectMembership", "compensationAmount", "REAL");
    await helperAddColumn("ProjectMembership", "removedAt", "DATETIME");
    await helperAddColumn("ProjectMembership", "removedById", "TEXT");
    await helperAddColumn("ProjectMembership", "removalReason", "TEXT");
    await helperAddColumn("ProjectMembership", "isActive", "BOOLEAN DEFAULT 1");

    // 3. Project columns
    await helperAddColumn("Project", "designUrl", "TEXT");
    await helperAddColumn("Project", "stagingUrl", "TEXT");
    await helperAddColumn("Project", "liveUrl", "TEXT");
    await helperAddColumn("Project", "scopeText", "TEXT");
    await helperAddColumn("Project", "progressPercentage", "REAL DEFAULT 0");
    await helperAddColumn("Project", "contractValue", "REAL DEFAULT 0");
    await helperAddColumn("Project", "startDate", "DATETIME");
    await helperAddColumn("Project", "targetDeadline", "DATETIME");
    await helperAddColumn("Project", "actualCompletionDate", "DATETIME");

    // 4. Task columns
    await helperAddColumn("Task", "completedAt", "DATETIME");
    await helperAddColumn("Task", "startDate", "DATETIME");
    await helperAddColumn("Task", "deadline", "DATETIME");
    await helperAddColumn("Task", "stageId", "TEXT");
    await helperAddColumn("Task", "estimatedHours", "REAL DEFAULT 0");
    await helperAddColumn("Task", "actualHours", "REAL DEFAULT 0");
    await helperAddColumn("Task", "isMostImportant", "BOOLEAN DEFAULT 0");

    // 5. Employee columns
    await helperAddColumn("Employee", "sickLeaveTotal", "INTEGER DEFAULT 10");
    await helperAddColumn("Employee", "sickLeaveUsed", "REAL DEFAULT 0");
    await helperAddColumn("Employee", "casualLeaveTotal", "INTEGER DEFAULT 15");
    await helperAddColumn("Employee", "casualLeaveUsed", "REAL DEFAULT 0");
    await helperAddColumn("Employee", "paidLeaveTotal", "INTEGER DEFAULT 15");
    await helperAddColumn("Employee", "paidLeaveUsed", "REAL DEFAULT 0");
    await helperAddColumn("Employee", "reportingManagerId", "TEXT");
    await helperAddColumn("Employee", "skillsJson", "TEXT DEFAULT '[]'");

    // 6. User columns
    await helperAddColumn("User", "subAdminPermissions", "TEXT DEFAULT '[]'");
    await helperAddColumn("User", "activeRole", "TEXT DEFAULT 'EMPLOYEE'");
    await helperAddColumn("User", "avatarUrl", "TEXT");
    await helperAddColumn("User", "isActive", "BOOLEAN DEFAULT 1");

    // 7. Attendance columns
    await helperAddColumn("Attendance", "punchOutReason", "TEXT");
    await helperAddColumn("Attendance", "punchOutRequestStatus", "TEXT");
    await helperAddColumn("Attendance", "punchOutRequestedAt", "DATETIME");
    await helperAddColumn("Attendance", "punchOutApprovedById", "TEXT");
    await helperAddColumn("Attendance", "totalMinutes", "INTEGER DEFAULT 0");

  } catch (err) {
    console.warn("Auto-schema migration notice:", err);
  }
}

// Run auto-migration on server load
ensureSchema().catch((e) => console.warn("Schema initialization warning:", e));
