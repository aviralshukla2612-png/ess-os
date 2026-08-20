"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Settings, Save, Sparkles, Sliders } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState("MDZ Company");
  const [saved, setSaved] = useState(false);

  const playbooks = [
    { name: "E-Commerce Website Playbook", stages: 6, code: "ECOM_WEB" },
    { name: "Custom SaaS Web Application Playbook", stages: 7, code: "SAAS_APP" },
    { name: "Mobile Application Playbook", stages: 5, code: "MOBILE_APP" },
    { name: "AI Workflow Automation Playbook", stages: 4, code: "AI_AUTO" },
  ];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Company Settings & Playbooks"
        description="Configure enterprise company details, role permissions, and project execution templates."
        badge="SYSTEM CONFIG"
        icon={<Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Identity */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Company Identity
            </h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              TENANT CONTROL
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSaved(true);
              showToast("✓ Company settings saved successfully", "success");
              setTimeout(() => setSaved(false), 2000);
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Company Name:</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Default Currency:</label>
              <input
                type="text"
                value="INR (₹)"
                disabled
                className="w-full bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-500 dark:text-slate-400 font-mono"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>{saved ? "Settings Saved!" : "Save Company Settings"}</span>
            </button>
          </form>
        </div>

        {/* Playbooks Template */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Standardized Project Playbooks
            </h2>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              4 TEMPLATES
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {playbooks.map((pb) => (
              <div
                key={pb.code}
                className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shadow-xs dark:shadow-lg hover:border-indigo-500/40 transition-all"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{pb.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    Code: {pb.code} • {pb.stages} Execution Stages
                  </div>
                </div>
                <button
                  onClick={() => showToast(`✏️ Editing playbook template ${pb.code}`, "info")}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all"
                >
                  Edit Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
