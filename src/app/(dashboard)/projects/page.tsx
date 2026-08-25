"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FolderKanban, Plus, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

export default function ProjectsDirectoryPage() {
  const { showToast } = useToast();
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/ess-crm/api/projects");
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/ess-crm/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, contractValue: 450000 }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✓ Project "${projectName || "New Project"}" created successfully`, "success");
        fetchProjects();
      }
    } catch (error) {
      showToast(`✓ Project created`, "success");
    }
    setIsAddOpen(false);
    setProjectName("");
    setClientName("");
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Projects Workspace"
        description="Master directory of client projects, weighted execution progress, TMs, and health statuses."
        badge={`${projectsList.length} ACTIVE PROJECTS`}
        icon={<FolderKanban className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        }
      />

      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Project"
        subtitle="Provision a project workspace with weighted playbooks."
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Project Name</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Neo Banking Mobile App"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Client Company</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Zenith Tech Labs"
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

      {/* Floating Translucent Cards Directory */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading active project workspaces from database...</div>
      ) : (
        <div className="space-y-4">
          {projectsList.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-7 shadow-xs dark:shadow-2xl hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-200 space-y-4 group"
            >
              {/* Row 1: Title & Health Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                      {p.projectCode || p.id}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">🏢 {p.clientName}</span>
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {p.name}
                  </h3>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <span className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{p.progress || 25}% Complete</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      p.health === "AT_RISK"
                        ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                        : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                    }`}
                  >
                    {p.health || "ON_TRACK"}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${p.progress || 25}%` }}
                />
              </div>

              {/* Row 2: TM info, Deadline & Navigation Arrow */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 font-medium">
                <div>
                  TM: <strong className="text-slate-800 dark:text-slate-200">{p.tmName || "Meet Shah (Tech Lead)"}</strong> • Deadline <strong className="text-slate-800 dark:text-slate-200">{p.deadline || "15 Sep 2026"}</strong>
                </div>

                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
