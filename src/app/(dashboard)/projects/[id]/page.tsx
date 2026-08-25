"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
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
} from "lucide-react";

export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/ess-crm/api/projects/${params.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data;
        setProject({
          ...p,
          projectCode: p.projectNumber,
          clientName: p.client?.companyName || "Unknown Client",
          status: p.status,
          health: p.priority === "HIGH" ? "AT_RISK" : "ON_TRACK",
          progress: p.progressPercentage,
          contractValue: p.contractValue,
          paidValue: p.paymentMilestones?.reduce((s: number, m: any) => s + m.paidAmount, 0) || 0,
          deadline: p.targetDeadline ? new Date(p.targetDeadline).toLocaleDateString() : "No Deadline",
          teamMembers: p.memberships?.map((m: any) => ({
            id: m.id,
            name: m.employee?.user?.name || "Unknown",
            role: m.roleInProject,
            active: m.isActive,
          })) || [],
          tasks: p.tasks || [],
          livingDocs: p.documents || [],
          scopeItems: [], // Fallback since Prisma model doesn't have it natively
          changeRequests: p.changeRequests || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<
    "overview" | "workflow" | "tasks" | "team" | "docs" | "notes" | "calls" | "changes" | "payments"
  >("overview");

  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("Dev Patel");

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    project.tasks.push({
      id: `TSK-00${project.tasks.length + 1}`,
      title: taskTitle,
      assignee: taskAssignee,
      status: "TODO",
      priority: "HIGH",
    });
    showToast(`✓ Task "${taskTitle}" assigned to ${taskAssignee}`, "success");
    setTaskTitle("");
    setIsTaskSheetOpen(false);
  };

  const tabs = [
    { id: "overview", label: "Overview & Scope" },
    { id: "workflow", label: "Workflow Playbook (72%)" },
    { id: "tasks", label: `Task Stack (${project.tasks.length})` },
    { id: "team", label: `Team & Removal History (${project.teamMembers.length})` },
    { id: "docs", label: `Living Docs (${project.livingDocs.length})` },
    { id: "notes", label: "Work Notes" },
    { id: "calls", label: "Client Calls" },
    { id: "changes", label: `Change Requests (${project.changeRequests.length})` },
    { id: "payments", label: "Payment Milestones" },
  ];

  if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse">Loading Workspace...</div>;
  if (!project) return <div className="p-12 text-center text-rose-400">Project Not Found or Access Denied</div>;

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects Workspace</span>
        </Link>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {project.projectCode}
        </span>
      </div>

      {/* Project Hero Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {project.status}
              </span>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                {project.health} (2 Days Behind)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {project.name}
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
              <span>🏢 <strong className="text-indigo-600 dark:text-indigo-400">{project.clientName}</strong></span>
              <span>•</span>
              <span>TM: <strong className="text-slate-800 dark:text-slate-200">{project.tmName}</strong></span>
              <span>•</span>
              <span>Deadline: <strong className="text-slate-800 dark:text-slate-200">{project.deadline}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/portal/demo-token-abc"
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Client Portal Preview</span>
            </Link>
          </div>
        </div>

        {/* Progress Engine */}
        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">WEIGHTED PLAYBOOK PROGRESS ∑(Stage × Weight)</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{project.progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Project Scope & Core Requirements</h3>
            <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {project.scopeItems?.map((item: any, idx: number) => (
                <li key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Financial Contract Summary</h3>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Total Value:</span>
                <strong className="font-mono text-slate-900 dark:text-slate-100">₹{project.contractValue.toLocaleString("en-IN")}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
                <span>Milestone 1 Paid:</span>
                <strong className="font-mono">₹{project.paidValue.toLocaleString("en-IN")}</strong>
              </div>
              <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400 font-bold">
                <span>Milestone 2 Overdue:</span>
                <strong className="font-mono">₹{project.overdueValue.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Active Team Members</h3>
              {project.teamMembers?.slice(0, 3).map((m: any) => (
                <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <Link href={`/employees/${m.id}`} className="hover:underline">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                    <div className="text-[11px] text-slate-500">{m.role}</div>
                  </Link>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workflow Playbook */}
      {activeTab === "workflow" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Weighted Playbook Stages</h3>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-300">
                <span>1. Requirements & Scope Approval (Weight 10%)</span>
                <span className="font-mono">100% DONE</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">All scope items signed off by Rajesh Mehta (CEO).</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-300">
                <span>2. UI/UX Design System (Weight 20%)</span>
                <span className="font-mono">100% DONE</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">Figma wireframes & component tokens approved by Priya Desai.</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
              <div className="flex justify-between font-bold text-amber-900 dark:text-amber-300">
                <span>3. Full-Stack Development (Weight 40%)</span>
                <span className="font-mono">68% IN PROGRESS</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-medium">Currently testing Razorpay webhook HMAC signatures.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Tasks */}
      {activeTab === "tasks" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Project Task Stack</h3>
            <button
              onClick={() => setIsTaskSheetOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target"
            >
              + Create Task
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {project.tasks?.map((tsk: any) => (
              <div key={tsk.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-400">{tsk.id}</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    Assignee: {tsk.assignee}
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{tsk.title}</div>
                {tsk.blockedReason && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-medium border border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{tsk.blockedReason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Team & Removal History (Requirement #12) */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Active Members */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Active Assigned Team Members</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {project.teamMembers?.map((m: any) => (
                <div key={m.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                  <Link href={`/employees/${m.id}`} className="font-bold text-slate-900 dark:text-slate-100 hover:underline block text-sm">
                    {m.name}
                  </Link>
                  <div className="text-indigo-600 dark:text-indigo-400 font-semibold">{m.role}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Assigned: {m.assignedDate}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Immutable Removal History Log (Requirement #12) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Immutable Team Removal History</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Historical work performed by past team members remains permanently preserved in the project execution record even after reassignment.
            </p>
            <div className="space-y-3 text-xs">
              {project.removalHistory?.map((rem: any) => (
                <div key={rem.id} className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>{rem.name} ({rem.role})</span>
                    <span className="text-[10px] font-mono text-slate-500">Removed: {rem.removedDate}</span>
                  </div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300">Reason: {rem.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Living Docs */}
      {activeTab === "docs" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Living Technical Documentation (v2)</h3>
          <div className="space-y-3 text-xs">
            {project.livingDocs?.map((doc: any) => (
              <div key={doc.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="text-sm">{doc.title}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">{doc.version}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  {doc.content}
                </p>
                <div className="text-[10px] text-slate-400 font-mono">Author: {doc.author} • Updated {doc.lastUpdated}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remaining Tabs fallback */}
      {["notes", "calls", "changes", "payments"].includes(activeTab) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs text-xs text-slate-600 dark:text-slate-300">
          Viewing <strong>{activeTab.toUpperCase()}</strong> workspace record for {project.name}.
        </div>
      )}

      {/* Create Task Bottom Sheet */}
      <BottomSheet
        isOpen={isTaskSheetOpen}
        onClose={() => setIsTaskSheetOpen(false)}
        title="Create Project Task"
        subtitle="Assigns task to team member stack."
      >
        <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Task Title</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Implement webhook signature retry logic"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Assignee</label>
            <select
              value={taskAssignee}
              onChange={(e) => setTaskAssignee(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="Dev Patel">Dev Patel (Full-Stack Dev)</option>
              <option value="Meet Shah">Meet Shah (Tech Lead)</option>
              <option value="Priya Desai">Priya Desai (UI/UX Lead)</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target mt-2"
          >
            Assign Task
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
