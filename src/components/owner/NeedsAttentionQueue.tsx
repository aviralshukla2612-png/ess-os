"use client";

import React, { useState, useEffect } from "react";
import { AlertOctagon, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function NeedsAttentionQueue() {
  const [helpRequests, setHelpRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchHelpRequests();
  }, []);

  const fetchHelpRequests = async () => {
    try {
      const res = await fetch("/api/help-request");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setHelpRequests(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const exceptions = [
    {
      id: "EXC-001",
      severity: "CRITICAL",
      title: "Project ABC: Deadline Risk (2 Days Behind)",
      description: "Backend development blocked waiting for production Razorpay API credentials from client.",
      project: "ABC E-Commerce Storefront",
      actionText: "Inspect Project Workspace",
      actionHref: "/projects",
      badgeColor: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20",
      time: "8 mins ago",
    },
    {
      id: "EXC-002",
      severity: "HIGH",
      title: "₹1,00,000 Milestone Payment Overdue (INV-2026-002)",
      description: "ABC Retailers Pvt Ltd Milestone 2 invoice overdue by 3 days.",
      project: "ABC E-Commerce Storefront",
      actionText: "Send Payment Reminder",
      actionHref: "/finance",
      badgeColor: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20",
      time: "3 days overdue",
    },
    ...(helpRequests.length > 0
      ? helpRequests.slice(0, 2).map((h) => ({
          id: h.id,
          severity: h.urgency || "HIGH",
          title: `${h.employee?.user?.name || "Staff Lead"}: "Sir Help" Escalation Request`,
          description: h.message || "Escalated technical blocker requiring immediate owner decision.",
          project: h.project?.name || "Active Project",
          actionText: "Respond in Help Queue",
          actionHref: "/help-queue",
          badgeColor: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20",
          time: new Date(h.requestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }))
      : [
          {
            id: "EXC-003",
            severity: "HIGH",
            title: "Dev Patel: Sir Help Request Waiting",
            description: "Category: Technical Blocker - Razorpay HMAC webhook signature testing issue.",
            project: "ABC E-Commerce Storefront",
            actionText: "Respond in Help Queue",
            actionHref: "/help-queue",
            badgeColor: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20",
            time: "12 mins waiting",
          },
        ]),
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
      {/* Section Heading */}
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

      {/* Open Rows List */}
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
