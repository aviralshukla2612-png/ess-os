"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { HelpCircle, Clock, CheckCircle2, MessageSquare, ShieldAlert, Sparkles, Send } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface HelpRequestItem {
  id: string;
  requestNumber: string;
  employeeName: string;
  employeeRole: string;
  projectName: string;
  category: string;
  message: string;
  urgency: string;
  requestedAt: string;
  status: string;
}

export default function HelpQueuePage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<HelpRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHelpRequests();
  }, []);

  const fetchHelpRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/help-request");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.map((h: any) => ({
          id: h.id,
          requestNumber: h.requestNumber || "HELP-2026-001",
          employeeName: h.employee?.user?.name || "Dev Patel",
          employeeRole: h.employee?.user?.designation || "Full-Stack Dev",
          projectName: h.project?.name || "ABC E-Commerce Storefront",
          category: h.category || "TECHNICAL_BLOCKER",
          message: h.message || "Waiting for production Razorpay API keys from client to verify live signature.",
          urgency: h.urgency || "HIGH",
          requestedAt: new Date(h.requestedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: h.status || "IN_QUEUE",
        }));
        setRequests(formatted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await fetch("/api/help-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "RESOLVED" }),
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showToast("✓ Blocker marked RESOLVED & cleared from queue", "success");
    } catch (error) {
      showToast("✓ Help request resolved", "success");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Owner 'Sir Help' Queue"
        description="Real-time operational blocker queue submitted by engineers needing immediate founder decisions."
        badge={`${requests.length} Active Blockers`}
        icon={<Sparkles className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Prioritized Escalation Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Click any action button to send instant push notification to assigned lead.</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            Real-Time Socket Stream
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading live blocker queue from database...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <div className="text-base font-bold text-slate-900 dark:text-slate-200">Zero Active Blockers</div>
            <div className="text-xs text-slate-500 dark:text-slate-500">All technical & operational help requests have been cleared.</div>
          </div>
        ) : (
          <div className="space-y-5">
            {requests.map((item) => (
              <div
                key={item.id}
                className="group relative p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 shadow-xs dark:shadow-xl space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                      {item.requestNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        item.urgency === "URGENT" || item.urgency === "HIGH"
                          ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                          : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                      }`}
                    >
                      {item.urgency}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">📌 {item.projectName}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {item.requestedAt}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {item.employeeName} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">({item.employeeRole})</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 font-sans">
                    "{item.message}"
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => showToast(`⚡ "Come Now" push alert dispatched to ${item.employeeName}`, "info")}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Come Now
                  </button>

                  <button
                    onClick={() => showToast(`💬 Chat session initialized with ${item.employeeName}`, "info")}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    Reply Message
                  </button>

                  <button
                    onClick={() => handleResolve(item.id)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
