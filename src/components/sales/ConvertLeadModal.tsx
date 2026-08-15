"use client";

import React, { useState } from "react";
import { Lead } from "./LeadPipelineBoard";
import { ArrowRight, Building, CheckCircle2, UserCheck, Shield } from "lucide-react";

interface Props {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConvertLeadModal({ lead, onClose, onSuccess }: Props) {
  const [contractValue, setContractValue] = useState(lead.leadValue.toString());
  const [selectedTM, setSelectedTM] = useState("emp-meet");
  const [playbook, setPlaybook] = useState("ECOM_WEB");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Convert Lead to Client & Project</h3>
            <p className="text-xs text-slate-500">Lead: {lead.leadNumber} • {lead.clientName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-700 font-semibold block mb-1">Company / Client Name:</label>
            <input
              type="text"
              defaultValue={lead.clientName}
              readOnly
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Final Agreed Contract Value (₹):</label>
            <input
              type="number"
              value={contractValue}
              onChange={(e) => setContractValue(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold text-sm outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Select Project Playbook Template:</label>
            <select
              value={playbook}
              onChange={(e) => setPlaybook(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium outline-none focus:border-amber-500"
            >
              <option value="ECOM_WEB">E-Commerce Website Playbook (6 Stages)</option>
              <option value="SAAS_APP">Custom SaaS Web Application (7 Stages)</option>
              <option value="MOBILE_APP">Mobile Application Playbook (5 Stages)</option>
              <option value="AI_AUTO">AI Workflow Automation (4 Stages)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Assign Team Manager (TM) Authority:</label>
            <select
              value={selectedTM}
              onChange={(e) => setSelectedTM(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium outline-none focus:border-amber-500"
            >
              <option value="emp-meet">Meet Shah (Senior Tech Lead)</option>
              <option value="emp-dev">Dev Patel (Full-Stack Developer)</option>
              <option value="emp-jay">Jay Shah (QA Lead)</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong>System Action:</strong> Creating Client record for <strong>{lead.clientName}</strong>, generating Project workspace, attaching Playbook stages, and granting <strong>TM Authority</strong> to selected manager.
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-sm flex items-center gap-1.5"
            >
              {loading ? "Converting..." : "Complete Conversion"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
