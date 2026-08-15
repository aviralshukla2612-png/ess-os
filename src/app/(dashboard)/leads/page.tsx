"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadPipelineBoard } from "@/components/sales/LeadPipelineBoard";
import { usePrototypeStore } from "@/lib/prototypeStore";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Target, Plus, Sparkles } from "lucide-react";

export default function LeadsPage() {
  const { addLead } = usePrototypeStore();
  const { showToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [leadValue, setLeadValue] = useState("");

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    addLead({
      clientName,
      contactPerson,
      email: email || "contact@prospect.com",
      leadValue: Number(leadValue) || 250000,
    });
    showToast(`✓ Lead "${clientName || 'New Prospect'}" created in CRM`, "success");
    setIsAddOpen(false);
    setClientName("");
    setContactPerson("");
    setEmail("");
    setLeadValue("");
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Sales CRM & Leads"
        description="Track prospects, manage pipeline stages, schedule follow-ups, and convert leads."
        badge="SALES PIPELINE"
        icon={<Target className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        }
      />

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Live CRM Lead Kanban
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Drag & drop leads across stages to convert prospects into active projects.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            Real-Time Pipeline
          </span>
        </div>

        <LeadPipelineBoard />
      </div>

      {/* Add New Lead Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Prospect Lead"
        subtitle="Saved to your active sales CRM pipeline."
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Company / Prospect Name</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Tech Corp"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Contact Person</label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Rajesh Shah"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@acme.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Estimated Deal Value (₹)</label>
            <input
              type="number"
              required
              value={leadValue}
              onChange={(e) => setLeadValue(e.target.value)}
              placeholder="350000"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Create Prospect Lead
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
