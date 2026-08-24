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
} from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<any>(null);
  const [assignedProjs, setAssignedProjs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesignation, setEditDesignation] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editSalary, setEditSalary] = useState<number>(0);
  const [confirmStatus, setConfirmStatus] = useState(false);

  React.useEffect(() => {
    fetchEmployee();
  }, []);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/mdz-os/api/employees/${params.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const e = json.data;
        setEmployee({
          ...e,
          employeeId: e.employeeIdCode,
          name: e.user.name,
          email: e.user.email,
          role: e.user.activeRole,
          designation: e.user.designation,
          department: e.user.department,
          phone: "+91 98980 000" + (e.employeeIdCode?.length > 3 ? e.employeeIdCode.slice(-2) : "01"),
          punchedIn: e.attendances?.some((a: any) => a.punchIn && !a.punchOut),
          punchInTime: e.attendances?.[0]?.punchIn ? new Date(e.attendances[0].punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
          todayWorkSeconds: (e.attendances?.[0]?.totalMinutes || 120) * 60,
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
          attendanceRecord: e.attendances?.map((a: any) => ({
            date: new Date(a.date).toLocaleDateString(),
            punchIn: a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "09:00 AM",
            punchOut: a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "On-Going",
            status: a.status,
            workHours: `${Math.floor((a.totalMinutes || 0) / 60)}h ${(a.totalMinutes || 0) % 60}m`,
          })) || [],
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
      const res = await fetch(`/mdz-os/api/employees/${params.id}`, {
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
      const res = await fetch(`/mdz-os/api/employees/${params.id}`, {
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
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Attendance & Punch Log</h3>
          <div className="space-y-2 text-xs">
            {employee.attendanceRecord.map((rec: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{rec.date}</span>
                  <span className="text-slate-400 ml-3">In: {rec.punchIn} • Out: {rec.punchOut}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{rec.workHours}</span>
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
    </div>
  );
}
