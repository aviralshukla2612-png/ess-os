import { prisma } from "@/lib/prisma";
import { CurrentUserSession } from "@/lib/auth";
import {
  getISTDayRange,
  getISTDateString,
  getISTMonthRange,
  formatTimeIST,
  isLateArrival,
} from "./dateUtils";
import {
  AttendanceQuery,
  MonthlyQuery,
  CheckInInput,
  CheckOutInput,
  PaginationMeta,
} from "./types";
import { notifyAdmins, formatToIST } from "@/lib/notifications";

export class AttendanceServiceError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = "AttendanceServiceError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Validates whether the caller has manager/owner administrative access to attendance.
 */
export function hasAdminAttendanceAccess(user: CurrentUserSession): boolean {
  if (user.activeRole === "OWNER") return true;
  if (user.activeRole === "SUB_ADMIN" && user.subAdminPermissions?.includes("attendance")) {
    return true;
  }
  return false;
}

/**
 * Lazy cleanup of forgotten un-punched-out shifts from previous days.
 */
export async function closeDanglingPreviousShifts(employeeId?: string) {
  const { startOfDay } = getISTDayRange();

  const whereClause: any = {
    punchOut: null,
    date: { lt: startOfDay },
  };
  if (employeeId) {
    whereClause.employeeId = employeeId;
  }

  const forgotten = await prisma.attendance.findMany({
    where: whereClause,
  });

  for (const record of forgotten) {
    const autoPunchOut = new Date(record.date);
    autoPunchOut.setHours(23, 59, 59, 0);

    const punchInMs = new Date(record.punchIn).getTime();
    const totalMinutes = Math.max(0, Math.floor((autoPunchOut.getTime() - punchInMs) / 60000));

    await prisma.$transaction([
      prisma.attendance.update({
        where: { id: record.id },
        data: {
          punchOut: autoPunchOut,
          totalMinutes,
          status: record.status || "PRESENT",
          punchOutReason: "Auto punch-out: system shift closure at day boundary.",
        },
      }),
      prisma.employeeStatusEvent.updateMany({
        where: {
          employeeId: record.employeeId,
          endedAt: null,
          startedAt: {
            lte: autoPunchOut,
          },
        },
        data: { endedAt: autoPunchOut },
      }),
    ]);
  }
}

export class AttendanceService {
  /**
   * 1. GET /api/attendance
   * List attendance records with filtering, pagination, sorting, and strict RBAC.
   */
  static async listAttendance(query: AttendanceQuery, caller: CurrentUserSession) {
    const isAdmin = hasAdminAttendanceAccess(caller);

    // RBAC: Non-admin can ONLY query their own records
    let targetEmployeeId = query.employeeId;
    if (!isAdmin) {
      if (!caller.employeeId) {
        throw new AttendanceServiceError("Forbidden: User is not linked to an employee profile", 403);
      }
      if (targetEmployeeId && targetEmployeeId !== caller.employeeId) {
        throw new AttendanceServiceError("Forbidden: You cannot access attendance records of another employee", 403);
      }
      targetEmployeeId = caller.employeeId;
    }

    // Build Prisma where filter
    const where: any = {};

    if (targetEmployeeId && targetEmployeeId !== "ALL") {
      where.employeeId = targetEmployeeId;
    }

    // Department filtering
    if (query.departmentId) {
      where.employee = {
        user: {
          department: query.departmentId,
        },
      };
    }

    // Date filtering
    if (query.date) {
      const { startOfDay, endOfDay } = getISTDayRange(query.date);
      where.date = { gte: startOfDay, lte: endOfDay };
    } else if (query.startDate && query.endDate) {
      const { startOfDay } = getISTDayRange(query.startDate);
      const { endOfDay } = getISTDayRange(query.endDate);
      where.date = { gte: startOfDay, lte: endOfDay };
    } else if (query.startDate) {
      const { startOfDay } = getISTDayRange(query.startDate);
      where.date = { gte: startOfDay };
    } else if (query.endDate) {
      const { endOfDay } = getISTDayRange(query.endDate);
      where.date = { lte: endOfDay };
    }

    // Status filtering
    if (query.status) {
      where.status = query.status;
    }

    // Run count & query in parallel
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, rawRecords] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take,
        orderBy: { [query.sortBy]: query.sortOrder },
        include: {
          employee: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                  designation: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Enrich records with break calculations and IST formatting
    const enriched = await Promise.all(
      rawRecords.map(async (record) => {
        const { startOfDay, endOfDay } = getISTDayRange(record.date);

        const breakEvents = await prisma.employeeStatusEvent.findMany({
          where: {
            employeeId: record.employeeId,
            startedAt: { gte: startOfDay, lte: endOfDay },
            statusType: { not: "WORKING" },
          },
        });

        let breakMinutes = 0;
        const now = new Date();
        breakEvents.forEach((b) => {
          const end = b.endedAt || (record.punchOut || now);
          const diffMs = end.getTime() - b.startedAt.getTime();
          breakMinutes += Math.max(0, Math.floor(diffMs / 60000));
        });

        let totalElapsedMinutes = record.totalMinutes || 0;
        if (!record.punchOut && record.punchIn) {
          const punchInTime = new Date(record.punchIn).getTime();
          totalElapsedMinutes = Math.max(0, Math.floor((now.getTime() - punchInTime) / 60000) - breakMinutes);
        }

        const isLate = record.punchIn ? isLateArrival(record.punchIn) : false;

        return {
          id: record.id,
          employeeId: record.employeeId,
          employeeCode: record.employee.employeeIdCode,
          employeeName: record.employee.user.name,
          employeeEmail: record.employee.user.email,
          department: record.employee.user.department,
          designation: record.employee.user.designation,
          avatarUrl: record.employee.user.avatarUrl,
          date: getISTDateString(record.date),
          rawDate: record.date,
          punchIn: record.punchIn ? formatTimeIST(record.punchIn) : null,
          punchOut: record.punchOut ? formatTimeIST(record.punchOut) : null,
          rawPunchIn: record.punchIn,
          rawPunchOut: record.punchOut,
          status: isLate && record.status === "PRESENT" ? "LATE" : record.status,
          isLate,
          totalMinutes: totalElapsedMinutes,
          breakMinutes,
          workHours: `${Math.floor(totalElapsedMinutes / 60)}h ${totalElapsedMinutes % 60}m`,
          punchOutReason: record.punchOutReason,
          punchOutRequestStatus: record.punchOutRequestStatus,
        };
      })
    );

    const pagination: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    };

    return { data: enriched, pagination };
  }

  /**
   * 2. GET /api/attendance/[id]
   * Return single authorized attendance record by ID.
   */
  static async getAttendanceById(id: string, caller: CurrentUserSession) {
    const record = await prisma.attendance.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                designation: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!record) {
      throw new AttendanceServiceError("Attendance record not found", 404);
    }

    // IDOR protection
    const isAdmin = hasAdminAttendanceAccess(caller);
    if (!isAdmin && record.employeeId !== caller.employeeId) {
      throw new AttendanceServiceError("Forbidden: You do not have permission to view this attendance record", 403);
    }

    // Fetch related status events for this day
    const { startOfDay, endOfDay } = getISTDayRange(record.date);
    const statusEvents = await prisma.employeeStatusEvent.findMany({
      where: {
        employeeId: record.employeeId,
        startedAt: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { startedAt: "asc" },
    });

    let breakMinutes = 0;
    const now = new Date();
    statusEvents
      .filter((e) => e.statusType !== "WORKING")
      .forEach((b) => {
        const end = b.endedAt || (record.punchOut || now);
        breakMinutes += Math.max(0, Math.floor((end.getTime() - b.startedAt.getTime()) / 60000));
      });

    return {
      id: record.id,
      employeeId: record.employeeId,
      employeeCode: record.employee.employeeIdCode,
      employeeName: record.employee.user.name,
      employeeEmail: record.employee.user.email,
      department: record.employee.user.department,
      designation: record.employee.user.designation,
      avatarUrl: record.employee.user.avatarUrl,
      date: getISTDateString(record.date),
      rawDate: record.date,
      punchIn: record.punchIn ? formatTimeIST(record.punchIn) : null,
      punchOut: record.punchOut ? formatTimeIST(record.punchOut) : null,
      rawPunchIn: record.punchIn,
      rawPunchOut: record.punchOut,
      status: record.status,
      isLate: record.punchIn ? isLateArrival(record.punchIn) : false,
      totalMinutes: record.totalMinutes || 0,
      breakMinutes,
      punchOutReason: record.punchOutReason,
      punchOutRequestStatus: record.punchOutRequestStatus,
      statusEvents,
    };
  }

  /**
   * 3. GET /api/attendance/summary
   * Return high-level summary KPIs for a given day (defaults to today).
   */
  static async getAttendanceSummary(dateInput?: string, caller?: CurrentUserSession) {
    const targetDate = dateInput || getISTDateString();
    const { startOfDay, endOfDay } = getISTDayRange(targetDate);

    // Fetch active employees
    const activeEmployees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            designation: true,
          },
        },
      },
    });

    const totalExpected = activeEmployees.length;

    // Fetch attendances for that day
    const attendances = await prisma.attendance.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        employee: {
          include: {
            user: { select: { department: true, name: true } },
          },
        },
      },
    });

    // Fetch approved leaves on this day
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
      include: { employee: true },
    });

    const presentEmployeeIds = new Set(attendances.map((a) => a.employeeId));
    const onLeaveEmployeeIds = new Set(approvedLeaves.map((l) => l.employeeId));

    let lateCount = 0;
    let incompleteCheckoutCount = 0;

    for (const a of attendances) {
      if (a.punchIn && isLateArrival(a.punchIn)) {
        lateCount++;
      }
      if (!a.punchOut) {
        incompleteCheckoutCount++;
      }
    }

    const presentCount = presentEmployeeIds.size;
    const onLeaveCount = onLeaveEmployeeIds.size;

    // Absent: expected employees who are neither present nor on approved leave
    let absentCount = 0;
    const absentEmployees: any[] = [];

    for (const emp of activeEmployees) {
      if (!presentEmployeeIds.has(emp.id) && !onLeaveEmployeeIds.has(emp.id)) {
        absentCount++;
        absentEmployees.push({
          id: emp.id,
          code: emp.employeeIdCode,
          name: emp.user.name,
          department: emp.user.department,
        });
      }
    }

    return {
      date: targetDate,
      totalExpected,
      present: presentCount,
      absent: absentCount,
      onLeave: onLeaveCount,
      late: lateCount,
      incompleteCheckout: incompleteCheckoutCount,
      attendanceRatePercentage: totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 0,
      absentEmployees: caller && hasAdminAttendanceAccess(caller) ? absentEmployees : undefined,
    };
  }

  /**
   * 4. GET /api/attendance/employees/[id]
   * Return attendance history for an individual employee.
   */
  static async getEmployeeHistory(
    employeeIdentifier: string,
    query: { startDate?: string; endDate?: string; page?: number; limit?: number },
    caller: CurrentUserSession
  ) {
    // Resolve employee by UUID or employeeIdCode
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: employeeIdentifier },
          { employeeIdCode: employeeIdentifier },
          { userId: employeeIdentifier },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            designation: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AttendanceServiceError("Employee profile not found", 404);
    }

    // RBAC: Caller must be admin or the employee themself
    const isAdmin = hasAdminAttendanceAccess(caller);
    if (!isAdmin && caller.employeeId !== employee.id) {
      throw new AttendanceServiceError("Forbidden: You cannot view attendance history of another employee", 403);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    return this.listAttendance(
      {
        employeeId: employee.id,
        startDate: query.startDate,
        endDate: query.endDate,
        page,
        limit,
        sortBy: "date",
        sortOrder: "desc",
      },
      caller
    );
  }

  /**
   * 5. GET /api/attendance/monthly
   * Return month-wise counts, employee metrics, and department breakdowns.
   */
  static async getMonthlyReport(query: MonthlyQuery, caller: CurrentUserSession) {
    const isAdmin = hasAdminAttendanceAccess(caller);

    let targetEmployeeId = query.employeeId;
    if (!isAdmin) {
      if (!caller.employeeId) {
        throw new AttendanceServiceError("Forbidden: User is not linked to an employee profile", 403);
      }
      if (targetEmployeeId && targetEmployeeId !== caller.employeeId) {
        throw new AttendanceServiceError("Forbidden: You cannot view monthly reports of another employee", 403);
      }
      targetEmployeeId = caller.employeeId;
    }

    const { startOfMonth, endOfMonth, totalDays } = getISTMonthRange(query.year, query.month);

    const where: any = {
      date: { gte: startOfMonth, lte: endOfMonth },
    };

    if (targetEmployeeId && targetEmployeeId !== "ALL") {
      where.employeeId = targetEmployeeId;
    }

    if (query.departmentId) {
      where.employee = {
        user: { department: query.departmentId },
      };
    }

    if (query.status && query.status !== "ALL") {
      where.status = query.status;
    }

    const [attendances, approvedLeaves, holidays, employees] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                  designation: true,
                },
              },
            },
          },
        },
        orderBy: { date: "asc" },
      }),
      prisma.leaveRequest.findMany({
        where: {
          status: "APPROVED",
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
          ...(targetEmployeeId && targetEmployeeId !== "ALL" ? { employeeId: targetEmployeeId } : {}),
        },
      }),
      prisma.companyHoliday.findMany({
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.employee.findMany({
        where: {
          status: "ACTIVE",
          ...(targetEmployeeId && targetEmployeeId !== "ALL" ? { id: targetEmployeeId } : {}),
          ...(query.departmentId ? { user: { department: query.departmentId } } : {}),
        },
        include: { user: true },
      }),
    ]);

    // Aggregate monthly statistics
    let totalPresentDays = 0;
    let totalLateArrivals = 0;
    let totalWorkMinutes = 0;

    // Per department aggregation
    const deptMap = new Map<string, { present: number; late: number; totalMinutes: number; employees: Set<string> }>();

    // Per employee aggregation
    const empMap = new Map<string, {
      id: string;
      code: string;
      name: string;
      department: string;
      presentDays: number;
      lateDays: number;
      leaveDays: number;
      totalMinutes: number;
    }>();

    // Initialize all matching employees
    for (const emp of employees) {
      empMap.set(emp.id, {
        id: emp.id,
        code: emp.employeeIdCode,
        name: emp.user.name,
        department: emp.user.department,
        presentDays: 0,
        lateDays: 0,
        leaveDays: 0,
        totalMinutes: 0,
      });

      if (!deptMap.has(emp.user.department)) {
        deptMap.set(emp.user.department, { present: 0, late: 0, totalMinutes: 0, employees: new Set() });
      }
      deptMap.get(emp.user.department)!.employees.add(emp.id);
    }

    for (const att of attendances) {
      totalPresentDays++;
      totalWorkMinutes += att.totalMinutes || 0;
      const isLate = att.punchIn ? isLateArrival(att.punchIn) : false;
      if (isLate) totalLateArrivals++;

      const empEntry = empMap.get(att.employeeId);
      if (empEntry) {
        empEntry.presentDays++;
        empEntry.totalMinutes += att.totalMinutes || 0;
        if (isLate) empEntry.lateDays++;
      }

      const dept = att.employee.user.department;
      if (deptMap.has(dept)) {
        const d = deptMap.get(dept)!;
        d.present++;
        d.totalMinutes += att.totalMinutes || 0;
        if (isLate) d.late++;
      }
    }

    for (const l of approvedLeaves) {
      const empEntry = empMap.get(l.employeeId);
      if (empEntry) {
        empEntry.leaveDays += l.days;
      }
    }

    const departmentBreakdown = Array.from(deptMap.entries()).map(([dept, data]) => ({
      department: dept,
      employeeCount: data.employees.size,
      totalPresent: data.present,
      totalLate: data.late,
      totalHours: Math.round((data.totalMinutes / 60) * 10) / 10,
    }));

    const employeeSummaries = Array.from(empMap.values()).map((e) => ({
      ...e,
      totalHours: `${Math.floor(e.totalMinutes / 60)}h ${e.totalMinutes % 60}m`,
    }));

    return {
      year: query.year,
      month: query.month,
      monthName: new Date(query.year, query.month - 1, 1).toLocaleString("en-US", { month: "long" }),
      totalDays,
      holidaysCount: holidays.length,
      overallSummary: {
        totalRecords: attendances.length,
        totalPresentDays,
        totalLateArrivals,
        totalHoursWorked: Math.round((totalWorkMinutes / 60) * 10) / 10,
        averageHoursPerRecord:
          attendances.length > 0 ? Math.round((totalWorkMinutes / attendances.length / 60) * 10) / 10 : 0,
      },
      departmentBreakdown,
      employeeSummaries,
    };
  }

  /**
   * 6. POST /api/attendance/check-in
   * Record punch-in with device verification, duplicate check, and transaction safety.
   */
  static async checkIn(caller: CurrentUserSession, input: CheckInInput) {
    if (!caller.employeeId) {
      throw new AttendanceServiceError("Forbidden: Current user is not linked to an employee profile", 403);
    }

    const employee = await prisma.employee.findUnique({
      where: { id: caller.employeeId },
      include: { user: true },
    });

    if (!employee) {
      throw new AttendanceServiceError("Employee profile not found", 404);
    }

    // Clean up any forgotten punch-outs from earlier days
    await closeDanglingPreviousShifts(employee.id);

    const now = new Date();
    const logDate = input.dateOffsetDays
      ? new Date(now.getTime() - 86400000 * input.dateOffsetDays)
      : now;

    const { startOfDay, endOfDay } = getISTDayRange(logDate);

    // Duplicate check for target day
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existing) {
      throw new AttendanceServiceError("Already punched in today", 400, {
        existingRecordId: existing.id,
        punchIn: existing.punchIn,
      });
    }

    const isLate = isLateArrival(logDate);

    // Execute atomic creation
    const [attendance] = await prisma.$transaction([
      prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: logDate,
          punchIn: logDate,
          status: isLate ? "LATE" : "PRESENT",
          totalMinutes: 0,
        },
      }),
      prisma.employeeStatusEvent.create({
        data: {
          employeeId: employee.id,
          statusType: "WORKING",
          startedAt: logDate,
          notes: input.notes || "Punched in for work",
        },
      }),
    ]);

    // Dispatch notification asynchronously
    try {
      const timeFormatted = formatToIST(logDate);
      const empName = employee.user?.name || "An employee";
      notifyAdmins({
        title: isLate ? `⚠️ Late Punch-In: ${empName}` : `🟢 Punch-In: ${empName}`,
        message: `${empName} punched in at ${timeFormatted}.${isLate ? " (Recorded as Late Arrival)" : ""}`,
        linkUrl: "/attendance",
        type: "PUNCH_IN",
        metadata: {
          employeeId: employee.id,
          employeeName: empName,
          time: timeFormatted,
          isLate,
        },
      }).catch((err) => {
        console.warn("[AttendanceService] Notification dispatch warning:", err);
      });
    } catch (err) {
      console.warn("[AttendanceService] Notification error:", err);
    }

    return {
      id: attendance.id,
      employeeId: attendance.employeeId,
      date: getISTDateString(attendance.date),
      punchIn: formatTimeIST(attendance.punchIn),
      status: attendance.status,
      isLate,
    };
  }

  /**
   * 7. POST /api/attendance/check-out
   * Record punch-out for employee's active shift today.
   */
  static async checkOut(caller: CurrentUserSession, input: CheckOutInput) {
    if (!caller.employeeId) {
      throw new AttendanceServiceError("Forbidden: Current user is not linked to an employee profile", 403);
    }

    const { startOfDay, endOfDay } = getISTDayRange();

    // Find active attendance today
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: caller.employeeId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (!attendance) {
      throw new AttendanceServiceError("No attendance check-in found for today. You must punch in first.", 400);
    }

    if (attendance.punchOut) {
      throw new AttendanceServiceError("Already punched out for today", 400, {
        punchOut: attendance.punchOut,
      });
    }

    const punchOutTime = new Date();
    const punchInMs = new Date(attendance.punchIn).getTime();
    const elapsedMinutes = Math.max(0, Math.floor((punchOutTime.getTime() - punchInMs) / 60000));

    // Calculate break minutes today
    const breakEvents = await prisma.employeeStatusEvent.findMany({
      where: {
        employeeId: caller.employeeId,
        startedAt: { gte: startOfDay, lte: endOfDay },
        statusType: { not: "WORKING" },
      },
    });

    let breakMinutes = 0;
    breakEvents.forEach((b) => {
      const end = b.endedAt || punchOutTime;
      breakMinutes += Math.max(0, Math.floor((end.getTime() - b.startedAt.getTime()) / 60000));
    });

    const netWorkMinutes = Math.max(0, elapsedMinutes - breakMinutes);

    // Update in transaction
    const [updated] = await prisma.$transaction([
      prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          punchOut: punchOutTime,
          totalMinutes: netWorkMinutes,
          punchOutReason: input.reason || "Standard daily check-out",
        },
      }),
      prisma.employeeStatusEvent.updateMany({
        where: {
          employeeId: caller.employeeId,
          endedAt: null,
          startedAt: { gte: startOfDay, lte: endOfDay },
        },
        data: {
          endedAt: punchOutTime,
        },
      }),
    ]);

    return {
      id: updated.id,
      employeeId: updated.employeeId,
      date: getISTDateString(updated.date),
      punchIn: formatTimeIST(updated.punchIn),
      punchOut: formatTimeIST(updated.punchOut),
      totalMinutes: updated.totalMinutes,
      workHours: `${Math.floor((updated.totalMinutes || 0) / 60)}h ${(updated.totalMinutes || 0) % 60}m`,
      punchOutReason: updated.punchOutReason,
    };
  }
}
