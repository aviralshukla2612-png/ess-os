"use client";

import React from "react";
import { Users, Clock } from "lucide-react";

export function RealtimeTeamView() {
  const teamMembers = [
    {
      name: "Meet Shah",
      designation: "Senior Tech Lead (TM)",
      status: "WORKING",
      duration: "2h 15m",
      project: "ABC E-Commerce Storefront",
      task: "Task: WhatsApp Webhook Notification API",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      statusColor: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    {
      name: "Dev Patel",
      designation: "Full-Stack Developer",
      status: "WORKING",
      duration: "1h 45m",
      project: "ABC E-Commerce Storefront",
      task: "Task: Razorpay Signature Verification Test",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      statusColor: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      helpWaiting: true,
    },
    {
      name: "Priya Desai",
      designation: "Lead UI/UX Designer",
      status: "CLIENT_CALL",
      duration: "24m",
      project: "Apex SaaS Solutions",
      task: "Task: Reviewing Wireframes with Client",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      statusColor: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
    {
      name: "Jay Shah",
      designation: "QA Lead",
      status: "LUNCH",
      duration: "30m",
      project: "Zenith Mobile App",
      task: "Task: On Break",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
      statusColor: "bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">REAL-TIME TEAM STATUS</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live operational view of workforce work sessions & punch states.</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          4 / 4 Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teamMembers.map((m, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={m.avatar}
                  alt={m.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
                {m.helpWaiting && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{m.name}</h4>
                  {m.helpWaiting && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      Need Help
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{m.designation}</div>
                <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">📌 {m.project}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{m.task}</div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${m.statusColor}`}>
                {m.status}
              </span>
              <div className="text-[11px] font-mono text-slate-400 mt-1">Duration: {m.duration}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
