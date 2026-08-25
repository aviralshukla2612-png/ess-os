"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, IndianRupee, AlertCircle, FolderKanban, Users, Sparkles } from "lucide-react";

export function CommandMetrics() {
  const [financeData, setFinanceData] = useState<{ totalBilling: number; totalPending: number; upcoming: number; overdue: number; overdueCount: number } | null>(null);
  const [leadCount, setLeadCount] = useState<number>(0);
  const [projectCount, setProjectCount] = useState<number>(0);
  const [attendanceStats, setAttendanceStats] = useState<{ present: number; total: number }>({ present: 0, total: 0 });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [finRes, leadRes, prjRes, attRes] = await Promise.all([
        fetch("/crmtesting/api/finance").then((r) => r.json()).catch(() => null),
        fetch("/crmtesting/api/leads").then((r) => r.json()).catch(() => null),
        fetch("/crmtesting/api/projects").then((r) => r.json()).catch(() => null),
        fetch("/crmtesting/api/attendance/team-status").then((r) => r.json()).catch(() => null),
      ]);

      if (finRes?.success && finRes.data) {
        const invoices = finRes.data.invoices || [];
        const now = new Date().getTime();
        const overdueInvoices = invoices.filter((i: any) => i.status === "UNPAID" && new Date(i.dueDate).getTime() < now);
        const overdueAmount = overdueInvoices.reduce((sum: number, i: any) => sum + i.amount, 0);

        setFinanceData({
          totalBilling: finRes.data.metrics?.totalBilling || 0,
          totalPending: finRes.data.metrics?.pendingBilling || 0,
          upcoming: (finRes.data.metrics?.pendingBilling || 0) - overdueAmount,
          overdue: overdueAmount,
          overdueCount: overdueInvoices.length,
        });
      }
      if (leadRes?.success && Array.isArray(leadRes.data)) {
        setLeadCount(leadRes.data.length);
      }
      if (prjRes?.success && Array.isArray(prjRes.data)) {
        setProjectCount(prjRes.data.length);
      }
      if (attRes?.success && Array.isArray(attRes.data)) {
        const total = attRes.data.length;
        const present = attRes.data.filter((e: any) => e.status !== "OFFLINE").length;
        setAttendanceStats({ present, total });
      }
    } catch (e) {
      console.error("Failed to load metrics", e);
    }
  };

  const formattedTotalBilling = financeData
    ? `₹${(financeData.totalBilling / 100000).toFixed(1)} Lakh`
    : "₹0.0 Lakh";

  const metrics = [
    {
      title: "Active Pipeline Value",
      value: formattedTotalBilling,
      subtext: `${leadCount} CRM Leads`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      glow: "hover:border-emerald-500/50",
      accent: "from-emerald-500/10 to-transparent",
    },
    {
      title: "Upcoming Collections",
      value: `₹${((financeData?.upcoming || 0) / 1000).toFixed(1)}K`,
      subtext: "Pending Milestones",
      icon: <IndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      glow: "hover:border-indigo-500/50",
      accent: "from-indigo-500/10 to-transparent",
    },
    {
      title: "Overdue Payments",
      value: `₹${((financeData?.overdue || 0) / 1000).toFixed(1)}K`,
      subtext: `${financeData?.overdueCount || 0} Invoices overdue`,
      icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      glow: "hover:border-rose-500/50",
      accent: "from-rose-500/10 to-transparent",
    },
    {
      title: "Active Projects",
      value: `${projectCount} Active`,
      subtext: "Tracked in DB",
      icon: <FolderKanban className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      glow: "hover:border-cyan-500/50",
      accent: "from-cyan-500/10 to-transparent",
    },
    {
      title: "Workforce Attendance",
      value: `${attendanceStats.present} / ${attendanceStats.total} Present`,
      subtext: "Live Clock-in",
      icon: <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
      glow: "hover:border-violet-500/50",
      accent: "from-violet-500/10 to-transparent",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className={`group relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 ${m.glow} shadow-lg dark:shadow-2xl hover:-translate-y-1 transition-all duration-300 space-y-3`}
        >
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${m.accent} rounded-bl-full pointer-events-none`} />

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              {m.title}
            </span>
            <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">{m.icon}</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {m.value}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              {m.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
