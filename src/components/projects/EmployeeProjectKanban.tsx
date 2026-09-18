"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Layers,
  MoreVertical,
  Check,
  Calendar,
  Briefcase,
  Star,
  Globe,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

export interface ProjectKanbanMember {
  id: string;
  employeeId: string;
  name: string;
  email?: string;
  role: string;
  active: boolean;
  assignedDate?: string;
}

export interface ProjectKanbanTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  isMostImportant?: boolean;
  assignee?: string;
  assigneeId?: string | null;
  deadline?: string | null;
}

export interface ProjectKanbanItem {
  id: string;
  projectCode: string;
  name: string;
  clientId: string;
  clientName: string;
  status: string; // PLANNING, IN_PROGRESS, ON_HOLD, INCOMPLETE, COMPLETED
  priority: string; // URGENT, HIGH, MEDIUM, LOW
  progress: number;
  deadline?: string;
  targetDeadline?: string | null;
  stagingUrl?: string | null;
  liveUrl?: string | null;
  designUrl?: string | null;
  contractValue?: number | null;
  teamMembers: ProjectKanbanMember[];
  tasks: ProjectKanbanTask[];
}

const STAGES = [
  { id: "PLANNING", label: "Planning", color: "border-amber-500/30 text-amber-500 bg-amber-500/10" },
  { id: "IN_PROGRESS", label: "In Progress", color: "border-indigo-500/30 text-indigo-500 bg-indigo-500/10" },
  { id: "ON_HOLD", label: "On Hold", color: "border-purple-500/30 text-purple-500 bg-purple-500/10" },
  { id: "INCOMPLETE", label: "Incomplete", color: "border-rose-500/30 text-rose-500 bg-rose-500/10" },
  { id: "COMPLETED", label: "Delivered / Done", color: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" },
];

interface EmployeeProjectKanbanProps {
  projects: ProjectKanbanItem[];
  employees: { id: string; name: string; email: string; role?: string; designation?: string }[];
  currentRole: string;
  onProjectUpdated?: () => void;
}

export function EmployeeProjectKanban({
  projects: initialProjects,
  employees,
  currentRole,
  onProjectUpdated,
}: EmployeeProjectKanbanProps) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<ProjectKanbanItem[]>(initialProjects);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  // Quick Assign modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetProjectForAssign, setTargetProjectForAssign] = useState<ProjectKanbanItem | null>(null);
  const [assigneeEmployeeId, setAssigneeEmployeeId] = useState("");
  const [assigneeRole, setAssigneeRole] = useState("Web Developer");
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Sync when initialProjects change
  React.useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Filter projects by developer
  const filteredProjects = projects.filter((p) => {
    if (selectedEmployeeId === "ALL") return true;
    return p.teamMembers.some((m) => m.employeeId === selectedEmployeeId && m.active);
  });

  // Calculate project tasks progress dynamically
  const calculateProgress = (tasks: ProjectKanbanTask[] = []) => {
    const activeTasks = tasks.filter((t) => t.status !== "ARCHIVED");
    if (activeTasks.length === 0) return 0;
    const done = activeTasks.filter((t) => t.status === "COMPLETED" || t.status === "DONE");
    return Math.round((done.length / activeTasks.length) * 100);
  };

  // Drag and Drop Handlers with Optimistic Updates
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData("text/plain", projectId);
    setDraggedProjectId(projectId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("text/plain") || draggedProjectId;
    setDraggedProjectId(null);

    if (!projectId) return;

    const previousProjects = [...projects];
    const projectIndex = projects.findIndex((p) => p.id === projectId);
    if (projectIndex === -1) return;

    const currentProject = projects[projectIndex];
    if (currentProject.status === targetStage) return;

    // 0ms Optimistic UI Update
    const updatedProjects = [...projects];
    updatedProjects[projectIndex] = {
      ...currentProject,
      status: targetStage,
    };
    setProjects(updatedProjects);

    try {
      const res = await fetch(`/crmtesting/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStage }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to update status");
      }
      showToast(`✓ Moved "${currentProject.name}" to ${targetStage.replace("_", " ")}`, "success");
      onProjectUpdated?.();
    } catch (err: any) {
      // Rollback on error
      setProjects(previousProjects);
      showToast(err.message || "Failed to update project status", "error");
    }
  };

  // Quick Task Complete Toggle
  const handleQuickToggleTask = async (
    e: React.MouseEvent,
    projectId: string,
    taskId: string,
    currentStatus: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const isComplete = currentStatus === "COMPLETED" || currentStatus === "DONE";
    const nextStatus = isComplete ? "PLANNING" : "COMPLETED";

    const prevProjects = [...projects];

    // Optimistic task status & progress recalculation
    const nextProjects = projects.map((p) => {
      if (p.id !== projectId) return p;
      const nextTasks = p.tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t));
      return {
        ...p,
        tasks: nextTasks,
        progress: calculateProgress(nextTasks),
      };
    });

    setProjects(nextProjects);

    try {
      const res = await fetch(`/crmtesting/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to update task");
      }
      showToast(`✓ Task marked ${nextStatus.toLowerCase()}`, "success");
      onProjectUpdated?.();
    } catch (err: any) {
      setProjects(prevProjects);
      showToast(err.message || "Task update failed", "error");
    }
  };

  // Quick Assign Member Submit
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectForAssign || !assigneeEmployeeId) return;

    try {
      setIsSubmittingAssign(true);
      const res = await fetch(`/crmtesting/api/projects/${targetProjectForAssign.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: assigneeEmployeeId,
          roleInProject: assigneeRole,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("✓ Team member assigned successfully without overwriting roster", "success");
        setIsAssignModalOpen(false);
        setAssigneeEmployeeId("");
        onProjectUpdated?.();
      } else {
        showToast(json.error || "Failed to assign member", "error");
      }
    } catch (err) {
      showToast("Error assigning team member", "error");
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Employee Project Workload
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive 5-stage drag & drop workspace with multi-member allocation
            </p>
          </div>
        </div>

        {/* Developer Selector Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            Filter Assignee:
          </span>
          <div className="relative w-full sm:w-64">
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer pr-8"
            >
              <option value="ALL">🌐 All Company Projects ({projects.length})</option>
              {employees.map((emp) => {
                const count = projects.filter((p) =>
                  p.teamMembers.some((m) => m.employeeId === emp.id && m.active)
                ).length;
                return (
                  <option key={emp.id} value={emp.id}>
                    👤 {emp.name} ({count} projects)
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {STAGES.map((stage) => {
          const stageProjects = filteredProjects.filter((p) => {
            const status = (p.status || "PLANNING").toUpperCase();
            if (stage.id === "COMPLETED") return status === "COMPLETED" || status === "DONE";
            if (stage.id === "IN_PROGRESS") return status === "IN_PROGRESS" || status === "CURRENT";
            if (stage.id === "ON_HOLD") return status === "ON_HOLD" || status === "REVISION";
            return status === stage.id;
          });

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3 min-h-[550px] flex flex-col transition-colors duration-150"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 px-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${stage.color}`}>
                    {stage.label}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {stageProjects.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 pt-3 flex-1 overflow-y-auto max-h-[750px]">
                {stageProjects.length === 0 ? (
                  <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-[11px] text-slate-400 font-medium">
                    Drop project cards here
                  </div>
                ) : (
                  stageProjects.map((project) => {
                    const activeMembers = project.teamMembers.filter((m) => m.active);
                    const activeTasks = project.tasks || [];
                    const calculatedProg = calculateProgress(activeTasks);

                    return (
                      <div
                        key={project.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, project.id)}
                        className="group bg-white dark:bg-slate-900/90 hover:border-indigo-500/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing space-y-3 relative"
                      >
                        {/* Header: Project Number + Priority */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                            {project.projectCode}
                          </span>
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded uppercase ${
                              project.priority === "URGENT" || project.priority === "HIGH"
                                ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {project.priority || "MEDIUM"}
                          </span>
                        </div>

                        {/* Title & Client */}
                        <div>
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-bold text-xs text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2"
                          >
                            {project.name}
                          </Link>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>🏢 {project.clientName}</span>
                          </div>
                        </div>

                        {/* Staging / Live URLs badges if available */}
                        {(project.stagingUrl || project.liveUrl) && (
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            {project.stagingUrl && (
                              <a
                                href={project.stagingUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:underline"
                              >
                                <Globe className="w-2.5 h-2.5" />
                                <span>Preview</span>
                              </a>
                            )}
                            {project.liveUrl && (
                              <a
                                href={project.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:underline"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Live</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            <span>Progress</span>
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {calculatedProg}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                              style={{ width: `${calculatedProg}%` }}
                            />
                          </div>
                        </div>

                        {/* Quick Task List Preview (up to 2 tasks) */}
                        {activeTasks.length > 0 && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                            {activeTasks.slice(0, 2).map((t) => {
                              const isTaskDone = t.status === "COMPLETED" || t.status === "DONE";
                              return (
                                <div
                                  key={t.id}
                                  className="flex items-center justify-between gap-2 text-[11px] p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    {t.isMostImportant && <Star className="w-3 h-3 text-amber-500 shrink-0 fill-amber-500" />}
                                    <span
                                      className={`truncate ${
                                        isTaskDone
                                          ? "line-through text-slate-400 dark:text-slate-500"
                                          : "text-slate-700 dark:text-slate-300 font-medium"
                                      }`}
                                    >
                                      {t.title}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => handleQuickToggleTask(e, project.id, t.id, t.status)}
                                    title={isTaskDone ? "Mark Pending" : "Mark Done"}
                                    className={`shrink-0 p-1 rounded-md transition-all ${
                                      isTaskDone
                                        ? "bg-emerald-500 text-white"
                                        : "border border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:text-emerald-500"
                                    }`}
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              );
                            })}
                            {activeTasks.length > 2 && (
                              <div className="text-[10px] text-slate-400 font-medium text-right">
                                +{activeTasks.length - 2} more tasks
                              </div>
                            )}
                          </div>
                        )}

                        {/* Multi-Member Card Badges + Hover Tooltip */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="relative group/roster">
                            {activeMembers.length === 0 ? (
                              <span className="text-[10px] text-slate-400 font-medium">Unassigned</span>
                            ) : activeMembers.length === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
                                <User className="w-3 h-3 text-indigo-500" />
                                <span className="truncate">{activeMembers[0].name} ({activeMembers[0].role})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 cursor-help">
                                <Users className="w-3 h-3" />
                                <span>{activeMembers.length} Members</span>
                              </span>
                            )}

                            {/* Tooltip on Hover */}
                            {activeMembers.length > 0 && (
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover/roster:block z-30 w-52 p-2.5 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 text-[10px] space-y-1.5 pointer-events-none">
                                <div className="font-bold border-b border-slate-700 pb-1 text-slate-300">
                                  Team Roster ({activeMembers.length}):
                                </div>
                                {activeMembers.map((m) => (
                                  <div key={m.id} className="flex justify-between items-center gap-2">
                                    <span className="font-semibold truncate">{m.name}</span>
                                    <span className="text-slate-400 shrink-0 font-mono text-[9px]">{m.role}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action Button: Quick Add Member or View */}
                          <div className="flex items-center gap-1 shrink-0">
                            {currentRole !== "EMPLOYEE" && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTargetProjectForAssign(project);
                                  setIsAssignModalOpen(true);
                                }}
                                title="Add team member to this project"
                                className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <Link
                              href={`/projects/${project.id}`}
                              className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                              title="Open Full Workspace"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Team Member BottomSheet */}
      <BottomSheet
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setTargetProjectForAssign(null);
        }}
        title={`Add Team Member to "${targetProjectForAssign?.name || "Project"}"`}
        subtitle="Allocate developers, designers, or editors without removing existing active members."
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Select Employee
            </label>
            <select
              required
              value={assigneeEmployeeId}
              onChange={(e) => setAssigneeEmployeeId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            >
              <option value="">-- Choose Team Member --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email}) - {emp.designation || "Staff"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Role in Project
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
              <option value="QA Engineer">QA Engineer</option>
              <option value="Sales">Sales Rep</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] leading-relaxed">
            ℹ️ <strong>Rule Safeguard:</strong> This employee will be added to the project roster. All existing team members remain active.
          </div>

          <button
            type="submit"
            disabled={isSubmittingAssign}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmittingAssign ? "Allocating..." : "Confirm & Assign Team Member"}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
