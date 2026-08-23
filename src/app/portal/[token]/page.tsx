import React from "react";
import { ShieldCheck, CheckCircle2, ExternalLink, Calendar, FolderKanban } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ClientPortalPage({ params }: { params: { token: string } }) {
  const { token } = params;

  // Verify the token exists in the ClientPortalToken model
  const portalToken = await prisma.clientPortalToken.findUnique({
    where: { token },
    include: {
      client: true,
      project: true,
    }
  });

  if (!portalToken) {
    return notFound();
  }

  if (!portalToken.isActive || portalToken.expiresAt < new Date()) {
    // In a real application, you might show a specific "Token Expired" page instead of a 404
    return notFound();
  }

  const clientRecord = portalToken.client;
  const activeProject = portalToken.project;

  const project = {
    clientCompany: clientRecord.companyName,
    projectName: activeProject ? activeProject.name : "Onboarding Stage",
    launchDate: activeProject?.targetDeadline ? new Date(activeProject.targetDeadline).toLocaleDateString() : "TBD",
    progress: activeProject ? activeProject.progressPercentage : 0,
    milestones: [
      { name: "1. Requirements & Scope Signoff", status: "Completed", progress: 100 },
      { name: "2. UI/UX Design Approval", status: "Completed", progress: 100 },
      { name: "3. Core Development & Payment Gateway", status: "Under Active Development", progress: 68 },
    ],
    latestUpdate: {
      title: "Development Sprint 2 Finalized",
      date: "Yesterday",
      content: "We have finalized product catalog APIs and guest checkout flows. You can test live on the staging URL.",
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090E18] text-slate-900 dark:text-slate-100 p-4 sm:p-8 space-y-6 max-w-6xl mx-auto font-sans transition-colors">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-black text-xl flex items-center justify-center font-mono shadow-xs">
            E
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">MDZ CLIENT PORTAL</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">MDZ Company • Verified Safe Token Session</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>SECURE CLIENT ACCESS</span>
        </span>
      </div>

      {/* Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase font-mono tracking-wider">{project.clientCompany}</span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{project.projectName}</h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target Launch Date: <strong className="text-slate-800 dark:text-slate-200">{project.launchDate}</strong></div>
          </div>

          <a
            href="https://staging.abcretailers.example.com"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors touch-target"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Launch Staging Preview</span>
          </a>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">Overall Project Completion</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{project.progress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Grid: Milestones & Latest Update */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Milestone Statuses</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {project.milestones.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.status}</div>
                </div>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{m.progress}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>Latest Published Updates</span>
          </h3>

          <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-indigo-950 dark:text-indigo-300">
              <span>{project.latestUpdate.title}</span>
              <span className="text-slate-400 font-mono text-[11px]">{project.latestUpdate.date}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{project.latestUpdate.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
