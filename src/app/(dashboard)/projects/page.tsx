"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FolderKanban,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Trash2,
  LayoutGrid,
  List,
  Layers,
  Users,
  Calendar,
  Globe,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmployeeProjectKanban } from "@/components/projects/EmployeeProjectKanban";

export default function ProjectsDirectoryPage() {
  const { showToast } = useToast();
  const { data: session } = useSession();
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Form State
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [contractValue, setContractValue] = useState<number | "">("");
  const [priority, setPriority] = useState("HIGH");
  const [assigneeId, setAssigneeId] = useState("");
  const [assigneeRole, setAssigneeRole] = useState("Web Developer");
  const [deadline, setDeadline] = useState("");
  const [stagingUrl, setStagingUrl] = useState("");
  const [scopeText, setScopeText] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);

  const userRole = (session?.user as any)?.role || "EMPLOYEE";

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
  }, []);

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

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/crmtesting/api/projects");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProjectsList(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!projectToDelete) return;
    try {
      const res = await fetch(`/crmtesting/api/projects/${projectToDelete}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Project deleted successfully", "success");
        fetchProjects();
      } else {
        showToast(json.error || "Failed to delete project", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("An unexpected error occurred", "error");
    } finally {
      setProjectToDelete(null);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/crmtesting/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          clientName: clientName.trim() || undefined,
          contractValue: contractValue !== "" ? Number(contractValue) : 0,
          priority,
          assigneeId: assigneeId || undefined,
          assigneeRole,
          deadline: deadline || undefined,
          stagingUrl: stagingUrl || undefined,
          scopeText: scopeText || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Project "${projectName || "New Project"}" created successfully`, "success");
        fetchProjects();
        setIsAddOpen(false);
        setProjectName("");
        setClientName("");
        setContractValue("");
        setPriority("HIGH");
        setAssigneeId("");
        setDeadline("");
        setStagingUrl("");
        setScopeText("");
      } else {
        showToast(json.error || "Failed to create project", "error");
      }
    } catch (error) {
      showToast("An error occurred creating the project", "error");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Project Management & Tracking"
        description="Master directory of client projects, multi-employee assignments, 5-stage Kanban board, and daily progress."
        badge={`${projectsList.length} ACTIVE PROJECTS`}
        icon={<FolderKanban className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "kanban"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List Directory</span>
              </button>
            </div>

            {/* Create Project Button */}
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        }
      />

      {/* Main Content Area: Kanban vs Directory List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
          Loading active project workspaces from database...
        </div>
      ) : viewMode === "kanban" ? (
        <EmployeeProjectKanban
          projects={projectsList}
          employees={employees}
          currentRole={userRole}
          onProjectUpdated={fetchProjects}
        />
      ) : (
        <div className="space-y-4">
          {projectsList.map((p) => {
            const activeMembers = (p.teamMembers || []).filter((m: any) => m.active);
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-7 shadow-xs hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-200 space-y-4 group"
              >
                {/* Row 1: Title & Health Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                        {p.projectCode || p.id}
                      </span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        🏢 {p.clientName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                        Stage: {p.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                      {p.progress || 0}% Complete
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        p.health === "AT_RISK"
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                          : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                      }`}
                    >
                      {p.health || "ON_TRACK"}
                    </span>
                    {userRole === "OWNER" && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setProjectToDelete(p.id);
                        }}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${p.progress || 0}%` }}
                  />
                </div>

                {/* Row 2: Team Roster, Deadline & Navigation Arrow */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1 font-medium">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span>Team:</span>
                    {activeMembers.length === 0 ? (
                      <strong className="text-slate-600 dark:text-slate-400">Unassigned</strong>
                    ) : (
                      activeMembers.map((m: any) => (
                        <span
                          key={m.id}
                          className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700"
                        >
                          👤 {m.name} ({m.role})
                        </span>
                      ))
                    )}
                    <span>• Deadline: <strong className="text-slate-800 dark:text-slate-200">{p.deadline || "TBD"}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>Open Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Project BottomSheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Project Workspace"
        subtitle="Provision a client project with scope, deadline, and team allocation."
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Next.js High-Conversion E-Commerce App"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {userRole !== "EMPLOYEE" && (
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Client Company Name *
              </label>
              <input
                type="text"
                required={userRole !== "EMPLOYEE"}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Apex Global Innovations"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          {userRole !== "EMPLOYEE" && (
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Contract Value (₹)
              </label>
              <input
                type="number"
                min="0"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 250000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              >
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Target Deadline
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  onClick={(e) => (e.currentTarget as any).showPicker?.()}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pl-10 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all dark:[color-scheme:dark] cursor-pointer font-medium"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector('input[type="date"]') as HTMLInputElement;
                    input?.showPicker?.();
                  }}
                  className="absolute left-3 text-slate-400 hover:text-indigo-500 transition-colors p-1"
                  title="Open Calendar Date Picker"
                >
                  <Calendar className="w-4 h-4 text-indigo-500" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {[
                  { label: "+7 Days", days: 7 },
                  { label: "+14 Days", days: 14 },
                  { label: "+30 Days", days: 30 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + preset.days);
                      setDeadline(d.toISOString().split("T")[0]);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-semibold transition-all border border-slate-200 dark:border-slate-700"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Assign Team Member
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              >
                <option value="">-- Leave Unassigned --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Initial Role
              </label>
              <select
                value={assigneeRole}
                onChange={(e) => setAssigneeRole(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              >
                <option value="Web Developer">Web Developer</option>
                <option value="Tech Lead">Tech Lead / TM</option>
                <option value="Graphic Designer">Graphic Designer</option>
                <option value="Video Editor">Video Editor</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Staging / Test Preview URL (Optional)
            </label>
            <input
              type="url"
              value={stagingUrl}
              onChange={(e) => setStagingUrl(e.target.value)}
              placeholder="https://staging.app.example.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Scope of Work (One item per line)
            </label>
            <textarea
              rows={3}
              value={scopeText}
              onChange={(e) => setScopeText(e.target.value)}
              placeholder="e.g. Next.js App Router Architecture&#10;Stripe Payment Gateway Integration&#10;Figma UI Conversion"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Provision Project Workspace
          </button>
        </form>
      </BottomSheet>

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={executeDelete}
        title="Delete Project Workspace"
        message="Are you completely sure you want to permanently delete this project? This action will destroy all related tasks, documents, and records. This cannot be undone."
        confirmText="Yes, delete project"
        isDestructive={true}
      />
    </div>
  );
}
