"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, PhoneCall, Calendar, ArrowRight, ArrowUpRight, CheckCircle2, User, Building, IndianRupee, Trash, Pencil } from "lucide-react";
import { ConvertLeadModal } from "./ConvertLeadModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EditLeadModal } from "./EditLeadModal";
import { useToast } from "@/components/ui/Toast";

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
  gstNo?: string;
  remarks?: string;
  updatedAt?: string;
}

export function LeadPipelineBoard({
  leads,
  updateLeadStageApi,
  convertLeadToClientApi,
  deleteLeadApi,
  onLeadUpdated,
}: {
  leads: Lead[];
  updateLeadStageApi: any;
  convertLeadToClientApi: any;
  deleteLeadApi?: any;
  onLeadUpdated?: (lead: Lead) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const STAGES = [
    { id: "NEW", title: "New Prospects" },
    { id: "CONTACTED", title: "Contacted" },
    { id: "REQUIREMENTS", title: "Requirements" },
    { id: "PROPOSAL", title: "Proposal Sent" },
    { id: "NEGOTIATION", title: "Negotiation" },
    { id: "WON", title: "Won / Closing" },
    { id: "LOST", title: "Deal Lost" },
  ];
  
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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
                  updateLeadStageApi(leadId, stage.id);
                }
              }}
            >
              <div className="flex items-center justify-between px-1">
                <span className={`font-bold text-xs font-mono uppercase ${
                  stage.id === "WON" 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : stage.id === "LOST" 
                    ? "text-rose-600 dark:text-rose-400" 
                    : "text-slate-800 dark:text-slate-200"
                }`}>
                  {stage.title}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  stage.id === "WON"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : stage.id === "LOST"
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}>
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
                      if (!target.closest("button") && !target.closest("a")) {
                        router.push(`/leads/${lead.id}`);
                      }
                    }}
                    className={`p-3.5 rounded-xl border shadow-xs hover:scale-[1.01] hover:shadow-sm transition-all duration-200 space-y-2 group cursor-grab active:cursor-grabbing ${
                      lead.stage === "LOST"
                        ? "bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/70 dark:border-slate-800/60 opacity-85 hover:opacity-100"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/90"
                    }`}
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingLead(lead);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-colors"
                          title="Edit lead details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/leads/${lead.id}`);
                          }}
                          className="p-0.5 rounded text-slate-400 hover:text-indigo-500 transition-colors"
                          title="View lead details"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
                        </button>
                        {deleteLeadApi && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteLeadId(lead.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors ml-1"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {lead.clientName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{lead.contactPerson}</p>
                      
                      {lead.phone && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200/60 dark:border-slate-700/60"
                            title={`Call ${lead.phone}`}
                          >
                            <PhoneCall className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{lead.phone}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{lead.leadValue.toLocaleString("en-IN")}
                    </div>

                    {lead.remarks && (
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800 line-clamp-2 leading-relaxed">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Remark: </span>
                        {lead.remarks}
                      </div>
                    )}

                    {lead.stage === "WON" && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          convertLeadToClientApi(lead.id);
                        }}
                        className="w-full mt-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-colors touch-target"
                      >
                        <span>Convert to Client</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {lead.stage === "LOST" && (
                      <div className="w-full mt-2 py-1.5 px-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[10.5px] flex items-center justify-between">
                        <span>Deal Lost</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateLeadStageApi(lead.id, "NEGOTIATION");
                          }}
                          className="hover:underline text-[10px] text-indigo-600 dark:text-indigo-400 cursor-pointer font-semibold"
                          title="Move back to Negotiation stage"
                        >
                          Reopen ↺
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <ConfirmModal
        isOpen={!!deleteLeadId}
        onClose={() => setDeleteLeadId(null)}
        onConfirm={() => {
          if (deleteLeadId && deleteLeadApi) {
            deleteLeadApi(deleteLeadId);
          }
        }}
        title="Delete Lead"
        message="Are you sure you want to permanently delete this lead? This action cannot be undone and will remove all associated follow-ups and data."
        confirmText="Delete Lead"
        isDestructive={true}
      />

      <EditLeadModal
        isOpen={!!editingLead}
        lead={editingLead}
        onClose={() => setEditingLead(null)}
        onSuccess={(updatedLead) => {
          showToast(`✓ Lead "${updatedLead.clientName}" updated`, "success");
          if (onLeadUpdated) {
            onLeadUpdated(updatedLead);
          }
        }}
      />
    </div>
  );
}
