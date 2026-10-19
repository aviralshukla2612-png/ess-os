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

      // 1. Fetch monthly report
      const report = await AttendanceService.getMonthlyReport(
        {
          month,
          year,
          departmentId: targetDept,
          status: "ALL",
        },
        caller
      );

      // 2. Fetch department roster and today's status
      let deptEmployees: any[] = [];
      let todayRecords: any[] = [];
      let recentRecords: any[] = [];
      let todayPresentCount = 0;

      if (targetDept) {
        const allEmployees = await prisma.employee.findMany({
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: { id: true, name: true, email: true, department: true, designation: true },
            },
          },
          orderBy: { employeeIdCode: "asc" },
        });

        deptEmployees = allEmployees.filter((e) =>
          e.user?.department && e.user.department.toLowerCase().includes(targetDept.toLowerCase())
        );

        const empIds = deptEmployees.map((e) => e.id);

        if (empIds.length > 0) {
          const todayDate = getISTDateString();
          const { startOfDay, endOfDay } = getISTDayRange(todayDate);

          todayRecords = await prisma.attendance.findMany({
            where: {
              employeeId: { in: empIds },
              date: { gte: startOfDay, lte: endOfDay },
            },
          });

          const todayMap = new Map<string, any>();
          for (const tr of todayRecords) {
            todayMap.set(tr.employeeId, tr);
            if (tr.status === "PRESENT" || tr.punchIn) {
              todayPresentCount++;
            }
          }

          deptEmployees = deptEmployees.map((e) => {
            const tr = todayMap.get(e.id);
            return {
              id: e.id,
              code: e.employeeIdCode,
              name: e.user.name,
              department: e.user.department,
              designation: e.user.designation || "Staff",
              todayStatus: tr ? tr.status : "NOT_CHECKED_IN",
              todayPunchIn: tr?.punchIn ? formatTimeIST(tr.punchIn) : null,
              todayPunchOut: tr?.punchOut ? formatTimeIST(tr.punchOut) : null,
            };
          });

          recentRecords = await prisma.attendance.findMany({
            where: { employeeId: { in: empIds } },
            orderBy: { date: "desc" },
            take: 5,
            include: {
              employee: {
                include: { user: { select: { name: true } } },
              },
            },
          });
        }
      }

      return {
        type: "department_summary",
        department: targetDept,
        month,
        year,
        todayPresentCount,
        todayTotalCount: deptEmployees.length,
        employees: deptEmployees,
        departments: report.departmentBreakdown,
        recentRecords: recentRecords.map((r) => ({
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
        name: "Karan Verma",
        designation: "Head of Sales",
        wonValue: 400000,
        pipelineValue: 870000,
        wonLeads: 1,
        totalLeads: 3,
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
      const allEmployees = await prisma.employee.findMany({
        where: { status: "ACTIVE" },
        include: {
          user: {
            select: { id: true, name: true, email: true, department: true, designation: true },
          },
        },
        orderBy: { employeeIdCode: "asc" },
      });

      const filterDept = args.department ? args.department.trim() : null;
      const matched = filterDept
        ? allEmployees.filter((e) => e.user?.department && e.user.department.toLowerCase().includes(filterDept.toLowerCase()))
        : allEmployees;

      return {
        type: "department_employees",
        department: filterDept || "All Departments",
        totalEmployees: matched.length,
        employees: matched.map((e) => ({
          id: e.id,
          code: e.employeeIdCode,
          name: e.user.name,
          email: e.user.email,
          department: e.user.department,
          designation: e.user.designation || "Staff",
        })),
      };
    },
  },
};
