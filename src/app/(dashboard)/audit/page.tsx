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
      const auditEvents = [
        {
          id: "EVT-101",
          type: "PROJECT_MEMBER_REASSIGNED",
          actor: "Rahul Emperor (Owner)",
          entity: "ABC E-Commerce Storefront",
          timestamp: "Today 11:30 AM",
          details: "Priya Desai assigned as lead UI/UX designer. Approved project roadmap milestone 2.",
          badgeColor: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20",
          icon: <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
        },
        {
          id: "EVT-102",
          type: "CHANGE_REQUEST_APPROVED",
          actor: "Rahul Emperor (Owner)",
          entity: "CR-2026-001 (Multi-Address Checkout Flow)",
          timestamp: "28 Jul 2026",
          details: "Scope change approved (+4 timeline days, +₹25,000 cost impact).",
          badgeColor: "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20",
          icon: <GitPullRequest className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
        },
        {
          id: "EVT-103",
          type: "LEAD_WON_CONVERTED",
          actor: "Karan Verma (Sales)",
          entity: "Lead LEAD-2026-001 (ABC Retailers Pvt Ltd)",
          timestamp: "01 Aug 2026",
          details: "Lead marked WON. Converted to Client CLT-001 and generated Project PRJ-2026-001.",
          badgeColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20",
          icon: <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        },
        {
          id: "EVT-104",
          type: "PAYMENT_MILESTONE_RECEIVED",
          actor: "Rahul Emperor (Owner)",
          entity: "Milestone 1 Advance (INV-2026-001)",
          timestamp: "06 Jul 2026",
          details: "Received ₹1,00,000 via NEFT (Ref: NEFT202607060012).",
          badgeColor: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20",
          icon: <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        },
        {
          id: "EVT-105",
          type: "SIR_HELP_BLOCKER_SUBMITTED",
          actor: "Dev Patel (Full-Stack Dev)",
          entity: "ABC E-Commerce Storefront",
          timestamp: "Today 11:45 AM",
          details: "Waiting for production Razorpay API keys from client to verify live signature.",
          badgeColor: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20",
          icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        },
      ];
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
