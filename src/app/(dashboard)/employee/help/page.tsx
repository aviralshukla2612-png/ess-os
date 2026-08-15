"use client";

import React from "react";
import { HelpCircle, Clock, CheckCircle2 } from "lucide-react";

export default function EmployeeHelpRequestsPage() {
  const requests = [
    {
      id: "HELP-2026-001",
      project: "ABC E-Commerce Storefront & Mobile API",
      category: "TECHNICAL_BLOCKER",
      message: "Waiting for production Razorpay API keys from client to verify live signature.",
      urgency: "HIGH",
      submittedAt: "Today 11:45 AM",
      status: "IN_QUEUE",
      ownerResponse: "Waiting for Owner Review",
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="w-7 h-7 text-amber-400" />
          <span>MY HELP REQUESTS ("SIR HELP")</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Track submitted guidance & blocker requests sent to management.
        </p>
      </div>

      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="space-y-3 text-xs">
          {requests.map((r) => (
            <div key={r.id} className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 font-mono">{r.id}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {r.urgency}
                </span>
              </div>
              <div className="font-bold text-white text-sm">📌 {r.project}</div>
              <p className="text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                "{r.message}"
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-500">
                <span>Submitted: {r.submittedAt}</span>
                <span className="text-amber-400 font-bold">{r.ownerResponse}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
