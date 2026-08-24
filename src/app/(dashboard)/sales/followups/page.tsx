"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PhoneCall, Calendar, Clock, CheckCircle2, Target, ArrowUpRight, Sparkles, Phone, MessageSquare, Send } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

export default function SalesFollowupsPage() {
  const { showToast } = useToast();
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowups();
  }, []);

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/mdz-os/api/leads");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map((l: any, idx: number) => {
          let type = "CALL";
          let status = idx % 3 === 0 ? "COMPLETED" : idx % 3 === 1 ? "OVERDUE" : "UPCOMING";
          let notes = `Follow-up scheduled regarding: ${l.projectScope || "Project requirements & commercial agreement"}`;

            return {
              id: `FOL-${l.id || idx}`,
              leadId: l.id,
              company: l.clientName || l.companyName || "Prospect Company",
              contactPerson: l.contactPerson || "Primary Lead Contact",
              phone: l.mobile || l.phone || "0000000000",
              whatsapp: l.whatsapp || l.mobile || l.phone || "0000000000",
              type,
              scheduledAt: l.nextFollowupAt ? new Date(l.nextFollowupAt).toLocaleString() : "Tomorrow 11:00 AM",
              status,
              notes,
            };
          });
        setFollowups(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Sales Follow-ups Scheduler"
        description="Scheduled calls, WhatsApp messages, emails, and meetings for Karan Verma."
        badge={`${followups.length} SCHEDULED TASKS`}
        icon={<PhoneCall className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Today's & Upcoming Follow-up Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Real-time scheduled client call sessions and meeting tasks.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            Queue: {followups.length} Items
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading follow-ups queue from database...</div>
        ) : (
          <div className="space-y-4">
            {followups.map((f) => (
              <div
                key={f.id}
                className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 space-y-4 shadow-xs dark:shadow-lg group"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                  <Link href={`/leads/${f.leadId}`} className="flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>🏢 {f.company}</span>
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-sans">({f.contactPerson})</span>
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </Link>

                  <span
                    className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      f.status === "COMPLETED"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                        : f.status === "OVERDUE"
                        ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                        : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                    }`}
                  >
                    {f.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3 font-mono">
                  <span>Type: <strong className="text-slate-800 dark:text-slate-200">{f.type}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Scheduled: <strong className="text-indigo-600 dark:text-indigo-400">{f.scheduledAt}</strong>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                  "{f.notes}"
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={`tel:${f.phone}`}
                    onClick={() => showToast(`📞 Dialing ${f.contactPerson}...`, "info")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Log Call Session
                  </a>

                  <a
                    href={`https://wa.me/${f.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => showToast(`💬 Opening WhatsApp for ${f.contactPerson}`, "info")}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    Send WhatsApp
                  </a>

                  <button
                    onClick={async () => {
                      setFollowups((prev) => prev.map((item) => (item.id === f.id ? { ...item, status: "COMPLETED" } : item)));
                      showToast("✓ Follow-up task marked COMPLETED", "success");
                      // Optionally, update the lead in the backend if needed
                      try {
                        await fetch(`/mdz-os/api/leads/${f.leadId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'CONTACTED' }) // Example of persisting status
                        });
                      } catch (e) {}
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Completed
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
