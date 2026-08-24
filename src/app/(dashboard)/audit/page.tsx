"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ShieldAlert,
  Clock,
  User,
  GitPullRequest,
  IndianRupee,
  Target,
  Sparkles,
} from "lucide-react";

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditEvents();
  }, []);

  const fetchAuditEvents = async () => {
    try {
      setLoading(true);
      const auditEvents: any[] = [];
      setEvents(auditEvents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Audit & Activity Stream"
        description="Immutable event chronology tracking all business, project, financial, and team changes."
        badge="IMMUTABLE HISTORY"
        icon={<ShieldAlert className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              System Activity Feeds
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cryptographically signed system event stream.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            {events.length} Recorded Events
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading immutable audit stream...</div>
        ) : (
          <div className="space-y-4">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 space-y-3 shadow-xs dark:shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">{evt.icon}</div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider ${evt.badgeColor}`}>
                      {evt.type}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">({evt.id})</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {evt.timestamp}
                  </span>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300 font-medium pt-1">
                  Actor: <strong className="text-slate-900 dark:text-slate-100">{evt.actor}</strong> • Target Entity: <strong className="text-indigo-600 dark:text-indigo-400">{evt.entity}</strong>
                </div>

                <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                  "{evt.details}"
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
