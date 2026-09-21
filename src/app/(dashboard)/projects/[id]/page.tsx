"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  IndianRupee,
  GitPullRequest,
  Eye,
  ShieldCheck,
  ArrowRight,
  Clock,
  User,
  Plus,
  History,
  Trash2,
  Pencil,
  Globe,
  ExternalLink,
  Star,
  Check,
  MessageSquare,
  Sparkles,
  Calendar,
  Layers,
  FileCode,
  UserMinus,
  AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DailyProgressEntryModal } from "@/components/projects/DailyProgressEntryModal";
import { ProjectUpdatesTimeline } from "@/components/projects/ProjectUpdatesTimeline";

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "updates" | "team" | "docs" | "changes"
  >("overview");

  // Edit Deployment URLs BottomSheet
  const [isEditUrlsOpen, setIsEditUrlsOpen] = useState(false);
  const [stagingUrl, setStagingUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [designUrl, setDesignUrl] = useState("");

  // Edit Project Settings BottomSheet (Status, Priority, Deadline)
  const [isEditSettingsOpen, setIsEditSettingsOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("IN_PROGRESS");
  const [editPriority, setEditPriority] = useState("HIGH");
  const [editDeadline, setEditDeadline] = useState("");

  // Create Task BottomSheet
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskIsMostImportant, setTaskIsMostImportant] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Post Daily Update BottomSheet
  const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);

  // Add Team Member BottomSheet
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberEmployeeId, setMemberEmployeeId] = useState("");
  const [memberRole, setMemberRole] = useState("Web Developer");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Remove Member Confirm Modal
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removalReason, setRemovalReason] = useState("");

  const userRole = (session?.user as any)?.role || "EMPLOYEE";
  const isEmployee = userRole === "EMPLOYEE";

  useEffect(() => {
    fetchProject();
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

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/crmtesting/api/projects/${params.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data;
        setProject(p);
        setStagingUrl(p.stagingUrl || "");
        setLiveUrl(p.liveUrl || "");
        setDesignUrl(p.designUrl || "");
        setEditStatus(p.status || "IN_PROGRESS");
        setEditPriority(p.priority || "HIGH");
        if (p.targetDeadline) {
          setEditDeadline(new Date(p.targetDeadline).toISOString().split("T")[0]);
        }
      } else {
        showToast(json.error || "Failed to load project", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading project workspace", "error");
    } finally {
      setLoading(false);
    }
  };

  // Execute Project Deletion
  const executeDeleteProject = async () => {
    setIsDeleteModalOpen(false);
    try {
      setIsDeleting(true);
      const res = await fetch(`/crmtesting/api/projects/${params.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Project workspace deleted successfully", "success");
        router.push("/projects");
      } else {
        showToast(json.error || "Failed to delete project", "error");
        setIsDeleting(false);
      }
    } catch (e) {
      console.error(e);
      showToast("An unexpected error occurred", "error");
      setIsDeleting(false);
    }
  };

  // Update Deployment URLs
  const handleSaveUrls = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/crmtesting/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stagingUrl: stagingUrl.trim() || null,
          liveUrl: liveUrl.trim() || null,
          designUrl: designUrl.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Deployment & Preview URLs updated", "success");
        setIsEditUrlsOpen(false);
        fetchProject();
      } else {
        showToast(json.error || "Failed to save URLs", "error");
      }
    } catch (err) {
      showToast("Error saving URLs", "error");
    }
  };

  // Update Status / Priority / Deadline
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/crmtesting/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          priority: editPriority,
          targetDeadline: editDeadline || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Project settings updated", "success");
        setIsEditSettingsOpen(false);
        fetchProject();
      } else {
        showToast(json.error || "Failed to update settings", "error");
      }
    } catch (err) {
      showToast("Error saving settings", "error");
    }
  };

  // Create Task Submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      setIsCreatingTask(true);
      const res = await fetch(`/crmtesting/api/projects/${params.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDescription.trim() || undefined,
          assignedToId: taskAssigneeId || undefined,
          priority: taskPriority,
          deadline: taskDeadline || undefined,
          isMostImportant: taskIsMostImportant,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Task "${taskTitle}" created successfully`, "success");
        setIsTaskSheetOpen(false);
        setTaskTitle("");
        setTaskDescription("");
        setTaskAssigneeId("");
        setTaskPriority("MEDIUM");
        setTaskDeadline("");
        setTaskIsMostImportant(false);
        fetchProject();
      } else {
        showToast(json.error || "Failed to create task", "error");
      }
    } catch (err) {
      showToast("Error creating task", "error");
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Toggle Task Status (Optimistic)
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const isDone = currentStatus === "COMPLETED" || currentStatus === "DONE";
    const nextStatus = isDone ? "PLANNING" : "COMPLETED";

    // Optimistic Update
    setProject((prev: any) => {
      const updatedTasks = prev.tasks.map((t: any) =>
        t.id === taskId ? { ...t, status: nextStatus } : t
      );
      const activeTasks = updatedTasks.filter((t: any) => t.status !== "ARCHIVED");
      const done = activeTasks.filter((t: any) => t.status === "COMPLETED" || t.status === "DONE");
      const progress = activeTasks.length > 0 ? Math.round((done.length / activeTasks.length) * 100) : 0;
      return { ...prev, tasks: updatedTasks, progress };
    });

    try {
      const res = await fetch(`/crmtesting/api/projects/${params.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Task status set to ${nextStatus}`, "success");
      } else {
        fetchProject();
      }
    } catch (err) {
      fetchProject();
    }
  };

  // Toggle Task Most Important Flag
  const handleToggleMostImportant = async (taskId: string, currentFlag: boolean) => {
    const nextFlag = !currentFlag;
    setProject((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) => (t.id === taskId ? { ...t, isMostImportant: nextFlag } : t)),
    }));

    try {
      await fetch(`/crmtesting/api/projects/${params.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isMostImportant: nextFlag }),
      });
      showToast(nextFlag ? "⭐ Flagged as Most Important Task" : "Unflagged task", "success");
    } catch (err) {
      fetchProject();
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/crmtesting/api/projects/${params.id}/tasks/${taskId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("Task deleted", "success");
        fetchProject();
      }
    } catch (err) {
      showToast("Failed to delete task", "error");
    }
  };

  // Post Daily Update
  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitle.trim() || !updateContent.trim()) return;

    try {
      setIsPostingUpdate(true);
      const res = await fetch(`/crmtesting/api/projects/${params.id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updateTitle.trim(),
          content: updateContent.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Daily progress update posted", "success");
        setIsUpdateSheetOpen(false);
        setUpdateTitle("");
        setUpdateContent("");
        fetchProject();
      } else {
        showToast(json.error || "Failed to post update", "error");
      }
    } catch (err) {
      showToast("Error posting update", "error");
    } finally {
      setIsPostingUpdate(false);
    }
  };

  // Add Member Submit
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmployeeId) return;

    try {
      setIsAddingMember(true);
      const res = await fetch(`/crmtesting/api/projects/${params.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: memberEmployeeId,
          roleInProject: memberRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("✓ Team member allocated to workspace", "success");
        setIsAddMemberOpen(false);
        setMemberEmployeeId("");
        fetchProject();
      } else {
        showToast(json.error || "Failed to add member", "error");
      }
    } catch (err) {
      showToast("Error adding member", "error");
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove Member Submit
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      const res = await fetch(
        `/crmtesting/api/projects/${params.id}/members?membershipId=${memberToRemove.id}&reason=${encodeURIComponent(
          removalReason || "Reassigned to another project"
        )}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Member ${memberToRemove.name} removed and logged to history`, "success");
        setMemberToRemove(null);
        setRemovalReason("");
        fetchProject();
      } else {
        showToast(json.error || "Failed to remove member", "error");
      }
    } catch (err) {
      showToast("Error removing member", "error");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading Project Workspace...</div>;
  }

  if (!project) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="text-rose-500 font-bold text-base">Project Not Found or Access Restricted</div>
        <p className="text-xs text-slate-500">You may not have permissions to view this project.</p>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Projects Directory
        </Link>
      </div>
    );
  }

  const activeMembers = (project.teamMembers || []).filter((m: any) => m.active);
  const removalHistory = project.removalHistory || [];
  const tasks = project.tasks || [];
  const clientUpdates = project.clientUpdates || [];

  const tabs = [
    { id: "overview", label: "Overview & Scope" },
    { id: "tasks", label: `Task Stack (${tasks.length})` },
    { id: "updates", label: `Daily Updates (${clientUpdates.length})` },
    { id: "team", label: `Team & Removal History (${activeMembers.length})` },
    { id: "docs", label: `Living Docs (${project.livingDocs?.length || 0})` },
    { id: "changes", label: `Change Requests (${project.changeRequests?.length || 0})` },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Workspace</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            {project.projectCode}
          </span>
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Stage: {project.status}
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-7 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20">
                {project.status}
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  project.health === "AT_RISK"
                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                }`}
              >
                {project.health || "ON_TRACK"}
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Priority: {project.priority}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {project.name}
            </h1>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3 font-medium">
              <span>🏢 <strong className="text-indigo-600 dark:text-indigo-400">{project.clientName}</strong></span>
              <span>•</span>
              <span>TM: <strong className="text-slate-800 dark:text-slate-200">{project.tmName}</strong></span>
              <span>•</span>
              <span>Deadline: <strong className="text-slate-800 dark:text-slate-200">{project.deadline}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {!isEmployee && (
              <button
                onClick={() => setIsEditSettingsOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Status</span>
              </button>
            )}

            <Link
              href={`/portal/preview-${project.id}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-500/20 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Client Portal Preview</span>
            </Link>

            {userRole === "OWNER" && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete Project"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Synchronized Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold items-center">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              OVERALL PROJECT PROGRESS (SYNCHRONIZED WITH COMPLETED TASKS)
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm font-extrabold">
              {project.progress}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Deployment & Previews Quick Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Staging URL */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Staging Preview</div>
                {project.stagingUrl ? (
                  <a
                    href={project.stagingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                  >
                    {project.stagingUrl.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Preview Pending Deployment
                  </span>
                )}
              </div>
            </div>
            {!isEmployee && (
              <button
                onClick={() => setIsEditUrlsOpen(true)}
                className="text-[10px] text-slate-400 hover:text-indigo-500 font-bold ml-1 shrink-0"
              >
                Edit
              </button>
            )}
          </div>

          {/* Live Production URL */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Live Production</div>
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline truncate block"
                  >
                    {project.liveUrl.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Production Pending</span>
                )}
              </div>
            </div>
            {!isEmployee && (
              <button
                onClick={() => setIsEditUrlsOpen(true)}
                className="text-[10px] text-slate-400 hover:text-indigo-500 font-bold ml-1 shrink-0"
              >
                Edit
              </button>
            )}
          </div>

          {/* Figma / Design Link */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <FileCode className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Figma Design</div>
                {project.designUrl ? (
                  <a
                    href={project.designUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline truncate block"
                  >
                    Open Design Files
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">Design Link Pending</span>
                )}
              </div>
            </div>
            {!isEmployee && (
              <button
                onClick={() => setIsEditUrlsOpen(true)}
                className="text-[10px] text-slate-400 hover:text-indigo-500 font-bold ml-1 shrink-0"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & SCOPE */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Project Scope & Deliverables
              </h3>
            </div>
            {project.scopeItems && project.scopeItems.length > 0 ? (
              <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {project.scopeItems.map((item: string, idx: number) => (
                  <li
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                  >
                    {item}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No specific scope checklist defined for this project.
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Financial Summary Card (strictly masked for employee) */}
            {!isEmployee && project.contractValue !== null && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4 text-xs">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-500" />
                  Financial Contract Summary
                </h3>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Total Contract Value</div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                    ₹{project.contractValue.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            )}

            {/* Active Team Roster Chip Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-500" />
                  Active Team ({activeMembers.length})
                </h3>
                {!isEmployee && (
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    + Assign
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {activeMembers.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{m.name}</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASK STACK */}
      {activeTab === "tasks" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Project Task Stack
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage daily engineering, design, and QA deliverables with priority star flags.
              </p>
            </div>
            <button
              onClick={() => setIsTaskSheetOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <p>No tasks created yet for this project workspace.</p>
              <button
                onClick={() => setIsTaskSheetOpen(true)}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                + Add your first task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any) => {
                const isComplete = task.status === "COMPLETED" || task.status === "DONE";
                return (
                  <div
                    key={task.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                      isComplete
                        ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/40 opacity-75"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-indigo-500/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Quick check complete button */}
                      <button
                        onClick={() => handleToggleTaskStatus(task.id, task.status)}
                        className={`p-1.5 rounded-xl border mt-0.5 transition-all ${
                          isComplete
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:text-emerald-500 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      {/* Star flag */}
                      <button
                        onClick={() => handleToggleMostImportant(task.id, task.isMostImportant)}
                        className="p-1 rounded-md text-slate-300 hover:text-amber-500 transition-colors mt-0.5"
                        title="Toggle Most Important"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            task.isMostImportant ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-600"
                          }`}
                        />
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-xs font-bold ${
                              isComplete
                                ? "line-through text-slate-400 dark:text-slate-500"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {task.title}
                          </h4>
                          {task.isMostImportant && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                              ⭐ High Priority Target
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-medium">
                          <span>Assignee: <strong className="text-slate-700 dark:text-slate-300">{task.assignee || "Unassigned"}</strong></span>
                          {task.deadline && <span>• Due: <strong className="text-slate-700 dark:text-slate-300">{task.deadline}</strong></span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase ${
                          isComplete
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                            : task.status === "IN_PROGRESS"
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {task.status}
                      </span>

                      {!isEmployee && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DAILY UPDATES */}
      {activeTab === "updates" && (
        <ProjectUpdatesTimeline
          updates={clientUpdates}
          onOpenPostModal={() => setIsUpdateSheetOpen(true)}
        />
      )}

      {/* TAB 4: TEAM & REMOVAL HISTORY */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Active Members Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Active Team Members ({activeMembers.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Engineers and specialists actively allocated to this project workspace.
                </p>
              </div>
              {!isEmployee && (
                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Team Member</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                    <th className="py-3 px-3">Team Member</th>
                    <th className="py-3 px-3">Project Role</th>
                    <th className="py-3 px-3">Assigned Date</th>
                    {!isEmployee && <th className="py-3 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeMembers.map((m: any) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                        <div className="text-[11px] text-slate-400">{m.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/20 text-[11px]">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {m.assignedDate || "Active"}
                      </td>
                      {!isEmployee && (
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setMemberToRemove({ id: m.id || m.membershipId, name: m.name })}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-[11px] hover:bg-rose-100 transition-colors inline-flex items-center gap-1"
                          >
                            <UserMinus className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Immutable Removal History Log */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Immutable Member Removal Audit Log ({removalHistory.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited historical records of reassignments and deallocations with reasons.
              </p>
            </div>

            {removalHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                No member removals recorded for this project.
              </div>
            ) : (
              <div className="space-y-2">
                {removalHistory.map((h: any) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{h.name}</span>{" "}
                      <span className="text-slate-400 font-mono text-[10px]">({h.role})</span>
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                        Reason: {h.reason}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                      Removed on {h.removedDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: LIVING DOCS */}
      {activeTab === "docs" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Living Documentation & Architecture Specs
          </h3>
          {project.livingDocs && project.livingDocs.length > 0 ? (
            <div className="space-y-3">
              {project.livingDocs.map((doc: any) => (
                <div key={doc.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{doc.title}</h4>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                      {doc.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {doc.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No living documents linked yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CHANGE REQUESTS */}
      {activeTab === "changes" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Scope Change Requests & Addendums
          </h3>
          {project.changeRequests && project.changeRequests.length > 0 ? (
            <div className="space-y-3">
              {project.changeRequests.map((cr: any) => (
                <div key={cr.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-600">{cr.id}</span>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{cr.title}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px]">
                    {cr.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No change requests on record.
            </div>
          )}
        </div>
      )}

      {/* Edit Deployment URLs BottomSheet */}
      <BottomSheet
        isOpen={isEditUrlsOpen}
        onClose={() => setIsEditUrlsOpen(false)}
        title="Configure Deployment & Design Links"
        subtitle="Manage live production, staging preview deployment, and Figma design URLs."
      >
        <form onSubmit={handleSaveUrls} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Staging / Test Preview URL
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
              Live Production URL
            </label>
            <input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://app.example.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Figma / Design Link
            </label>
            <input
              type="url"
              value={designUrl}
              onChange={(e) => setDesignUrl(e.target.value)}
              placeholder="https://figma.com/file/..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
          >
            Save Deployment Links
          </button>
        </form>
      </BottomSheet>

      {/* Edit Project Settings BottomSheet */}
      <BottomSheet
        isOpen={isEditSettingsOpen}
        onClose={() => setIsEditSettingsOpen(false)}
        title="Edit Project Stage & Priority"
        subtitle="Update execution stage, priority quadrant, and target delivery deadline."
      >
        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Project Stage
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="INCOMPLETE">Incomplete</option>
              <option value="COMPLETED">Delivered / Done</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Priority
            </label>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
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
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                onClick={(e) => (e.currentTarget as any).showPicker?.()}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pl-10 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all dark:[color-scheme:dark] cursor-pointer"
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
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all"
          >
            Save Changes
          </button>
        </form>
      </BottomSheet>

      {/* Create Task BottomSheet */}
      <BottomSheet
        isOpen={isTaskSheetOpen}
        onClose={() => setIsTaskSheetOpen(false)}
        title="Create New Task"
        subtitle="Add a deliverable to the project stack and assign it to an engineer."
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement Prisma Client Schema Migrations"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Provide context or acceptance criteria..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Assignee
              </label>
              <select
                value={taskAssigneeId}
                onChange={(e) => setTaskAssigneeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              >
                <option value="">-- Unassigned --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              >
                <option value="URGENT">🔴 Urgent</option>
                <option value="HIGH">🟠 High</option>
                <option value="MEDIUM">🔵 Medium</option>
                <option value="LOW">🟢 Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Task Deadline
            </label>
            <div className="relative flex items-center">
              <input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                onClick={(e) => (e.currentTarget as any).showPicker?.()}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pl-10 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all dark:[color-scheme:dark] cursor-pointer"
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
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isMostImportant"
              checked={taskIsMostImportant}
              onChange={(e) => setTaskIsMostImportant(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isMostImportant" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1">
              ⭐ Mark as Most Important Target
            </label>
          </div>

          <button
            type="submit"
            disabled={isCreatingTask}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {isCreatingTask ? "Adding..." : "Add to Task Stack"}
          </button>
        </form>
      </BottomSheet>

      {/* Post Daily Update Modal */}
      <DailyProgressEntryModal
        isOpen={isUpdateSheetOpen}
        onClose={() => setIsUpdateSheetOpen(false)}
        onSuccess={fetchProject}
        fixedProject={
          project
            ? {
                id: project.id,
                name: project.name,
                projectCode: project.projectCode,
                clientName: project.clientName,
              }
            : undefined
        }
      />

      {/* Add Team Member BottomSheet */}
      <BottomSheet
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Assign Team Member"
        subtitle="Allocate a team member to this project without overwriting existing members."
      >
        <form onSubmit={handleAddMember} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
              Employee *
            </label>
            <select
              required
              value={memberEmployeeId}
              onChange={(e) => setMemberEmployeeId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            >
              <option value="">-- Choose Employee --</option>
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
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
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

          <button
            type="submit"
            disabled={isAddingMember}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {isAddingMember ? "Assigning..." : "Confirm & Allocate"}
          </button>
        </form>
      </BottomSheet>

      {/* Remove Member Confirm Modal with Reason */}
      <ConfirmModal
        isOpen={!!memberToRemove}
        onClose={() => {
          setMemberToRemove(null);
          setRemovalReason("");
        }}
        onConfirm={handleRemoveMember}
        title={`Remove ${memberToRemove?.name || "Member"} from Project`}
        message={`Are you sure you want to deactivate ${memberToRemove?.name || "this member"} from this project workspace? This will be permanently recorded in the immutable audit log.`}
        confirmText="Confirm Removal"
        isDestructive={true}
      />

      {/* Project Deletion Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteProject}
        title="Delete Entire Project Workspace"
        message="Are you completely sure you want to permanently delete this project? This will remove all tasks, team allocations, updates, and documents. This cannot be undone."
        confirmText="Yes, delete workspace"
        isDestructive={true}
      />
    </div>
  );
}
