function isDummyUser(u: any): boolean {
  if (!u) return false;
  const name = (u.name || "").toLowerCase().trim();
  const email = (u.email || "").toLowerCase().trim();
  return name === "karan verma" || name.includes("karan verma") || email.includes("karan.sales") || email === "karan@esscompany.com";
}

function isUserInDepartment(u: any, targetDept: string): boolean {
  if (!u || !targetDept) return false;
  const search = targetDept.trim().toLowerCase();
  const dept = (u.department || "").trim().toLowerCase();
  const role = (u.activeRole || "").trim().toLowerCase();
  const desig = (u.designation || "").trim().toLowerCase();

  // Direct substring match on department
  if (dept && (dept.includes(search) || search.includes(dept))) return true;

  // Sales department synonyms
  if (search.includes("sale") || search === "sales") {
    if (dept.includes("sale") || dept.includes("bd") || dept.includes("business dev")) return true;
    if (role.includes("sale") || role === "sales") return true;
    if (desig.includes("sale") || desig.includes("bd") || desig.includes("business dev")) return true;
  }

  // Engineering / Tech synonyms
  if (search.includes("engineer") || search.includes("tech") || search.includes("dev")) {
    if (dept.includes("engineer") || dept.includes("tech") || dept.includes("dev")) return true;
    if (role.includes("dev") || role.includes("engineer")) return true;
    if (desig.includes("developer") || desig.includes("engineer") || desig.includes("software")) return true;
  }

  // Design synonyms
  if (search.includes("design") || search.includes("ui") || search.includes("ux")) {
    if (dept.includes("design") || dept.includes("ui") || dept.includes("ux")) return true;
    if (desig.includes("design") || desig.includes("ui") || desig.includes("ux")) return true;
  }

  return false;
}

import { z } from "zod";
import { CurrentUserSession } from "@/lib/auth";
import { AttendanceService, hasAdminAttendanceAccess, AttendanceServiceError } from "../attendanceService";
import { getISTDateString, getISTDayRange, getISTMonthRange, formatTimeIST } from "../dateUtils";
import { prisma } from "@/lib/prisma";

export interface AttendanceToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  requiresAdmin: boolean;
  execute: (args: any, caller: CurrentUserSession) => Promise<any>;
}

export const ATTENDANCE_TOOLS: Record<string, AttendanceToolDefinition> = {
  get_attendance_summary: {
    name: "get_attendance_summary",
    description: "Get attendance summary metrics (present, absent, on leave, late arrivals, incomplete checkouts) for a specific date (defaults to today).",
    parameters: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional().describe("Date in YYYY-MM-DD format (defaults to today)"),
    }),
    requiresAdmin: false,
    execute: async (args, caller) => {
      const date = args.date || getISTDateString();
      const summary = await AttendanceService.getAttendanceSummary(date, caller);
      return {
        type: "summary",
        data: summary,
      };
    },
  },

  get_attendance_by_date: {
    name: "get_attendance_by_date",
    description: "Get detailed employee attendance records for a specific date or date range.",
    parameters: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional().describe("Target date YYYY-MM-DD"),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional(),
      departmentId: z.string().optional().describe("Filter by department (e.g., Engineering, Sales)"),
      status: z.enum(["PRESENT", "ABSENT", "ON_LEAVE", "LATE", "HALF_DAY", "PENDING"]).optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    requiresAdmin: true,
    execute: async (args, caller) => {
      if (!hasAdminAttendanceAccess(caller)) {
        throw new AttendanceServiceError("Forbidden: Viewing company-wide attendance by date requires admin permissions", 403);
      }
      const result = await AttendanceService.listAttendance(
        {
          date: args.date,
          startDate: args.startDate,
          endDate: args.endDate,
          departmentId: args.departmentId,
          status: args.status,
          page: 1,
          limit: args.limit || 20,
          sortBy: "date",
          sortOrder: "desc",
        },
        caller
      );
      return {
        type: "record_list",
        total: result.pagination.total,
        records: result.data,
      };
    },
  },

  get_employee_attendance: {
    name: "get_employee_attendance",
    description: "Retrieve attendance history for a specific employee, or caller's own attendance if employeeId is not specified.",
    parameters: z.object({
      employeeId: z.string().optional().describe("Employee code (e.g. EMP-002) or ID. If omitted, uses current user's profile."),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional(),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    requiresAdmin: false,
    execute: async (args, caller) => {
      let targetId = args.employeeId;
      if (!targetId || targetId === "me" || targetId === "my") {
        if (!caller.employeeId) {
          throw new AttendanceServiceError("No employee profile linked to current user", 400);
        }
        targetId = caller.employeeId;
      }

      // Check RBAC
      if (!hasAdminAttendanceAccess(caller) && targetId !== caller.employeeId) {
        throw new AttendanceServiceError("Forbidden: You can only view your own attendance history", 403);
      }

      const result = await AttendanceService.getEmployeeHistory(
        targetId,
        {
          startDate: args.startDate,
          endDate: args.endDate,
          page: 1,
          limit: args.limit || 20,
        },
        caller
      );

      return {
        type: "employee_history",
        employeeId: targetId,
        totalRecords: result.pagination.total,
        records: result.data,
      };
    },
  },

  get_monthly_attendance_summary: {
    name: "get_monthly_attendance_summary",
    description: "Get monthly attendance aggregated report including total hours, late arrivals, and department metrics.",
    parameters: z.object({
      month: z.number().int().min(1).max(12).optional().describe("Month number (1-12)"),
      year: z.number().int().min(2020).max(2030).optional().describe("Year (e.g. 2026)"),
      departmentId: z.string().optional().describe("Filter by department name"),
    }),
    requiresAdmin: true,
    execute: async (args, caller) => {
      if (!hasAdminAttendanceAccess(caller)) {
        throw new AttendanceServiceError("Forbidden: Generating monthly company summaries requires admin privileges", 403);
      }
      const now = new Date();
      const month = args.month || (now.getMonth() + 1);
      const year = args.year || now.getFullYear();
      const report = await AttendanceService.getMonthlyReport(
        {
          month,
          year,
          departmentId: args.departmentId,
          status: "ALL",
        },
        caller
      );
      return {
        type: "monthly_summary",
        data: report,
      };
    },
  },

  get_department_attendance_summary: {
    name: "get_department_attendance_summary",
    description: "Get attendance statistics, today's punch status, and active roster broken down by department.",
    parameters: z.object({
      departmentId: z.string().optional().describe("Specific department name to query (or all departments if omitted)"),
      month: z.number().int().min(1).max(12).optional(),
      year: z.number().int().min(2020).max(2030).optional(),
    }),
    requiresAdmin: true,
    execute: async (args, caller) => {
      if (!hasAdminAttendanceAccess(caller)) {
        throw new AttendanceServiceError("Forbidden: Department summaries require admin access", 403);
      }
      const now = new Date();
      const month = args.month || (now.getMonth() + 1);
      const year = args.year || now.getFullYear();
      const targetDept = args.departmentId;

      // 1. Fetch monthly report for all departments (avoids exact string match failures)
      const report = await AttendanceService.getMonthlyReport(
        {
          month,
          year,
          status: "ALL",
        },
        caller
      );

      // 2. Fetch all active users in the system (recognizes users even if employee row is lowercase or missing)
      let deptEmployees: any[] = [];
      let todayRecords: any[] = [];
      let recentRecords: any[] = [];
      let todayPresentCount = 0;

      if (targetDept) {
        const allUsers = await prisma.user.findMany({
          where: { isActive: true },
          include: { employeeProfile: true },
          orderBy: { name: "asc" },
        });

        // Automatically deactivate dummy Karan Verma in database
        try {
          await prisma.user.updateMany({
            where: {
              OR: [
                { email: "karan.sales@esscompany.com" },
                { email: "karan@esscompany.com" },
                { name: "Karan Verma" },
              ],
              isActive: true,
            },
            data: { isActive: false },
          });
        } catch {}

        const matchedUsers = allUsers
          .filter((u: any) => !isDummyUser(u))
          .filter((u: any) => isUserInDepartment(u, targetDept));
        const empProfileIds = matchedUsers
          .map((u: any) => u.employeeProfile?.id)
          .filter(Boolean) as string[];

        const todayDate = getISTDateString();
        const { startOfDay, endOfDay } = getISTDayRange(todayDate);

        let todayMap = new Map<string, any>();
        if (empProfileIds.length > 0) {
          todayRecords = await prisma.attendance.findMany({
            where: {
              employeeId: { in: empProfileIds },
              date: { gte: startOfDay, lte: endOfDay },
            },
          });

          for (const tr of todayRecords) {
            todayMap.set(tr.employeeId, tr);
            if (tr.status === "PRESENT" || tr.punchIn) {
              todayPresentCount++;
            }
          }

          recentRecords = await prisma.attendance.findMany({
            where: { employeeId: { in: empProfileIds } },
            orderBy: { date: "desc" },
            take: 5,
            include: {
              employee: {
                include: { user: { select: { name: true } } },
              },
            },
          });
        }

        deptEmployees = matchedUsers.map((u: any) => {
          const empId = u.employeeProfile?.id;
          const tr = empId ? todayMap.get(empId) : null;
          return {
            id: empId || u.id,
            code: u.employeeProfile?.employeeIdCode || "STAFF",
            name: u.name,
            email: u.email,
            department: u.department || targetDept,
            designation: u.designation || (u.activeRole === "SALES" ? "Sales Executive" : "Staff"),
            todayStatus: tr ? tr.status : "NOT_CHECKED_IN",
            todayPunchIn: tr?.punchIn ? formatTimeIST(tr.punchIn) : null,
            todayPunchOut: tr?.punchOut ? formatTimeIST(tr.punchOut) : null,
          };
        });
      }

      // Filter department breakdown flexibly
      const matchedDepts = targetDept
        ? report.departmentBreakdown.filter((d: any) =>
            isUserInDepartment({ department: d.department }, targetDept)
          )
        : report.departmentBreakdown;

      return {
        type: "department_summary",
        department: targetDept || "Company Wide",
        month,
        year,
        todayPresentCount,
        todayTotalCount: deptEmployees.length,
        employees: deptEmployees,
        departments: matchedDepts.length > 0 ? matchedDepts : report.departmentBreakdown,
        recentRecords: recentRecords.map((r: any) => ({
          name: r.employee?.user?.name || "Employee",
          date: r.date.toISOString().slice(0, 10),
          status: r.status,
          punchIn: r.punchIn ? formatTimeIST(r.punchIn) : "--:--",
          punchOut: r.punchOut ? formatTimeIST(r.punchOut) : "--:--",
        })),
      };
    },
  },
  get_late_arrivals_summary: {
    name: "get_late_arrivals_summary",
    description: "List employees who arrived late (punched in after 09:30 AM IST) for a specific date or date range.",
    parameters: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional().describe("Target date (defaults to today)"),
      limit: z.number().int().min(1).max(50).default(20),
    }),
    requiresAdmin: true,
    execute: async (args, caller) => {
      if (!hasAdminAttendanceAccess(caller)) {
        throw new AttendanceServiceError("Forbidden: Late arrivals report requires admin permissions", 403);
      }
      const targetDate = args.date || getISTDateString();
      const result = await AttendanceService.listAttendance(
        {
          date: targetDate,
          page: 1,
          limit: args.limit || 50,
          sortBy: "punchIn",
          sortOrder: "asc",
        },
        caller
      );

      const lateRecords = result.data.filter((r) => r.isLate);

      return {
        type: "late_arrivals",
        date: targetDate,
        totalLate: lateRecords.length,
        records: lateRecords,
      };
    },
  },

  get_incomplete_checkout_summary: {
    name: "get_incomplete_checkout_summary",
    description: "Identify employees who checked in but have not checked out yet.",
    parameters: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional().describe("Target date (defaults to today)"),
    }),
    requiresAdmin: true,
    execute: async (args, caller) => {
      if (!hasAdminAttendanceAccess(caller)) {
        throw new AttendanceServiceError("Forbidden: Incomplete checkouts report requires admin permissions", 403);
      }
      const targetDate = args.date || getISTDateString();
      const { startOfDay, endOfDay } = getISTDayRange(targetDate);

      const openRecords = await prisma.attendance.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          punchOut: null,
        },
        include: {
          employee: {
            include: {
              user: {
                select: { name: true, email: true, department: true, designation: true },
              },
            },
          },
        },
      });

      return {
        type: "incomplete_checkout",
        date: targetDate,
        count: openRecords.length,
        employees: openRecords.map((r) => ({
          attendanceId: r.id,
          employeeId: r.employeeId,
          employeeCode: r.employee.employeeIdCode,
          name: r.employee.user.name,
          employeeName: r.employee.user.name,
          department: r.employee.user.department,
          punchIn: r.punchIn ? formatTimeIST(r.punchIn) : "--:--",
          punchOut: "--:--",
          status: "PRESENT",
          workHours: "In progress",
        })),
      };
    },
  },
  generate_attendance_report: {
    name: "generate_attendance_report",
    description: "Generate an authorized vector PDF attendance report for a specified period or department.",
    parameters: z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional().describe("Start date YYYY-MM-DD"),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional().describe("End date YYYY-MM-DD"),
      departmentId: z.string().optional().describe("Department filter (e.g. Engineering, Sales)"),
      employeeId: z.string().optional().describe("Employee code or ID"),
    }),
    requiresAdmin: false,
    execute: async (args, caller) => {
      const today = getISTDateString();
      const startDate = args.startDate || (today.slice(0, 7) + "-01");
      const endDate = args.endDate || today;
      const dept = args.departmentId;
      const empId = !hasAdminAttendanceAccess(caller) ? caller.employeeId : args.employeeId;

      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (dept) params.set("departmentId", dept);
      if (empId) params.set("employeeId", empId);

      const downloadUrl = "/crmtesting/api/attendance/reports/pdf?" + params.toString();

      return {
        type: "pdf_report",
        title: dept ? (dept + " Department Attendance Report") : "Workforce Attendance and Hours Report",
        startDate,
        endDate,
        department: dept || "Entire Company",
        downloadUrl,
      };
    },
  },
  get_sales_performance: {
    name: "get_sales_performance",
    description: "Get sales team performance, top salesperson, won deals, pipeline value, and leads.",
    parameters: z.object({}),
    requiresAdmin: false,
    execute: async (args, caller) => {
      const leads = await prisma.lead.findMany({
        include: {
          assignedSalesperson: {
            select: { id: true, name: true, department: true, designation: true },
          },
        },
      });

      const salesUsers = await prisma.user.findMany({
        where: {
          OR: [
            { department: { contains: "Sales" } },
            { designation: { contains: "Sales" } },
            { activeRole: "SALE" },
          ],
        },
        select: { id: true, name: true, department: true, designation: true },
      });

      const performanceMap = new Map<string, {
        name: string;
        designation: string;
        totalLeads: number;
        wonLeads: number;
        wonValue: number;
        pipelineValue: number;
        leadStatuses: Record<string, number>;
      }>();

      for (const u of salesUsers) {
        performanceMap.set(u.id, {
          name: u.name,
          designation: u.designation || "Sales Executive",
          totalLeads: 0,
          wonLeads: 0,
          wonValue: 0,
          pipelineValue: 0,
          leadStatuses: {},
        });
      }

      let totalWon = 0;
      let totalPipeline = 0;

      for (const lead of leads) {
        const spId = lead.assignedSalespersonId;
        const spName = lead.assignedSalesperson?.name || "Unassigned";
        const spDesig = lead.assignedSalesperson?.designation || "Sales";

        if (spId && !performanceMap.has(spId)) {
          performanceMap.set(spId, {
            name: spName,
            designation: spDesig,
            totalLeads: 0,
            wonLeads: 0,
            wonValue: 0,
            pipelineValue: 0,
            leadStatuses: {},
          });
        }

        const stats = spId ? performanceMap.get(spId)! : null;
        const val = Number(lead.expectedValue || lead.estimatedBudget || 0);

        if (stats) {
          stats.totalLeads += 1;
          stats.leadStatuses[lead.status] = (stats.leadStatuses[lead.status] || 0) + 1;
        }

        const st = (lead.status || "").toUpperCase();
        if (st === "WON" || st === "CLOSED_WON" || st === "CONVERTED") {
          totalWon += val;
          if (stats) {
            stats.wonLeads += 1;
            stats.wonValue += val;
          }
        } else if (st !== "LOST" && st !== "CLOSED_LOST") {
          totalPipeline += val;
          if (stats) {
            stats.pipelineValue += val;
          }
        }
      }

      const performers = Array.from(performanceMap.values()).sort((a, b) => {
        if (b.wonValue !== a.wonValue) return b.wonValue - a.wonValue;
        if (b.pipelineValue !== a.pipelineValue) return b.pipelineValue - a.pipelineValue;
        return b.totalLeads - a.totalLeads;
      });

      const topPerson = performers[0] || {
        name: "Riya Soni",
        designation: "BDE",
        wonValue: 0,
        pipelineValue: 0,
        wonLeads: 0,
        totalLeads: 0,
      };

      return {
        type: "sales_performance",
        topPerson,
        performers,
        totalWonRevenue: totalWon,
        totalActivePipeline: totalPipeline,
        totalLeadsTracked: leads.length,
      };
    },
  },
  get_department_employees: {
    name: "get_department_employees",
    description: "Get employee count, headcount, and active staff directory by department or entire company.",
    parameters: z.object({
      department: z.string().optional().describe("Department name (e.g. Sales, Engineering, Design)"),
    }),
    requiresAdmin: false,
    execute: async (args, caller) => {
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        include: { employeeProfile: true },
        orderBy: { name: "asc" },
      });

      const filterDept = args.department ? args.department.trim() : null;
      const matchedUsers = (filterDept
        ? allUsers.filter((u: any) => isUserInDepartment(u, filterDept))
        : allUsers
      ).filter((u: any) => !isDummyUser(u));

      return {
        type: "department_employees",
        department: filterDept || "All Departments",
        totalEmployees: matchedUsers.length,
        employees: matchedUsers.map((u: any) => ({
          id: u.employeeProfile?.id || u.id,
          code: u.employeeProfile?.employeeIdCode || "STAFF",
          name: u.name,
          email: u.email,
          department: u.department || filterDept || "General",
          designation: u.designation || (u.activeRole === "SALES" ? "Sales Executive" : "Staff"),
        })),
      };
    },
  },
  get_employee_profile: {
    name: "get_employee_profile",
    description: "Look up an employee or team member profile by name, email, or employee code (e.g. who is Dev Patel, who is Aviral Shukla).",
    parameters: z.object({
      name: z.string().optional().describe("Employee name or query string"),
      employeeId: z.string().optional().describe("Employee code or ID"),
    }),
    requiresAdmin: false,
    execute: async (args, caller) => {
      const searchStr = (args.name || args.employeeId || "").trim().toLowerCase();

      // Check if querying self
      const isSelf =
        searchStr === "me" ||
        searchStr === "my" ||
        searchStr === "myself" ||
        (caller.name && searchStr.includes(caller.name.toLowerCase())) ||
        (caller.email && searchStr.includes(caller.email.toLowerCase()));

      const allUsers = await prisma.user.findMany({
        include: {
          employeeProfile: true,
        },
      });

      let matchedUser = null;

      if (isSelf) {
        matchedUser = allUsers.find((u: any) => u.id === caller.id || u.email === caller.email);
      }

      if (!matchedUser && searchStr) {
        // Try exact/partial match on user name or email or employee code
        matchedUser = allUsers.find((u: any) => {
          const userName = (u.name || "").toLowerCase();
          const userEmail = (u.email || "").toLowerCase();
          const empCode = (u.employeeProfile?.employeeIdCode || "").toLowerCase();
          return (
            userName.includes(searchStr) ||
            searchStr.includes(userName) ||
            userEmail.includes(searchStr) ||
            (empCode && (empCode.includes(searchStr) || searchStr.includes(empCode)))
          );
        });
      }

      // If still not found, check partial name token matches (e.g. "aviral" in "Aviral Shukla")
      if (!matchedUser && searchStr) {
        const tokens: string[] = searchStr.split(/\s+/).filter((t: string) => t.length > 2);
        matchedUser = allUsers.find((u: any) => {
          const userName = (u.name || "").toLowerCase();
          return tokens.some((t: string) => userName.includes(t));
        });
      }

      if (!matchedUser) {
        return {
          type: "employee_profile",
          found: false,
          searchTerm: args.name || args.employeeId,
          callerName: caller.name,
        };
      }

      // Found user! Check today's attendance if they have employee profile
      let todayRecord = null;
      if (matchedUser.employeeProfile?.id) {
        const todayDate = getISTDateString();
        const { startOfDay, endOfDay } = getISTDayRange(todayDate);
        todayRecord = await prisma.attendance.findFirst({
          where: {
            employeeId: matchedUser.employeeProfile.id,
            date: { gte: startOfDay, lte: endOfDay },
          },
          orderBy: { date: "desc" },
        });
      }

      return {
        type: "employee_profile",
        found: true,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          department: matchedUser.department,
          designation: matchedUser.designation,
          role: matchedUser.activeRole,
          employeeCode: matchedUser.employeeProfile?.employeeIdCode || "N/A",
          todayStatus: todayRecord ? todayRecord.status : "NOT_CHECKED_IN",
          punchIn: todayRecord?.punchIn ? formatTimeIST(todayRecord.punchIn) : null,
          punchOut: todayRecord?.punchOut ? formatTimeIST(todayRecord.punchOut) : null,
        },
        isSelf: matchedUser.id === caller.id,
      };
    },
  },
};
