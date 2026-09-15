"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Building, User, Phone, Mail, IndianRupee, Layers, AlertCircle, FileText, Check } from "lucide-react";
import { Lead } from "./LeadPipelineBoard";

interface EditLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: (updatedLead: Lead) => void;
}

const STAGES = [
  { id: "NEW", label: "New Prospects" },
  { id: "CONTACTED", label: "Contacted" },
  { id: "REQUIREMENTS", label: "Requirements" },
  { id: "PROPOSAL", label: "Proposal Sent" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "WON", label: "Won / Closing" },
  { id: "LOST", label: "Lost" },
];

const PRIORITIES = [
  { id: "HOT", label: "HOT", color: "rose" },
  { id: "HIGH", label: "HIGH", color: "amber" },
  { id: "MEDIUM", label: "MEDIUM", color: "blue" },
  { id: "LOW", label: "LOW", color: "slate" },
];

export function EditLeadModal({ isOpen, lead, onClose, onSuccess }: EditLeadModalProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [clientName, setClientName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState("NEW");
  const [leadPriority, setLeadPriority] = useState("HIGH");
  const [leadValue, setLeadValue] = useState("");
  const [expectedRevenue, setExpectedRevenue] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [gstNo, setGstNo] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lead) {
      setClientName(lead.clientName || "");
      setContactPerson(lead.contactPerson || "");
      setEmail(lead.email || "");
      setPhone(lead.phone || "");
      setStage(lead.stage || "NEW");
      setLeadPriority(lead.leadPriority || "HIGH");
      setLeadValue(lead.leadValue !== undefined ? lead.leadValue.toString() : "");
      setExpectedRevenue(
        lead.expectedRevenue !== undefined
          ? lead.expectedRevenue.toString()
          : (lead.leadValue !== undefined ? lead.leadValue.toString() : "")
      );
      setProjectScope(lead.projectScope || "");
      setGstNo(lead.gstNo || "");
      setErrorMsg("");
    }
  }, [lead, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const payload = {
        clientName: clientName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        stage,
        leadPriority,
        leadValue: Number(leadValue) || 0,
        expectedRevenue: Number(expectedRevenue) || Number(leadValue) || 0,
        projectScope: projectScope.trim(),
        gstNo: gstNo.trim(),
      };

      const res = await fetch(`/crmtesting/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMsg(json.error || "Failed to update lead details");
        setLoading(false);
        return;
      }

      // Success
      const updated: Lead = {
        ...lead,
        ...payload,
        id: lead.id,
        leadNumber: lead.leadNumber,
      };

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Network error updating lead");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fade-in z-[101]"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-[102] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Edit Lead Details
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {lead.leadNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sales reps & admins can modify any lead specifications, pricing, and pipeline stage.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Company Name & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                Company / Prospect Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme Technologies"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                Contact Person *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Rakesh Shrivastav"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Row 2: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-500" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rakesh@example.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Row 3: Pipeline Stage & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Pipeline Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-semibold"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">
                Lead Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORITIES.map((p) => {
                  const isSelected = leadPriority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLeadPriority(p.id)}
                      className={`py-2.5 rounded-xl font-mono text-[11px] font-bold uppercase transition-all border ${
                        isSelected
                          ? p.id === "HOT"
                            ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                            : p.id === "HIGH"
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : p.id === "MEDIUM"
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                            : "bg-slate-600 text-white border-slate-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 4: Deal Value & Expected Revenue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                Estimated Deal Value (₹) *
              </label>
              <input
                type="number"
                required
                value={leadValue}
                onChange={(e) => setLeadValue(e.target.value)}
                placeholder="250000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                Expected Revenue (₹)
              </label>
              <input
                type="number"
                value={expectedRevenue}
                onChange={(e) => setExpectedRevenue(e.target.value)}
                placeholder="250000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono font-bold"
              />
            </div>
          </div>

          {/* Row 5: GST Number */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              GST / Tax Number (Optional)
            </label>
            <input
              type="text"
              value={gstNo}
              onChange={(e) => setGstNo(e.target.value)}
              placeholder="e.g. 27AADCB2230M1Z2"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-mono"
            />
          </div>

          {/* Row 6: Project Scope & Details */}
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Project Details / Service Scope
            </label>
            <textarea
              value={projectScope}
              onChange={(e) => setProjectScope(e.target.value)}
              placeholder="e.g. Complete ERP overhaul, custom ecommerce store, mobile apps..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 shadow-sm transition-all flex items-center gap-2"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
