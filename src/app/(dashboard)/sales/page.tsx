"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadPipelineBoard } from "@/components/sales/LeadPipelineBoard";
import { TrendingUp, PhoneCall, Plus, Target, Sparkles, Flame, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Lead } from "@/components/sales/LeadPipelineBoard";

export default function SalesDashboardPage() {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [estValue, setEstValue] = useState("");

  React.useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/mdz-os/api/leads");
      const json = await res.json();
      if (json.success) {
        setLeads(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateLeadStageApi = async (leadId: string, newStage: string) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
    try {
      const res = await fetch(`/mdz-os/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast("Failed to update lead stage", "error");
        fetchLeads();
      } else {
        showToast(`Moved lead to ${newStage}`, "success");
      }
    } catch (e) {
      showToast("Network error", "error");
      fetchLeads();
    }
  };

  const convertLeadToClientApi = async (leadId: string) => {
    try {
      const res = await fetch(`/mdz-os/api/leads/${leadId}/convert`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(`🎉 Converted to Client "${json.data.client.companyName}"`, "success");
        fetchLeads();
      } else {
        showToast(json.error || "Failed to convert lead", "error");
      }
    } catch (e) {
      showToast("Network error converting lead", "error");
    }
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const createApi = async () => {
      try {
        const res = await fetch("/mdz-os/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: companyName,
            contactPerson: "Unknown",
            phone: "0000000000",
            email: "unknown@example.com",
            projectScope: "Standard Deployment",
            leadValue: Number(estValue) || 250000,
            expectedRevenue: Number(estValue) || 250000,
            stage: "NEW",
            leadPriority: "HIGH",
          }),
        });
        const json = await res.json();
        if (json.success) {
          showToast(`✓ Lead "${companyName || "New Lead"}" added to Pipeline`, "success");
          fetchLeads();
        } else {
          showToast("Failed to add lead", "error");
        }
      } catch (e) {
        showToast("Network error", "error");
      }
    };
    createApi();

    setIsAddLeadOpen(false);
    setCompanyName("");
    setEstValue("");
  };

  // Dynamic calculations
  const activeLeads = leads.filter((l) => l.stage !== "WON" && l.stage !== "LOST");
  const pipelineValue = activeLeads.reduce((sum, l) => sum + l.leadValue, 0);

  const hotLeads = activeLeads.filter((l) => l.leadPriority === "HOT" || l.leadPriority === "HIGH");
  const hotLeadsCount = hotLeads.length;
  const hotLeadsNames = hotLeads.map((l) => l.clientName.split(" ")[0]).slice(0, 2).join(" & ");

  const wonLeads = leads.filter((l) => l.stage === "WON");
  const wonValue = wonLeads.reduce((sum, l) => sum + l.leadValue, 0);
  const totalBoardValue = leads.reduce((sum, l) => sum + l.leadValue, 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <PageHeader
        title="Sales Dashboard"
        description="Pipeline overview, follow-up schedules, and monthly conversions for Karan Verma."
        badge="HEAD OF SALES"
        icon={<Target className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/sales/followups"
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Follow-ups Today ({activeLeads.length})</span>
            </Link>
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
          </div>
        }
      />

      {/* New Lead Bottom Sheet */}
      <BottomSheet
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        title="Add New Prospect Lead"
        subtitle="Saved to your assigned active sales pipeline."
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Company / Client Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Tech Corp"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Estimated Contract Value (₹)</label>
            <input
              type="number"
              required
              value={estValue}
              onChange={(e) => setEstValue(e.target.value)}
              placeholder="350000"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Save Prospect Lead
          </button>
        </form>
      </BottomSheet>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2 group hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Pipeline</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">₹{pipelineValue.toLocaleString("en-IN")}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{activeLeads.length} Active CRM Deals</div>
        </div>

        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2 group hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Follow-ups Today</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <PhoneCall className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">{activeLeads.length} Calls</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Scheduled in Call Log</div>
        </div>

        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2 group hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hot Leads</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">{hotLeadsCount} High Value</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">{hotLeadsNames || "Prospects Active"}</div>
        </div>

        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2 group hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Won This Month</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">₹{wonValue.toLocaleString("en-IN")}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{wonLeads.length} Converted Clients</div>
        </div>
      </div>

      {/* Pipeline Kanban Board */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              SALES PIPELINE BOARD
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Drag & drop leads across stages or click to inspect details.</p>
          </div>
          <span className="text-xs font-mono font-bold px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            Total Board Value: ₹{totalBoardValue.toLocaleString("en-IN")}
          </span>
        </div>

        <LeadPipelineBoard leads={leads} updateLeadStageApi={updateLeadStageApi} convertLeadToClientApi={convertLeadToClientApi} />
      </div>
    </div>
  );
}
