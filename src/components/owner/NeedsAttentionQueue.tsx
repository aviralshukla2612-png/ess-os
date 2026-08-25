"use client";

import React, { useState, useEffect } from "react";
import { AlertOctagon, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

export function NeedsAttentionQueue() {
  const [exceptions, setExceptions] = useState<any[]>([]);

  useEffect(() => {
    fetchExceptions();
    const interval = setInterval(fetchExceptions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchExceptions = async () => {
    try {
      const res = await fetch("/ess-crm/api/exceptions").then((r) => r.json());
      if (res.success && Array.isArray(res.data)) {
        setExceptions(res.data);
      }
    } catch (e) {
      console.error("Failed to load exceptions", e);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              Needs Your Attention
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Prioritized operational exception queue requiring founder decisions.</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
          {exceptions.length} EXCEPTIONS
        </span>
      </div>

      <div className="space-y-3">
        {exceptions.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 hover:bg-slate-100/80 dark:hover:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs dark:shadow-lg"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono ${item.badgeColor}`}>
                  {item.severity}
                </span>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.title}</h3>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{item.description}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 pt-0.5">
                <span>{item.project}</span>
                <span>•</span>
                <span>{item.time}</span>
              </div>
            </div>

            <Link
              href={item.actionHref}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 transition-all shadow-sm"
            >
              <span>{item.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
