"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { DailyProgressEntryModal } from "@/components/projects/DailyProgressEntryModal";
import {
  MessageSquare,
  Plus,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Clock,
  FolderKanban,
  Users,
  ArrowRight,
  Sparkles,
  Search,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

export default function MasterDailyUpdatesPage() {
  const { showToast } = useToast();
  const { data: session } = useSession();

  const [updates, setUpdates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalSubmissionsToday: 0,
    projectsUpdatedToday: 0,
    blockersCount: 0,
    criticalAlertsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [selectedHealthStatus, setSelectedHealthStatus] = useState<string>("ALL");

  // Metadata for filter options
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Post Update Modal
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchProjectsList();
    fetchDailyFeed();
  }, [selectedDate, selectedEmployeeId, selectedProjectId, selectedHealthStatus]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/crmtesting/api/employees");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmployees(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProjectsList = async () => {
    try {
      const res = await fetch("/crmtesting/api/projects");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProjects(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDailyFeed = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (selectedEmployeeId && selectedEmployeeId !== "ALL") params.append("employeeId", selectedEmployeeId);
      if (selectedProjectId && selectedProjectId !== "ALL") params.append("projectId", selectedProjectId);
      if (selectedHealthStatus && selectedHealthStatus !== "ALL") params.append("healthStatus", selectedHealthStatus);

      const res = await fetch(`/crmtesting/api/daily-updates?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setUpdates(json.data.updates || []);
        if (json.data.stats) {
          setStats(json.data.stats);
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load daily updates feed", "error");
    } finally {
      setLoading(false);
    }
  };

  const getHealthBadge = (status?: string) => {
    switch (status) {
      case "BLOCKED":
        return {
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />,
          label: "Blocked",
          className: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20",
        };
      case "AT_RISK":
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
          label: "Minor Risk",
          className: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
        };
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          label: "On Track",
          className: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
        };
    }
  };

  const clearFilters = () => {
    setSelectedDate("");
    setSelectedEmployeeId("ALL");
    setSelectedProjectId("ALL");
    setSelectedHealthStatus("ALL");
  };

  const isEmployee = (session?.user as any)?.role === "EMPLOYEE";

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title={isEmployee ? "My Daily Progress Reports" : "Daily Progress Reports & Review Feed"}
        description={
          isEmployee
            ? "View and track your submitted daily progress reports, completed task logs, and blockers."
            : "Master live feed of daily engineering, design, and sales updates posted across all company projects."
        }
        badge={isEmployee ? "EMPLOYEE PORTAL" : `${updates.length} REPORTS LOADED`}
        icon={<MessageSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Post Daily Update</span>
          </button>
        }
      />

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Today */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{isEmployee ? "MY SUBMISSIONS" : "SUBMISSIONS TODAY"}</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
            {stats.totalSubmissionsToday}
          </div>
        </div>

        {/* Projects Updated */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{isEmployee ? "MY ACTIVE PROJECTS" : "PROJECTS ACTIVE"}</span>
            <FolderKanban className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
            {stats.projectsUpdatedToday}
          </div>
        </div>

        {/* Blockers Flagged */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{isEmployee ? "MY REPORTED BLOCKERS" : "BLOCKERS REPORTED"}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {stats.blockersCount}
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>CRITICAL / AT RISK</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
            {stats.criticalAlertsCount}
          </div>
        </div>
      </div>

      {/* Filter Toolbar Bar */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>{isEmployee ? "Filter My Progress Reports:" : "Filter Feed by Date, Member & Health:"}</span>
          </div>

          {(selectedDate || selectedEmployeeId !== "ALL" || selectedProjectId !== "ALL" || selectedHealthStatus !== "ALL") && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isEmployee ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-3 text-xs`}>
          {/* Calendar Date Picker */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Inspection Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Employee Filter - only shown to Admin / Sub-Admin */}
          {!isEmployee && (
            <div>
              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Team Member
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Team Members</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} ({emp.designation || "Staff"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Project Workspace
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.projectCode}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Health Status Filter */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Status Flag
            </label>
            <select
              value={selectedHealthStatus}
              onChange={(e) => setSelectedHealthStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ON_TRACK">🟢 On Track Only</option>
              <option value="AT_RISK">🟡 Minor Risk Only</option>
              <option value="BLOCKED">🔴 Blocked / Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Reports Feed */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
          Loading master daily updates feed from database...
        </div>
      ) : updates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
          <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="font-semibold text-sm text-slate-600 dark:text-slate-400">
            No daily progress reports match the selected criteria.
          </p>
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
          >
            + Post a new progress report
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => {
            const healthBadge = getHealthBadge(update.healthStatus);

            return (
              <div
                key={update.id}
                className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-xs hover:shadow-lg transition-all space-y-4 group"
              >
                {/* Header: Project Badge, Client & Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                      {update.projectCode}
                    </span>
                    <Link
                      href={`/projects/${update.projectId}`}
                      className="font-extrabold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{update.projectName}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • 🏢 {update.clientName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${healthBadge.className}`}
                    >
                      {healthBadge.icon}
                      <span>{healthBadge.label}</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {update.formattedDate}
                    </span>
                  </div>
                </div>

                {/* Author Info & Headline */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {update.author.name ? update.author.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                        {update.author.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                        👤 {update.author.roleInProject}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pl-9">
                    {update.title}
                  </h3>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-9 font-medium">
                    {update.content}
                  </p>
                </div>

                {/* Blocker Alert */}
                {update.blockers && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs ml-9 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 text-[11px]">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Reported Blocker:</span>
                    </div>
                    <p className="text-rose-800 dark:text-rose-200 text-xs leading-relaxed font-medium pl-5">
                      {update.blockers}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Post Daily Update Modal */}
      <DailyProgressEntryModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSuccess={fetchDailyFeed}
        availableProjects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          projectCode: p.projectCode,
          clientName: p.clientName,
        }))}
      />
    </div>
  );
}
