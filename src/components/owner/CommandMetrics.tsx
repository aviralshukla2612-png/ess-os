"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, IndianRupee, AlertCircle, FolderKanban, Users, Sparkles } from "lucide-react";

export function CommandMetrics() {
  const [financeData, setFinanceData] = useState<{ totalBilling: number; totalPending: number } | null>(null);
  const [leadCount, setLeadCount] = useState<number>(64);
  const [projectCount, setProjectCount] = useState<number>(26);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [finRes, leadRes, prjRes] = await Promise.all([
        fetch("/api/finance").then((r) => r.json()).catch(() => null),
        fetch("/api/leads").then((r) => r.json()).catch(() => null),
        fetch("/api/projects").then((r) => r.json()).catch(() => null),
      ]);

      if (finRes?.success && finRes.data) {
        setFinanceData({
          totalBilling: finRes.data.companyMetrics?.totalContractedRevenue || 23720000,
          totalPending: finRes.data.companyMetrics?.totalPendingCollection || 320000,
        });
      }
      if (leadRes?.success && Array.isArray(leadRes.data)) {
        setLeadCount(leadRes.data.length);
      }
      if (prjRes?.success && Array.isArray(prjRes.data)) {
        setProjectCount(prjRes.data.length);
      }
    } catch (e) {
      console.error("Failed to load metrics", e);
    }
  };

  const formattedTotalBilling = financeData
    ? `₹${(financeData.totalBilling / 100000).toFixed(1)} Lakh`
    : "₹2.37 Crore";

  const metrics = [
    {
      title: "Active Pipeline Value",
      value: formattedTotalBilling,
      subtext: `${leadCount} Ingested CRM Leads`,
      icon: <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      glow: "hover:border-emerald-500/50",
      accent: "from-emerald-500/10 to-transparent",
    },
    {
      title: "Upcoming Collections",
      value: "₹3,20,000",
      subtext: "4 Milestones due in Aug",
      icon: <IndianRupee className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      glow: "hover:border-indigo-500/50",
      accent: "from-indigo-500/10 to-transparent",
    },
    {
      title: "Overdue Payments",
      value: "₹85,000",
      subtext: "1 Invoice overdue (INV-002)",
      icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      glow: "hover:border-rose-500/50",
      accent: "from-rose-500/10 to-transparent",
    },
    {
      title: "Active Projects",
      value: `${projectCount} Active`,
      subtext: "18 On Track • 5 Risk • 3 Testing",
      icon: <FolderKanban className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      glow: "hover:border-cyan-500/50",
      accent: "from-cyan-500/10 to-transparent",
    },
    {
      title: "Workforce Attendance",
      value: "14 / 16 Present",
      subtext: "2 Staff on Leave • 90-Day Logs",
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
