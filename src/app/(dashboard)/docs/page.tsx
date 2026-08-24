"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookOpen, Sparkles, FileText, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function DocsPage() {
  const { showToast } = useToast();

  const docs: any[] = [];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Project Living Knowledge Base"
        description="Version-controlled technical specifications, architecture docs, and project handovers."
        badge="KNOWLEDGE REPOSITORY"
        icon={<BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Project Documentation Register
          </h2>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            {docs.length} Documents
          </span>
        </div>

        <div className="space-y-4">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 space-y-3 shadow-xs dark:shadow-lg group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">📌 {doc.project}</span>
                <span className="text-[10px] font-mono font-bold px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                  {doc.version}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-sans leading-relaxed">{doc.summary}</p>
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>Updated by: <strong className="text-slate-800 dark:text-slate-200">{doc.updatedBy}</strong> ({doc.updatedAt})</span>
                <button
                  onClick={() => showToast(`📖 Opening specification document ${doc.id}`, "info")}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <span>Inspect Spec & Diffs</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
