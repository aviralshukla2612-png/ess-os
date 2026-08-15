"use client";

import React from "react";
import { CommandMetrics } from "@/components/owner/CommandMetrics";
import { NeedsAttentionQueue } from "@/components/owner/NeedsAttentionQueue";
import { AIOwnerAssistant } from "@/components/owner/AIOwnerAssistant";
import { RealtimeTeamView } from "@/components/owner/RealtimeTeamView";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plus, Download, Crown } from "lucide-react";
import Link from "next/link";

import { useToast } from "@/components/ui/Toast";

export default function OwnerDashboardPage() {
  const { showToast } = useToast();

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Page Header */}
      <PageHeader
        title="Good morning, Rahul"
        description="Here's what needs your attention across Emperor Smart Solutions today."
        badge="EXECUTIVE MODE"
        icon={<Crown className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast("Executive brief export initiated (PDF)", "info")}
              className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Export Executive Brief</span>
            </button>
            <Link
              href="/leads"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead / Project</span>
            </Link>
          </div>
        }
      />

      {/* Open Section 1: Top 5 Key Metrics */}
      <section className="space-y-3">
        <CommandMetrics />
      </section>

      {/* Open Section 2: Needs Attention Exception Queue */}
      <section className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <NeedsAttentionQueue />
      </section>

      {/* Open Section 3: AI Executive Brief & Realtime Team Status */}
      <section className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
        <AIOwnerAssistant />
        <RealtimeTeamView />
      </section>
    </div>
  );
}
