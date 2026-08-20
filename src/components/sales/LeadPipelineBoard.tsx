"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, PhoneCall, Calendar, ArrowRight, ArrowUpRight, CheckCircle2, User, Building, IndianRupee } from "lucide-react";
import { ConvertLeadModal } from "./ConvertLeadModal";
import { useToast } from "@/components/ui/Toast";
import { usePrototypeStore } from "@/lib/prototypeStore";

export interface Lead {
  id: string;
  leadNumber: string;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  stage: string;
  leadValue: number;
  expectedRevenue: number;
  projectScope: string;
  assignedSales: string;
  nextFollowupDate: string;
  leadPriority: string;
  updatedAt: string;
}

export function LeadPipelineBoard() {
  const { leads, convertLeadToClient, updateLeadStage } = usePrototypeStore();
  const { showToast } = useToast();
  const router = useRouter();
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<any>(null);

  const STAGES = [
    { id: "NEW", title: "New Prospects" },
    { id: "CONTACTED", title: "Contacted" },
    { id: "REQUIREMENTS", title: "Requirements" },
    { id: "PROPOSAL", title: "Proposal Sent" },
    { id: "NEGOTIATION", title: "Negotiation" },
    { id: "WON", title: "Won / Closing" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.id);
          const totalVal = stageLeads.reduce((acc, curr) => acc + curr.leadValue, 0);

          return (
            <div
              key={stage.id}
              className="w-72 shrink-0 bg-slate-100/60 dark:bg-slate-950/40 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/60 space-y-3 flex flex-col"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-indigo-500/50", "bg-indigo-50/50", "dark:bg-indigo-950/20");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-indigo-500/50", "bg-indigo-50/50", "dark:bg-indigo-950/20");
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove("border-indigo-500/50", "bg-indigo-50/50", "dark:bg-indigo-950/20");
                const leadId = e.dataTransfer.getData("leadId");
                if (leadId) {
                  updateLeadStage(leadId, stage.id as any);
                  showToast(`Moved to ${stage.title}`, "success");
                }
              }}
            >
              <div className="flex items-center justify-between px-1">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono uppercase">
                  {stage.title}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {stageLeads.length}
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 px-1 font-semibold">
                Total: ₹{totalVal.toLocaleString("en-IN")}
              </div>

              <div className="space-y-2.5">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("leadId", lead.id);
                    }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (!target.closest("button")) {
                        router.push(`/leads/${lead.id}`);
                      }
                    }}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/90 hover:scale-[1.01] hover:shadow-sm transition-all duration-200 space-y-2 group cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{lead.leadNumber}</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                          lead.leadPriority === "HOT"
                            ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : lead.leadPriority === "HIGH"
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                          {lead.leadPriority}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {lead.clientName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{lead.contactPerson}</p>
                    </div>

                    <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{lead.leadValue.toLocaleString("en-IN")}
                    </div>

                    {lead.stage === "WON" && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const { client } = convertLeadToClient(lead.id);
                          showToast(`🎉 Converted to Client "${client.companyName}"`, "success");
                        }}
                        className="w-full mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors touch-target"
                      >
                        <span>Convert to Client</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
