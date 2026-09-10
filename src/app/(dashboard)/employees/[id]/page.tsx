"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ArrowLeft,
  UserCheck,
  Clock,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Mail,
  Phone,
  Building,
  Sparkles,
  BarChart3,
  Calendar,
  Coffee,
  LogIn,
  LogOut,
  Calculator,
  DollarSign,
  PartyPopper,
  AlertCircle,
  Percent,
} from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<any>(null);
  const [assignedProjs, setAssignedProjs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [selectedDayDetail, setSelectedDayDetail] = useState<any>(null);
  const [companyHolidays, setCompanyHolidays] = useState<any[]>([]);

  // Simulator states (unsaved)
  const [simBaseSalary, setSimBaseSalary] = useState<number>(0);
  const [simWorkingDays, setSimWorkingDays] = useState<number>(22);
  const [simUnpaidLeaves, setSimUnpaidLeaves] = useState<number>(0);
  const [simHalfDays, setSimHalfDays] = useState<number>(0);
  const [isSalarySimInitialized, setIsSalarySimInitialized] = useState<boolean>(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSalary, setEditSalary] = useState<number>(0);
  const [confirmStatus, setConfirmStatus] = useState(false);

  React.useEffect(() => {
    fetchEmployee();
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const res = await fetch("/crmtesting/api/holidays");
      const json = await res.json();
      if (json.success && json.data) {
        setCompanyHolidays(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/crmtesting/api/employees/${params.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const e = json.data;
        const today = new Date();
        const isToday = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        };
        const todayAtt = e.attendances?.filter((a: any) => isToday(a.date)) || [];
        const isPunchedIn = todayAtt.some((a: any) => a.punchIn && !a.punchOut);
        const isShiftCompleted = todayAtt.some((a: any) => a.punchIn && a.punchOut);

        setEmployee({
          ...e,
          employeeId: e.employeeIdCode,
          name: e.user.name,
          email: e.user.email,
          role: e.user.activeRole,
          designation: e.user.designation,
          department: e.user.department,
          phone: "+91 98980 000" + (e.employeeIdCode?.length > 3 ? e.employeeIdCode.slice(-2) : "01"),
          punchedIn: isPunchedIn,
          shiftCompleted: isShiftCompleted,
          punchInTime: todayAtt[0]?.punchIn ? new Date(todayAtt[0].punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
          todayWorkSeconds: (todayAtt[0]?.totalMinutes || 0) * 60,
          currentProject: e.workSessions?.[0]?.project?.name || "General Workspace",
          currentTask: e.workSessions?.[0]?.notes || "Focusing on active tasks",
          assignedProjects: ["PRJ-2026-001"],
          todayTimeline: e.workSessions?.map((w: any) => ({
            id: w.id,
            timeRange: "09:00 AM - 11:00 AM",
            activity: w.notes || "Core development",
            project: w.project?.name || "General",
            duration: `${w.durationMinutes}m`,
          })) || [],
          rawAttendances: e.attendances || [],
          rawStatusEvents: e.statusEvents || [],
          attendanceRecord: e.attendances?.map((a: any) => {
            const dayStr = new Date(a.date || a.punchIn).toDateString();
            const dayBreaks = e.statusEvents?.filter((ev: any) => {
              return ev.statusType !== "WORKING" && new Date(ev.startedAt).toDateString() === dayStr;
            }) || [];
            
            const breakMins = dayBreaks.reduce((acc: number, ev: any) => {
              const start = new Date(ev.startedAt).getTime();
              const end = ev.endedAt ? new Date(ev.endedAt).getTime() : Date.now();
              return acc + Math.max(0, Math.floor((end - start) / 60000));
            }, 0);

            const breakHoursStr = breakMins > 0 ? `${Math.floor(breakMins / 60)}h ${breakMins % 60}m` : "0m";

            return {
              date: new Date(a.date || a.punchIn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              punchIn: a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
              punchOut: a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "On-Going",
              status: a.status || "PRESENT",
              workHours: `${Math.floor((a.totalMinutes || 0) / 60)}h ${(a.totalMinutes || 0) % 60}m`,
              breakHours: breakHoursStr,
            };
          }) || [],
          isActive: e.user?.isActive !== false,
          empStatus: e.status,
        });
        
        setEditName(e.user?.name || "");
        setEditDesignation(e.user?.designation || "");
        setEditDepartment(e.user?.department || "");
        setEditSalary(e.salaryMonthly || 0);

        // Dummy project for now since we don't have an API to fetch projects assigned to employee yet
        setAssignedProjs([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"timeline" | "projects" | "attendance" | "help">("timeline");

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/crmtesting/api/employees/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          designation: editDesignation,
          department: editDepartment,
          salaryMonthly: editSalary,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Employee profile updated successfully", "success");
        setIsEditOpen(false);
        fetchEmployee();
      } else {
        showToast(json.error || "Failed to update employee", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newIsActive = !employee.isActive;
      const newStatus = newIsActive ? "ACTIVE" : "INACTIVE";
      const res = await fetch(`/crmtesting/api/employees/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: newIsActive,
          status: newStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Employee ${newIsActive ? 'Activated' : 'Deactivated'} successfully`, "success");
        fetchEmployee();
      } else {
        showToast(json.error || "Failed to change status", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse">Loading Employee Data...</div>;
  if (!employee) return <div className="p-12 text-center text-rose-400">Employee Not Found or Access Denied</div>;

  const getAvailableMonths = () => {
    const monthsSet = new Set<string>();
    const currentM = new Date().toISOString().slice(0, 7);
    monthsSet.add(currentM);
    
    employee?.rawAttendances?.forEach((a: any) => {
      if (a.date || a.punchIn) {
        const d = new Date(a.date || a.punchIn);
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        monthsSet.add(mKey);
      }
    });

    employee?.rawStatusEvents?.forEach((ev: any) => {
      if (ev.startedAt) {
        const d = new Date(ev.startedAt);
        const mKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        monthsSet.add(mKey);
      }
    });

    return Array.from(monthsSet).sort().reverse();
  };

  const computeMonthlyMetrics = (monthKey: string) => {
    if (!employee) return { 
      totalWorkHours: "0h 0m", 
      totalBreakHours: "0h 0m", 
      avgPunchIn: "N/A", 
      avgPunchOut: "N/A", 
      daysPresent: 0, 
      avgWorkPerDay: "0h 0m", 
      breakCount: 0, 
      completedShifts: 0,
      halfDaysCount: 0,
      totalOffDaysCount: 0,
      totalDeclaredHolidays: 0,
      totalWeekendsCount: 0,
      totalWorkingDaysInMonth: 22,
      fullDayLeavesCount: 0,
    };

    const rawAtts = employee.rawAttendances || [];
    const rawEvs = employee.rawStatusEvents || [];

    const monthAtts = rawAtts.filter((a: any) => {
      const d = new Date(a.date || a.punchIn);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      return key === monthKey;
    });

    const monthEvs = rawEvs.filter((ev: any) => {
      const d = new Date(ev.startedAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      return key === monthKey;
    });

    const monthHolidays = companyHolidays.filter((h: any) => {
      const d = new Date(h.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      return key === monthKey;
    });

    const totalWorkMin = monthAtts.reduce((sum: number, a: any) => {
      if (typeof a.totalMinutes === "number" && a.totalMinutes > 0) {
        return sum + a.totalMinutes;
      }
      if (a.punchIn && a.punchOut) {
        const diff = Math.max(0, Math.floor((new Date(a.punchOut).getTime() - new Date(a.punchIn).getTime()) / 60000));
        return sum + diff;
      }
      return sum;
    }, 0);

    const totalWorkHours = `${Math.floor(totalWorkMin / 60)}h ${totalWorkMin % 60}m`;

    const totalBreakMin = monthEvs
      .filter((ev: any) => ev.statusType !== "WORKING")
      .reduce((sum: number, ev: any) => {
        const start = new Date(ev.startedAt).getTime();
        const end = ev.endedAt ? new Date(ev.endedAt).getTime() : Date.now();
        const mins = Math.max(0, Math.floor((end - start) / 60000));
        return sum + mins;
      }, 0);

    const totalBreakHours = `${Math.floor(totalBreakMin / 60)}h ${totalBreakMin % 60}m`;

    const validPunchIns = monthAtts.filter((a: any) => a.punchIn);
    let avgPunchIn = "N/A";
    if (validPunchIns.length > 0) {
      const sumMin = validPunchIns.reduce((sum: number, a: any) => {
        const d = new Date(a.punchIn);
        return sum + (d.getHours() * 60 + d.getMinutes());
      }, 0);
      const avg = Math.round(sumMin / validPunchIns.length);
      const h = Math.floor(avg / 60);
      const m = avg % 60;
      const ampm = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 || 12;
      avgPunchIn = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    const validPunchOuts = monthAtts.filter((a: any) => a.punchOut);
    let avgPunchOut = "N/A";
    if (validPunchOuts.length > 0) {
      const sumMin = validPunchOuts.reduce((sum: number, a: any) => {
        const d = new Date(a.punchOut);
        return sum + (d.getHours() * 60 + d.getMinutes());
      }, 0);
      const avg = Math.round(sumMin / validPunchOuts.length);
      const h = Math.floor(avg / 60);
      const m = avg % 60;
      const ampm = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 || 12;
      avgPunchOut = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
    }

    const daysPresent = monthAtts.length;
    const avgWorkPerDayMin = daysPresent > 0 ? Math.round(totalWorkMin / daysPresent) : 0;
    const avgWorkPerDay = `${Math.floor(avgWorkPerDayMin / 60)}h ${avgWorkPerDayMin % 60}m`;

    // Half days count
    const halfDaysCount = monthAtts.filter((a: any) => {
      const mins = a.totalMinutes || (a.punchIn && a.punchOut ? Math.max(0, Math.floor((new Date(a.punchOut).getTime() - new Date(a.punchIn).getTime()) / 60000)) : 0);
      return a.punchOutRequestStatus === "APPROVED" || a.punchOutReason?.toLowerCase().includes("early") || (a.punchOut && mins < 420);
    }).length;

    // Total Holidays & Off Days count
    const [yearStr, monthStr] = monthKey.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    let totalWeekendsCount = 0;
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayOfWeek = new Date(year, month, d).getDay();
      if (dayOfWeek === 0) totalWeekendsCount++;
    }

    const totalDeclaredHolidays = monthHolidays.length;
    const totalOffDaysCount = totalWeekendsCount + totalDeclaredHolidays;
    const totalWorkingDaysInMonth = Math.max(1, totalDaysInMonth - totalOffDaysCount);
    const fullDayLeavesCount = Math.max(0, totalWorkingDaysInMonth - daysPresent);

    return {
      totalWorkHours,
      totalBreakHours,
      avgPunchIn,
      avgPunchOut,
      daysPresent,
      avgWorkPerDay,
      breakCount: monthEvs.filter((ev: any) => ev.statusType !== "WORKING").length,
      completedShifts: validPunchOuts.length,
      halfDaysCount,
      totalOffDaysCount,
      totalDeclaredHolidays,
      totalWeekendsCount,
      totalWorkingDaysInMonth,
      fullDayLeavesCount,
    };
  };

  const renderMonthlyCalendar = () => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push({ isPadding: true, dayNumber: 0, dateStr: `pad-${i}` });
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const currentDayDate = new Date(year, month, d);
      const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = currentDayDate.getDay();
      const isWeekend = dayOfWeek === 0;

      const holidayMatch = companyHolidays.find((h: any) => {
        const dObj = new Date(h.date);
        const localStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
        return localStr === dayDateStr;
      });

      const attRecord = employee?.rawAttendances?.find((a: any) => {
        if (!a.date && !a.punchIn) return false;
        const dObj = new Date(a.date || a.punchIn);
        const localStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
        return localStr === dayDateStr;
      });

      let statusType: "GREEN" | "RED" | "GREY" | "BLUE" | "NONE" = "NONE";
      let statusLabel = "No Punch Record";
      let workHoursText = "";
      let inTimeText = "";
      let outTimeText = "";

      if (holidayMatch) {
        statusType = "GREY";
        statusLabel = `Holiday: ${holidayMatch.title}`;
        workHoursText = holidayMatch.title;
      } else if (attRecord) {
        inTimeText = attRecord.punchIn ? new Date(attRecord.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
        outTimeText = attRecord.punchOut ? new Date(attRecord.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Ongoing";

        const mins = attRecord.totalMinutes || (attRecord.punchIn && attRecord.punchOut ? Math.max(0, Math.floor((new Date(attRecord.punchOut).getTime() - new Date(attRecord.punchIn).getTime()) / 60000)) : 0);
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        workHoursText = `${hrs}h ${m}m`;

        const isEarlyPunchOut = attRecord.punchOutRequestStatus === "APPROVED" || 
                                attRecord.punchOutReason?.toLowerCase().includes("early") || 
                                (attRecord.punchOut && mins < 420);

        if (attRecord.punchIn && !attRecord.punchOut && dayDateStr === todayStr) {
          statusType = "BLUE";
          statusLabel = "Working Now";
        } else if (isEarlyPunchOut) {
          statusType = "RED";
          statusLabel = "Early Punch Out / Incomplete Hours";
        } else if (mins >= 420 || (attRecord.punchIn && attRecord.punchOut)) {
          statusType = "GREEN";
          statusLabel = "Completed Full Work Hours";
        } else {
          statusType = "RED";
          statusLabel = "Incomplete Hours";
        }
      } else if (isWeekend) {
        statusType = "GREY";
        statusLabel = "Weekend / Holiday";
      }

      daysArray.push({
        isPadding: false,
        dayNumber: d,
        dateStr: dayDateStr,
        isWeekend,
        statusType,
        statusLabel,
        workHoursText,
        inTimeText,
        outTimeText,
        isToday: dayDateStr === todayStr,
      });
    }

    return daysArray;
  };

  const monthlyMetrics = computeMonthlyMetrics(selectedMonth);

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Team Directory</span>
        </Link>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {employee.employeeId}
        </span>
      </div>

      {/* Employee Hero Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
              {employee.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {employee.role}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {employee.department}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                {employee.name}
              </h1>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {employee.designation} • {employee.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {employee.punchedIn ? (
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>● Working · Punched In at {employee.punchInTime}</span>
              </span>
            ) : employee.shiftCompleted ? (
              <span className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold shadow-xs">
                Shift Completed Today
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold">
                Not Punched In Today
              </span>
            )}
            <button
              onClick={() => setIsEditOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmStatus(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${employee.isActive ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'}`}
            >
              {employee.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>

        {/* Current Active Focus Pill */}
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-1 text-xs">
          <div className="flex items-center justify-between font-bold text-indigo-900 dark:text-indigo-300">
            <span>CURRENT FOCUS TASK</span>
            <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-400">{employee.currentProject}</span>
          </div>
          <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            "{employee.currentTask}"
          </p>
        </div>
      </div>

      {/* Monthly Performance Analytics Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Monthly Work & Attendance Analytics
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monthly working hours, total break durations, and average punch times
            </p>
          </div>

          {/* Month Selector Dropdown */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              {getAvailableMonths().map((mKey) => {
                const [year, month] = mKey.split("-");
                const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                const monthName = dateObj.toLocaleString("default", { month: "long", year: "numeric" });
                const isCurrent = mKey === new Date().toISOString().slice(0, 7);
                return (
                  <option key={mKey} value={mKey}>
                    {monthName} {isCurrent ? "(Current Month)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* 6 Monthly Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Working Hours */}
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">TOTAL WORK HOURS</span>
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {monthlyMetrics.totalWorkHours}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              Avg {monthlyMetrics.avgWorkPerDay} / day ({monthlyMetrics.daysPresent} days present)
            </div>
          </div>

          {/* Card 2: Total Break Time */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300">TOTAL BREAK TIME</span>
              <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {monthlyMetrics.totalBreakHours}
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              {monthlyMetrics.breakCount} break session(s) taken
            </div>
          </div>

          {/* Card 3: Half Days / Early Punch Outs */}
          <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300">HALF DAYS / EARLY OUTS</span>
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {monthlyMetrics.halfDaysCount} Half Day(s)
            </div>
            <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
              0.5 day salary deduction / half day
            </div>
          </div>

          {/* Card 4: Total Holidays & Days Off */}
          <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 dark:text-sky-300">HOLIDAYS & DAYS OFF</span>
              <PartyPopper className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {monthlyMetrics.totalOffDaysCount} Days Off
            </div>
            <div className="text-[11px] text-sky-700 dark:text-sky-400 font-medium">
              {monthlyMetrics.totalDeclaredHolidays} Official Holidays + {monthlyMetrics.totalWeekendsCount} Weekends
            </div>
          </div>

          {/* Card 5: Avg Punch-Out Time */}
          <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300">AVG PUNCH-OUT TIME</span>
              <LogOut className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {monthlyMetrics.avgPunchOut}
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">
              Across {monthlyMetrics.completedShifts} completed shift(s)
            </div>
          </div>

          {/* Card 6: Avg Punch-In Time */}
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">AVG PUNCH-IN TIME</span>
              <LogIn className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {monthlyMetrics.avgPunchIn}
            </div>
            <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">
              {monthlyMetrics.daysPresent} Working Day(s) Present
            </div>
          </div>
        </div>

        {/* Monthly Attendance Calendar Grid */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Monthly Attendance Calendar Grid
              </h3>
            </div>

            {/* Calendar Color Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                <span className="text-slate-600 dark:text-slate-300">Complete Hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
                <span className="text-slate-600 dark:text-slate-300">Early Punch Out</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500 shadow-xs" />
                <span className="text-slate-600 dark:text-slate-300">Weekend / Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs animate-pulse" />
                <span className="text-slate-600 dark:text-slate-300">Working Today</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="bg-slate-50/70 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 space-y-2">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-rose-500">SUN</span>
              <span>MON</span>
              <span>TUE</span>
              <span>WED</span>
              <span>THU</span>
              <span>FRI</span>
              <span>SAT</span>
            </div>

            {/* Day Grid Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {renderMonthlyCalendar().map((cell, idx) => {
                if (cell.isPadding) {
                  return <div key={`pad-${idx}`} className="h-14 rounded-lg bg-transparent" />;
                }

                let cellBg = "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300";
                let dotBg = "";

                if (cell.statusType === "GREEN") {
                  cellBg = "bg-emerald-500/10 dark:bg-emerald-950/50 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-bold";
                  dotBg = "bg-emerald-500";
                } else if (cell.statusType === "RED") {
                  cellBg = "bg-rose-500/10 dark:bg-rose-950/50 border-rose-500/40 text-rose-900 dark:text-rose-200 font-bold";
                  dotBg = "bg-rose-500";
                } else if (cell.statusType === "GREY") {
                  cellBg = "bg-slate-100 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-500";
                  dotBg = "bg-slate-400 dark:bg-slate-600";
                } else if (cell.statusType === "BLUE") {
                  cellBg = "bg-blue-500/10 dark:bg-blue-950/50 border-blue-500/40 text-blue-900 dark:text-blue-200 font-bold";
                  dotBg = "bg-blue-500 animate-ping";
                }

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => {
                      if (cell.statusType !== "NONE" && cell.statusType !== "GREY") {
                        setSelectedDayDetail(cell);
                      }
                    }}
                    className={`h-14 p-1.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] shadow-2xs relative group ${cellBg} ${
                      cell.isToday ? "ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900" : ""
                    }`}
                    title={`${cell.dateStr}: ${cell.statusLabel} ${cell.workHoursText ? `(${cell.workHoursText})` : ""}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs font-extrabold">{cell.dayNumber}</span>
                      {dotBg && <span className={`w-2 h-2 rounded-full ${dotBg} shrink-0`} />}
                    </div>

                    {cell.workHoursText ? (
                      <div className="font-mono text-[10px] font-bold truncate">
                        {cell.workHoursText}
                      </div>
                    ) : cell.isWeekend ? (
                      <div className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 dark:text-slate-500 truncate">
                        Off
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Unsaved Salary & Deduction Simulator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Live Salary & Deduction Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate monthly payout based on leaves & half days. (Preview only — does not save to DB)
            </p>
          </div>

          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 shrink-0">
            ℹ️ Unsaved Live Simulator
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Base Salary Input */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <label className="text-slate-500 dark:text-slate-400 font-bold block">Base Monthly Salary (₹)</label>
            <input
              type="number"
              value={simBaseSalary || (employee?.salaryMonthly || 0)}
              onChange={(e) => setSimBaseSalary(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
            <div className="text-[10px] text-slate-400">Current Base Salary</div>
          </div>

          {/* Working Days in Month Input */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <label className="text-slate-500 dark:text-slate-400 font-bold block">Working Days in Month</label>
            <input
              type="number"
              value={simWorkingDays}
              onChange={(e) => setSimWorkingDays(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
              Daily Rate: ₹{simWorkingDays > 0 ? Math.round((simBaseSalary || employee?.salaryMonthly || 0) / simWorkingDays) : 0}/day
            </div>
          </div>

          {/* Full Day Leaves Input */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <label className="text-slate-500 dark:text-slate-400 font-bold block">Full Day Leaves Taken</label>
            <input
              type="number"
              value={simUnpaidLeaves}
              onChange={(e) => setSimUnpaidLeaves(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
            <div className="text-[10px] text-rose-500 font-semibold font-mono">
              Deduction: -₹{Math.round(simUnpaidLeaves * (simWorkingDays > 0 ? (simBaseSalary || employee?.salaryMonthly || 0) / simWorkingDays : 0))}
            </div>
          </div>

          {/* Half Days Input */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <label className="text-slate-500 dark:text-slate-400 font-bold block">Half Days / Early Out</label>
            <input
              type="number"
              value={simHalfDays}
              onChange={(e) => setSimHalfDays(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-mono font-bold text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
            <div className="text-[10px] text-amber-500 font-semibold font-mono">
              Deduction: -₹{Math.round(simHalfDays * (simWorkingDays > 0 ? ((simBaseSalary || employee?.salaryMonthly || 0) / simWorkingDays) / 2 : 0))}
            </div>
          </div>
        </div>

        {/* Payout Summary Banner */}
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
          <div className="space-y-1">
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">CALCULATED PAYOUT SUMMARY</div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Base: <span className="font-bold">₹{(simBaseSalary || employee?.salaryMonthly || 0).toLocaleString()}</span> • Total Deductions: <span className="font-bold text-rose-600 dark:text-rose-400">-₹{(Math.round(simUnpaidLeaves * (simWorkingDays > 0 ? (simBaseSalary || employee?.salaryMonthly || 0) / simWorkingDays : 0)) + Math.round(simHalfDays * (simWorkingDays > 0 ? ((simBaseSalary || employee?.salaryMonthly || 0) / simWorkingDays) / 2 : 0))).toLocaleString()}</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold">Estimated Net Salary Payout</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{Math.max(0, (simBaseSalary || employee?.salaryMonthly || 0) - (Math.round(simUnpaidLeaves * (simWorkingDays > 0 ? (simBaseSalary || employee?.salaryMonthly || 0) / simWorkingDays : 0)) + Math.round(simHalfDays * (simWorkingDays > 0 ? ((simBaseSalary || employee?.salaryMonthly || 0) / simWorkingDays) / 2 : 0)))).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: "timeline", label: `Today Work History (${employee.todayTimeline.length})` },
          { id: "projects", label: `Assigned Projects (${assignedProjs.length})` },
          { id: "attendance", label: `Attendance Records (${employee.attendanceRecord.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Today Work History Timeline ("Who worked on what, when, and for how long?") */}
      {activeTab === "timeline" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Granular Work Execution Log</h3>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              TODAY'S TOTAL: 4h 15m
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {employee.todayTimeline.map((item: any) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.timeRange}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.project}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.activity}</div>
                </div>

                <div className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 text-center sm:text-right">
                  ⏱️ {item.duration}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Projects */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignedProjs?.map((p: any) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400">{p.id}</span>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{p.name}</h4>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">🏢 {p.clientName}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Progress: <strong className="text-slate-800 dark:text-slate-200 font-mono">{p.progress}%</strong></span>
                <Link
                  href={`/projects/${p.id}`}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Open Project Workspace
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Attendance Records */}
      {activeTab === "attendance" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Attendance & Punch Log</h3>
            <span className="text-xs font-mono font-bold text-slate-500">
              Total Records: {employee.attendanceRecord.length}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            {employee.attendanceRecord.map((rec: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{rec.date}</span>
                  <span className="text-slate-400 ml-3">In: {rec.punchIn} • Out: {rec.punchOut}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Work: {rec.workHours}</span>
                  {rec.breakHours && rec.breakHours !== "0m" && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">Break: {rec.breakHours}</span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {rec.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Employee Bottom Sheet */}
      <BottomSheet
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Employee Profile"
        subtitle="Update employee details and department."
      >
        <form onSubmit={handleUpdateEmployee} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Designation</label>
            <input
              type="text"
              required
              value={editDesignation}
              onChange={(e) => setEditDesignation(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Department</label>
            <input
              type="text"
              required
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Monthly Salary</label>
            <input
              type="number"
              value={editSalary}
              onChange={(e) => setEditSalary(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Save Changes
          </button>
        </form>
      </BottomSheet>

      {employee && (
        <ConfirmModal
          isOpen={confirmStatus}
          onClose={() => setConfirmStatus(false)}
          onConfirm={handleToggleStatus}
          title={`${employee.isActive ? 'Deactivate' : 'Activate'} Employee`}
          message={`Are you sure you want to ${employee.isActive ? 'deactivate' : 'activate'} ${employee.name}? ${employee.isActive ? 'They will no longer be able to log in or punch in.' : 'They will regain access to the system.'}`}
          confirmText={employee.isActive ? "Yes, Deactivate" : "Yes, Activate"}
          isDestructive={employee.isActive}
        />
      )}

      {/* Day Attendance Detail Bottom Sheet */}
      <BottomSheet
        isOpen={!!selectedDayDetail}
        onClose={() => setSelectedDayDetail(null)}
        title={`Attendance Detail — ${selectedDayDetail?.dateStr}`}
        subtitle={`Employee: ${employee?.name}`}
      >
        {selectedDayDetail && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Status</span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  selectedDayDetail.statusType === "GREEN" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300" :
                  selectedDayDetail.statusType === "RED" ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300" :
                  selectedDayDetail.statusType === "BLUE" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300" :
                  "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}>
                  {selectedDayDetail.statusLabel}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-semibold">Punch In Time</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedDayDetail.inTimeText || "--"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Punch Out Time</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedDayDetail.outTimeText || "--"}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-semibold">Total Work Hours</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{selectedDayDetail.workHoursText || "0h 0m"}</span>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
