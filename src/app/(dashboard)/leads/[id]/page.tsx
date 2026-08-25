"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Plus,
  CheckCircle2,
  Building,
  User,
  IndianRupee,
  Clock,
  ArrowRight,
  FileText,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { showToast } = useToast();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchLead();
  }, []);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/ess-crm/api/leads/${params.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        const l = json.data;
        setLead({
          ...l,
          leadNumber: l.leadNumber,
          leadPriority: l.priority,
          stage: l.status,
          clientName: l.companyName || l.contactPerson,
          contactPerson: l.contactPerson,
          email: l.email || "No Email",
          phone: l.mobile,
          leadValue: l.expectedValue || 0,
          projectScope: l.description || "General Inquiry",
          timeline: l.activities?.map((a: any) => ({
            id: a.id,
            type: a.action,
            text: a.detailsJson || a.action,
            timestamp: new Date(a.createdAt).toLocaleString(),
          })) || [],
          scheduledFollowups: l.followups?.map((f: any) => ({
            id: f.id,
            date: new Date(f.scheduledAt).toLocaleString(),
            note: f.notes || "Followup",
            completed: f.status === "COMPLETED",
          })) || [],
          callLogs: [],
          notes: l.activities?.filter((a: any) => a.action === "NOTE_ADDED").map((a: any) => ({
            id: a.id,
            text: a.detailsJson,
            author: "System",
            timestamp: new Date(a.createdAt).toLocaleString(),
          })) || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "calls" | "notes">("overview");
  const [isNoteSheetOpen, setIsNoteSheetOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isFollowupSheetOpen, setIsFollowupSheetOpen] = useState(false);
  const [followupDate, setFollowupDate] = useState("Tomorrow 11:00 AM");
  const [followupNote, setFollowupNote] = useState("");

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    // Mock local update since no POST /notes endpoint exists in Phase 2
    setLead((prev: any) => ({
      ...prev,
      notes: [...prev.notes, { id: Date.now().toString(), text: newNoteText, author: "You", timestamp: "Just now" }],
      timeline: [{ id: Date.now().toString(), type: "NOTE_ADDED", text: `Note added: "${newNoteText}"`, timestamp: "Just now" }, ...prev.timeline],
    }));
    showToast("✓ Note added to Lead activity log (local)", "success");
    setNewNoteText("");
    setIsNoteSheetOpen(false);
  };

  const handleAddFollowupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupNote.trim()) return;
    // Mock local update
    setLead((prev: any) => ({
      ...prev,
      scheduledFollowups: [...prev.scheduledFollowups, { id: Date.now().toString(), date: followupDate, note: followupNote, completed: false }],
      timeline: [{ id: Date.now().toString(), type: "FOLLOWUP_SCHEDULED", text: `Scheduled for ${followupDate}: ${followupNote}`, timestamp: "Just now" }, ...prev.timeline],
    }));
    showToast(`✓ Follow-up scheduled for ${followupDate} (local)`, "success");
    setFollowupNote("");
    setIsFollowupSheetOpen(false);
  };

  const handleConvertLead = async () => {
    try {
      const res = await fetch(`/ess-crm/api/leads/${lead.id}/convert`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        showToast(`🎉 Converted to Client "${json.data.client.companyName}"`, "success");
        fetchLead();
      } else {
        showToast(json.error || "Failed to convert lead", "error");
      }
    } catch (e) {
      showToast("Network error converting lead", "error");
    }
  };

  const updateLeadStage = async (leadId: string, newStage: string) => {
    setLead((prev: any) => ({ ...prev, stage: newStage }));
    try {
      const res = await fetch(`/ess-crm/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast("Failed to update lead stage", "error");
        fetchLead();
      }
    } catch (e) {
      showToast("Network error", "error");
      fetchLead();
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400 animate-pulse">Loading Lead...</div>;
  if (!lead) return <div className="p-12 text-center text-rose-400">Lead Not Found</div>;

  return (
    <div className="space-y-6 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales CRM & Leads</span>
        </Link>
        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          {lead.leadNumber}
        </span>
      </div>

      {/* Lead Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-mono">
                {lead.leadPriority} PRIORITY
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono uppercase">
                {lead.stage} STAGE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {lead.clientName}
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
              <span>👤 <strong>{lead.contactPerson}</strong></span>
              <span>•</span>
              <span>✉️ {lead.email}</span>
              <span>•</span>
              <span>📞 {lead.phone}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lead.stage !== "WON" ? (
              <button
                onClick={handleConvertLead}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 touch-target"
              >
                <Sparkles className="w-4 h-4" />
                <span>Convert to Client & Project</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Converted to Client</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={`tel:${lead.phone}`}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Call</span>
          </a>
          <a
            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>WhatsApp</span>
          </a>
          <a
            href={`mailto:${lead.email}`}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <Mail className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Email</span>
          </a>

          <button
            onClick={() => setIsFollowupSheetOpen(true)}
            className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Schedule Follow-up</span>
          </button>

          <button
            onClick={() => setIsNoteSheetOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 touch-target"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>+ Add Note</span>
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        {[
          { id: "overview", label: "Overview & Scope" },
          { id: "timeline", label: `Activity Timeline (${lead.activityHistory.length})` },
          { id: "calls", label: `Call History (${lead.callHistory.length})` },
          { id: "notes", label: `Internal Notes (${lead.notes.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Project Scope & Proposal Summary</h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              {lead.projectScope}
            </p>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Stage Transition</h4>
              <div className="flex flex-wrap gap-2">
                {["NEW", "CONTACTED", "REQUIREMENTS", "PROPOSAL", "NEGOTIATION", "WON", "LOST"].map((stg) => (
                  <button
                    key={stg}
                    onClick={() => {
                      updateLeadStage(lead.id, stg as any);
                      showToast(`✓ Lead moved to ${stg} stage`, "success");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                      lead.stage === stg
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {stg}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Financial Metrics</h3>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Estimated Deal Value:</span>
                <strong className="font-mono text-slate-900 dark:text-slate-100">₹{lead.leadValue.toLocaleString("en-IN")}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
                <span>Weighted Expected Value:</span>
                <strong className="font-mono">₹{lead.expectedRevenue.toLocaleString("en-IN")}</strong>
              </div>
              <div className="flex justify-between py-1 text-slate-700 dark:text-slate-300">
                <span>Assigned Salesperson:</span>
                <strong>{lead.assignedSales}</strong>
              </div>
              <div className="flex justify-between py-1 text-amber-700 dark:text-amber-400 font-bold">
                <span>Next Follow-up:</span>
                <span>{lead.nextFollowupDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Audit & Change History Timeline</h3>
          <div className="space-y-3 text-xs">
            {lead.timeline?.map((act: any) => (
              <div key={act.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{act.text}</div>
                  <div className="text-[10px] font-mono text-slate-400">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Call History */}
      {activeTab === "calls" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Call & Meeting History Log</h3>
            <button
              onClick={() => setIsFollowupSheetOpen(true)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Log New Call
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {lead.calls?.map((call: any) => (
              <div key={call.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>Caller: {call.callerName}</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">{call.outcome}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{call.notes}</p>
                <div className="text-[10px] font-mono text-slate-400">{call.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Internal Notes */}
      {activeTab === "notes" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Internal Deal Notes</h3>
            <button
              onClick={() => setIsNoteSheetOpen(true)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Add Note
            </button>
          </div>
          <div className="space-y-3 text-xs">
            {lead.notes?.map((n: any) => (
              <div key={n.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="font-bold text-slate-900 dark:text-slate-100">{n.authorName}</div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{n.content}</p>
                <div className="text-[10px] font-mono text-slate-400">{n.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Note Bottom Sheet */}
      <BottomSheet
        isOpen={isNoteSheetOpen}
        onClose={() => setIsNoteSheetOpen(false)}
        title="Add Deal Note"
        subtitle="Saved to lead activity log."
      >
        <form onSubmit={handleAddNoteSubmit} className="space-y-4 text-xs">
          <textarea
            required
            rows={4}
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="Type your notes regarding deal terms or client feedback..."
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target"
          >
            Save Deal Note
          </button>
        </form>
      </BottomSheet>

      {/* Schedule Followup Bottom Sheet */}
      <BottomSheet
        isOpen={isFollowupSheetOpen}
        onClose={() => setIsFollowupSheetOpen(false)}
        title="Schedule Follow-up Call / Meeting"
        subtitle="Updates next follow-up date and adds call reminder."
      >
        <form onSubmit={handleAddFollowupSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Follow-up Date & Time</label>
            <input
              type="text"
              required
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              placeholder="e.g. Tomorrow 11:00 AM"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">Call Purpose / Agenda</label>
            <textarea
              required
              rows={3}
              value={followupNote}
              onChange={(e) => setFollowupNote(e.target.value)}
              placeholder="e.g. Discuss revised scope milestone payments..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs touch-target mt-2"
          >
            Schedule & Save
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
