"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useWorkClock } from "@/lib/workClockContext";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { OwnerBreakDashboard } from "@/components/owner/OwnerBreakDashboard";
import { OwnerAttendanceHistory } from "@/components/owner/OwnerAttendanceHistory";
import {
  Clock,
  Play,
  Coffee,
  Power,
  MapPin,
  Laptop,
  CheckCircle2,
  Sliders,
  Sparkles,
  Zap,
  ShieldCheck,
} from "lucide-react";

export default function AttendanceWorkClockPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { showToast } = useToast();
  const {
    status,
    workSeconds,
    breakSeconds,
    breakType,
    punchInTime,
    punchOutTime,
    currentProject,
    currentTask,
    usedLunchSeconds,
    usedTeaSeconds,
    lunchAllowanceSeconds,
    teaAllowanceSeconds,
    simulatedGeofenceError,
    simulatedDeviceError,
    timeline,
    punchIn,
    startBreak,
    resumeWork,
    changeWork,
    punchOut,
    confirmPunchOutAnyway,
    markPunchOutPending,
    toggleGeofenceError,
    toggleDeviceError,
    formatHMS,
    formatHM,
  } = useWorkClock();

  // Bottom sheets
  const [isBreakSheetOpen, setIsBreakSheetOpen] = useState(false);
  const [isChangeWorkOpen, setIsChangeWorkOpen] = useState(false);
  const [isPunchOutConfirmOpen, setIsPunchOutConfirmOpen] = useState(false);

  // Form states for change work
  const [selectedProject, setSelectedProject] = useState(currentProject);
  const [selectedTask, setSelectedTask] = useState(currentTask);
  const [punchOutReason, setPunchOutReason] = useState("");

  // Form states for break
  const [selectedBreakType, setSelectedBreakType] = useState("Lunch");
  const [customBreakReason, setCustomBreakReason] = useState("");

  // Owner inspection mode state
  const [inspectedEmployee, setInspectedEmployee] = useState("EMP-004");
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  const [filterType, setFilterType] = useState<"TODAY" | "MONTHLY" | "CUSTOM">("MONTHLY");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const fetchAttendanceLogs = async () => {
    try {
      let url = `/crmtesting/api/attendance/history?employeeId=${session?.user?.employeeId || ""}`;
      
      const now = new Date();
      let start = "";
      let end = "";

      if (filterType === "TODAY") {
        start = now.toISOString().split("T")[0];
        end = now.toISOString().split("T")[0];
      } else if (filterType === "MONTHLY") {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        start = firstDay.toISOString().split("T")[0];
        end = lastDay.toISOString().split("T")[0];
      } else if (filterType === "CUSTOM") {
        start = customStartDate;
        end = customEndDate;
      }

      if (start && end) {
        url += `&startDate=${start}&endDate=${end}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAttendanceRecords(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (session?.user?.employeeId) {
      fetchAttendanceLogs();
    }
  }, [filterType, customStartDate, customEndDate, session?.user?.employeeId]);

  const REQUIRED_WORK_SECONDS = 8 * 3600;
  const progressPercent = Math.min(100, Math.round((workSeconds / REQUIRED_WORK_SECONDS) * 100));
  const remainingWorkSeconds = Math.max(0, REQUIRED_WORK_SECONDS - workSeconds);

  const handlePunchInClick = async () => {
    if (simulatedGeofenceError) {
      showToast("Punch In unavailable: You are outside the permitted office geofence (1.8 km).", "error");
      return;
    }
    if (simulatedDeviceError) {
      showToast("Punch In unavailable: Morning Punch In must be initiated from your registered office laptop.", "error");
      return;
    }
    try {
      const res = await fetch("/crmtesting/api/attendance/punch-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: session?.user?.employeeId }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to punch in.", "error");
        return;
      }
      
      punchIn();
      showToast("✓ Punched In successfully at " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), "success");
    } catch (e) {
      showToast("Network error while punching in.", "error");
    }
  };

  const handleConfirmBreak = async () => {
    startBreak(selectedBreakType, customBreakReason);
    setIsBreakSheetOpen(false);
    try {
      const res = await fetch("/crmtesting/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: session?.user?.employeeId, actionType: "BREAK", notes: `${selectedBreakType} break` }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to start break.", "error");
        return;
      }
      showToast(`✓ Break started: ${selectedBreakType}`, "info");
    } catch (e) {
      showToast("Network error while starting break.", "error");
    }
  };

  const handleChangeWorkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changeWork(selectedProject, selectedTask);
    setIsChangeWorkOpen(false);
    showToast(`✓ Work updated: ${selectedProject} → ${selectedTask}`, "success");
  };

  const handlePunchOutClick = async () => {
    const res = punchOut();
    if (res.requiresConfirmation) {
      setIsPunchOutConfirmOpen(true);
    } else {
      // Normal punch out path (8 hours completed)
      confirmPunchOutAnyway();
    }
  };

  const handleConfirmPunchOutAnyway = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!punchOutReason.trim()) {
      showToast("Please provide a reason for leaving early.", "error");
      return;
    }
    
    try {
      const response = await fetch("/crmtesting/api/attendance/punch-out-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: session?.user?.employeeId, reason: punchOutReason }),
      });
      const data = await response.json();
      
      if (data.success) {
        markPunchOutPending();
        setIsPunchOutConfirmOpen(false);
        showToast("Punch out request submitted for admin approval.", "info");
      } else {
        showToast(data.error || "Failed to submit request", "error");
      }
    } catch (e) {
      showToast("Error submitting request", "error");
    }
  };

  // Admin/Owner View for Attendance Page
  if ((role as string) === "OWNER") {
    return (
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Team Attendance & Activity"
          description="Live overview of team breaks and session statuses."
          badge="OWNER VIEW"
          icon={<Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        />
        <OwnerBreakDashboard />
        <OwnerAttendanceHistory />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      {/* Module Header */}
      <PageHeader
        title="ESS Work Clock"
        description="Employee day timeline, live stopwatch, work focus tracking, and break allowances."
        badge="WORK MODULE"
        icon={<Clock className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          (role as string) === "OWNER" ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Inspect Staff:</span>
              <select
                value={inspectedEmployee}
                onChange={(e) => setInspectedEmployee(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
              >
                <option value="EMP-004">Dev Patel (Full-Stack Dev)</option>
                <option value="EMP-001">Meet Shah (Tech Lead)</option>
                <option value="EMP-003">Priya Desai (UI/UX Lead)</option>
                <option value="EMP-002">Jay Shah (QA Lead)</option>
              </select>
            </div>
          ) : undefined
        }
      />

        {/* STATE 1: NOT PUNCHED IN */}
      {status === "NOT_PUNCHED_IN" && (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-xl dark:shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 mx-auto bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Ready to start your day?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Ensure you are connected to the office network or approved VPN. Location services must be enabled.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 max-w-md mx-auto text-left space-y-3 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Punch-In Eligibility Audit
            </div>

            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/60 pb-2">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${simulatedGeofenceError ? "text-rose-500" : "text-emerald-500"}`} />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Office Geofence</span>
              </div>
              {simulatedGeofenceError ? (
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">1.8 km Outside Office</span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">✓ Verified (42m)</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Laptop className={`w-4 h-4 ${simulatedDeviceError ? "text-rose-500" : "text-emerald-500"}`} />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Registered Office Laptop</span>
              </div>
              {simulatedDeviceError ? (
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Unrecognized Device</span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">✓ Office Laptop (EMP-LT-004)</span>
              )}
            </div>
          </div>

          <button
            onClick={handlePunchInClick}
            className="w-full max-w-sm mx-auto py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Punch In to Work Clock</span>
          </button>
        </div>
      )}

      {/* STATE 4: DAY COMPLETE */}
      {status === "DAY_COMPLETE" && (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-emerald-200/80 dark:border-emerald-800/80 p-8 shadow-xl dark:shadow-2xl space-y-6 text-center">
          <div className="w-20 h-20 mx-auto bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Shift Completed</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              You have successfully punched out for today. Great work!
            </p>
          </div>
        </div>
      )}

      {/* STATE 2: WORKING (STOPWATCH) */}
      {status === "WORKING" && (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-xl dark:shadow-2xl space-y-6 text-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>WORK CLOCK • Active Session</span>
            </div>

            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100 pt-2">
              {formatHMS(workSeconds)}
            </div>

            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
              Punched In at {punchInTime || "09:00 AM"} • Required: 8h 00m
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 text-xs text-left max-w-lg mx-auto">
            <div className="flex justify-between font-bold">
              <span className="text-slate-600 dark:text-slate-400">8-Hour Work Goal</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{formatHM(workSeconds)} / 8h ({progressPercent}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Work Focus Box */}
          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left max-w-lg mx-auto">
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">CURRENT WORK FOCUS</div>
              <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{currentProject}</div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">→ {currentTask}</div>
            </div>

            <button
              onClick={() => setIsChangeWorkOpen(true)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-all shrink-0"
            >
              Change Focus
            </button>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto pt-2">
            <button
              onClick={() => setIsBreakSheetOpen(true)}
              className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Coffee className="w-4 h-4" />
              <span>Take Break</span>
            </button>

            <button
              onClick={handlePunchOutClick}
              className="flex-1 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <Power className="w-4 h-4" />
              <span>Punch Out</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: ON BREAK */}
      {status === "ON_BREAK" && (
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 shadow-xl dark:shadow-2xl space-y-6 text-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
              <span>ON BREAK • {breakType}</span>
            </div>

            <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100 pt-2">
              {formatHMS(breakSeconds)}
            </div>
          </div>

          <button
            onClick={resumeWork}
            className="w-full max-w-sm mx-auto py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Resume Work Session</span>
          </button>
        </div>
      )}

      {/* TIMELINE LOG */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Today's Work Timeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Chronological work execution and break log.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            TODAY
          </span>
        </div>

        <div className="space-y-4 text-xs">
          {timeline.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between gap-3 shadow-xs dark:shadow-lg"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{item.time}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.type}
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.title}</div>
                {item.subtitle && <div className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</div>}
              </div>

              {item.duration && (
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                  ⏱️ {item.duration}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ATTENDANCE HISTORY */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4 gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Attendance History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">View past punch records and total work hours.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
            >
              <option value="TODAY">Today</option>
              <option value="MONTHLY">This Month</option>
              <option value="CUSTOM">Custom Date</option>
            </select>

            {filterType === "CUSTOM" && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-none"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="p-3 font-semibold rounded-l-xl">Date</th>
                <th className="p-3 font-semibold">Punch In</th>
                <th className="p-3 font-semibold">Punch Out</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold rounded-r-xl">Total Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => {
                  const formatTime = (isoString: string) => {
                    if (!isoString) return "--";
                    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  };
                  const formatDate = (isoString: string) => {
                    return new Date(isoString).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                  };
                  const formatMins = (mins: number) => {
                    if (!mins) return "--";
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    return `${h}h ${m}m`;
                  };
                  return (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatDate(record.date)}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                        {formatTime(record.punchInTime)}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                        {formatTime(record.punchOutTime)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          record.status === "PRESENT" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          record.status === "LATE" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}>
                          {record.status || "UNKNOWN"}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {formatMins(record.totalWorkMinutes)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Take Break Sheet */}
      <BottomSheet
        isOpen={isBreakSheetOpen}
        onClose={() => setIsBreakSheetOpen(false)}
        title="Take a Break"
        subtitle="Log your break time. Your work session timer will pause."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedBreakType("Lunch")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                selectedBreakType === "Lunch"
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/40 dark:text-indigo-300"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              <Coffee className="w-5 h-5" />
              <span className="text-xs font-bold">Lunch Break</span>
            </button>
            <button
              onClick={() => setSelectedBreakType("Tea")}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                selectedBreakType === "Tea"
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/40 dark:text-indigo-300"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              <Coffee className="w-5 h-5" />
              <span className="text-xs font-bold">Tea Break</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              value={customBreakReason}
              onChange={(e) => setCustomBreakReason(e.target.value)}
              placeholder="e.g. Grabbing coffee"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleConfirmBreak}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs"
          >
            Start Break
          </button>
        </div>
      </BottomSheet>

      {/* Early Punch Out Reason Sheet */}
      <BottomSheet
        isOpen={isPunchOutConfirmOpen}
        onClose={() => setIsPunchOutConfirmOpen(false)}
        title="Early Punch Out Request"
        subtitle="You are leaving before completing 8 hours. Please provide a reason for admin approval."
      >
        <form onSubmit={handleConfirmPunchOutAnyway} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for leaving early
            </label>
            <input
              type="text"
              required
              value={punchOutReason}
              onChange={(e) => setPunchOutReason(e.target.value)}
              placeholder="e.g. Doctor's appointment, family emergency"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Power className="w-4 h-4" />
            <span>Submit Punch Out Request</span>
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
