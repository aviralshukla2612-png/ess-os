"use client";

import React from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  Clock,
  User,
  Plus,
  MessageSquare,
} from "lucide-react";

export interface ProjectUpdateItem {
  id: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  title: string;
  content: string;
  blockers?: string | null;
  healthStatus?: string;
  createdAt: string | Date;
  formattedDate?: string;
  author: {
    id: string;
    name: string;
    email?: string;
    designation?: string;
    avatarUrl?: string | null;
    roleInProject?: string;
  };
}

interface ProjectUpdatesTimelineProps {
  updates: ProjectUpdateItem[];
  onOpenPostModal: () => void;
}

export function ProjectUpdatesTimeline({
  updates,
  onOpenPostModal,
}: ProjectUpdatesTimelineProps) {
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

  const formatRelativeTime = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) return `Today at ${timeStr}`;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${timeStr}`;
    }

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>Daily Progress Timeline</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological log of work completed, changelog notes, and blockers reported by the team.
          </p>
        </div>
        <button
          onClick={onOpenPostModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Daily Update</span>
        </button>
      </div>

      {/* Updates Feed */}
      {updates.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-5 h-5" />
          </div>
          <p>No daily progress reports posted yet for this project workspace.</p>
          <button
            onClick={onOpenPostModal}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Post today's progress
          </button>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {updates.map((update) => {
            const healthBadge = getHealthBadge(update.healthStatus);

            return (
              <div key={update.id} className="relative group">
                {/* Timeline Pin Dot */}
                <div className="absolute -left-6 top-3 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-500 flex items-center justify-center -translate-x-1/2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                </div>

                {/* Card */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-xs transition-all space-y-3">
                  {/* Top Bar: Author, Role & Health */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/50 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {update.author.name ? update.author.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                            {update.author.name}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 font-semibold text-slate-700 dark:text-slate-300">
                            👤 {update.author.roleInProject || update.author.designation || "Contributor"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(update.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${healthBadge.className}`}
                      >
                        {healthBadge.icon}
                        <span>{healthBadge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Detailed Notes */}
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                      {update.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                      {update.content}
                    </p>
                  </div>

                  {/* Blocker Callout */}
                  {update.blockers && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Flagged Blocker / Impediment:</span>
                      </div>
                      <p className="text-rose-800 dark:text-rose-200 text-[11px] leading-relaxed pl-5 font-medium">
                        {update.blockers}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
