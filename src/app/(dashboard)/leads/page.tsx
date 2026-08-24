"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadPipelineBoard } from "@/components/sales/LeadPipelineBoard";
import { Lead } from "@/components/sales/LeadPipelineBoard";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DataImportModal } from "@/components/ui/DataImportModal";
import { Target, Plus, Sparkles, FileSpreadsheet } from "lucide-react";

export default function LeadsPage() {
  const { showToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [gstNo, setGstNo] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);

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
            clientName,
            contactPerson,
            phone: phone || "+91 00000 00000",
            email: email || "contact@prospect.com",
            projectScope: projectScope || "General inquiry",
            leadValue: Number(leadValue) || 250000,
            expectedRevenue: Number(leadValue) || 250000,
            stage: "NEW",
            leadPriority: "HIGH",
          }),
        });
        const json = await res.json();
        if (json.success) {
          showToast(`✓ Lead "${clientName || 'New Prospect'}" created in CRM`, "success");
          fetchLeads();
        } else {
          showToast("Failed to add lead", "error");
        }
      } catch (e) {
        showToast("Network error", "error");
      }
    };
    createApi();

    setIsAddOpen(false);
    setClientName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setLeadValue("");
    setGstNo("");
    setProjectScope("");
  };

  const handleImportData = async (data: any[]) => {
    let successCount = 0;
    
    for (const row of data) {
      try {
        const client = row["Company"] || row["clientName"] || row["Client"] || row["Company Name"];
        const contact = row["Contact Person"] || row["contactPerson"] || row["Contact"] || row["Name"];
        const rowEmail = row["Email"] || row["email"];
        const rowPhone = row["Phone"] || row["phone"] || row["Mobile"];
        const value = row["Value"] || row["Deal Value"] || row["leadValue"];
        const scope = row["Scope"] || row["projectScope"] || row["Project Details"];
        
        if (!client) continue;

        const res = await fetch("/mdz-os/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: client,
            contactPerson: contact || "Unknown",
            phone: rowPhone || "+91 00000 00000",
            email: rowEmail || "contact@prospect.com",
            projectScope: scope || "Imported inquiry",
            leadValue: Number(value) || 250000,
            expectedRevenue: Number(value) || 250000,
            stage: "NEW",
            leadPriority: "HIGH",
          }),
        });
        
        if (res.ok) successCount++;
      } catch (e) {
        console.error("Import error on row:", row);
      }
    }
    
    showToast(`✓ Imported ${successCount} leads successfully`, "success");
    fetchLeads();
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Sales CRM & Leads"
        description="Track prospects, manage pipeline stages, schedule follow-ups, and convert leads."
        badge="SALES PIPELINE"
        icon={<Target className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Import CSV/XLS</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
          </div>
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

        <LeadPipelineBoard leads={leads} updateLeadStageApi={updateLeadStageApi} convertLeadToClientApi={convertLeadToClientApi} />
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">GST Number (Optional)</label>
              <input
                type="text"
                value={gstNo}
                onChange={(e) => setGstNo(e.target.value)}
                placeholder="27AADCB2230M1Z2"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Project Details / Scope</label>
            <textarea
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              placeholder="e.g. E-Commerce website development..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none transition-all resize-none h-20"
            />
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

      <DataImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportData}
        title="Import Sales Leads"
      />
    </div>
  );
}
