"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { IndianRupee, Plus, AlertCircle, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

export default function FinancePage() {
  const { showToast } = useToast();
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invAmount, setInvAmount] = useState("");
  const [financeMetrics, setFinanceMetrics] = useState<{
    totalContractedRevenue: number;
    totalCollectedRevenue: number;
    totalPendingCollection: number;
    invoices: any[];
  }>({
    totalContractedRevenue: 23720000,
    totalCollectedRevenue: 2200000,
    totalPendingCollection: 320000,
    invoices: [],
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const res = await fetch("/mdz-os/api/finance");
      const json = await res.json();
      if (json.success && json.data) {
        setFinanceMetrics({
          totalContractedRevenue: json.data.metrics?.totalBilling || 0,
          totalCollectedRevenue: json.data.metrics?.paidBilling || 0,
          totalPendingCollection: (json.data.metrics?.pendingBilling || 0) + (json.data.metrics?.overdueBilling || 0),
          invoices: Array.isArray(json.data.invoices) ? json.data.invoices : [],
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`✓ Invoice INV-2026-004 generated for ₹${invAmount || "1,00,000"}`, "success");
    setIsInvoiceOpen(false);
    setInvAmount("");
  };

  const milestones = financeMetrics.invoices.length > 0
    ? financeMetrics.invoices.map((inv) => ({
        id: inv.id,
        project: inv.project?.name || "ABC E-Commerce Storefront",
        title: `Milestone Invoice ${inv.invoiceNumber}`,
        amount: `₹${inv.grandTotal?.toLocaleString("en-IN") || "1,00,000"}`,
        status: inv.status || "PAID",
        dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "28 Jul 2026",
        invoiceNumber: inv.invoiceNumber,
      }))
    : [
        {
          id: "MS-001",
          project: "ABC E-Commerce Storefront",
          title: "Milestone 1: Project Advance",
          amount: "₹1,00,000",
          status: "PAID",
          dueDate: "01 Jul 2026",
          invoiceNumber: "INV-2026-001",
        },
        {
          id: "MS-002",
          project: "ABC E-Commerce Storefront",
          title: "Milestone 2: Design Signoff",
          amount: "₹1,00,000",
          status: "OVERDUE",
          dueDate: "28 Jul 2026",
          invoiceNumber: "INV-2026-002",
        },
        {
          id: "MS-003",
          project: "Apex SaaS Cloud Inventory",
          title: "Milestone 1: Advance Signoff",
          amount: "₹2,00,000",
          status: "PENDING",
          dueDate: "15 Aug 2026",
          invoiceNumber: "INV-2026-003",
        },
      ];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Finance & Invoices"
        description="Project payment milestones, invoice tracking, collection schedules, and revenue receipts."
        badge="FINANCIAL CONTROL"
        icon={<IndianRupee className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <button
            onClick={() => setIsInvoiceOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Invoice</span>
          </button>
        }
      />

      <BottomSheet
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        title="Create New Milestone Invoice"
        subtitle="Generate milestone payment invoice and link to client portal."
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Invoice Amount (₹)</label>
            <input
              type="number"
              required
              value={invAmount}
              onChange={(e) => setInvAmount(e.target.value)}
              placeholder="100000"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Generate Invoice PDF & Send to Client
          </button>
        </form>
      </BottomSheet>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2 group hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Contracted Revenue</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            ₹{(financeMetrics.totalContractedRevenue / 100000).toFixed(1)} Lakh
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Enterprise Contracts</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2 group hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Collected</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{(financeMetrics.totalCollectedRevenue / 100000).toFixed(1)} Lakh
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cleared Milestones</div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl space-y-2 group hover:-translate-y-1 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Collections</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            ₹{(financeMetrics.totalPendingCollection / 100000).toFixed(1)} Lakh
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overdue & Upcoming</div>
        </div>
      </div>

      {/* Payment Milestones Log */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Project Payment Milestones Log
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">All payment receipts and invoice registers.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            {milestones.length} Invoices
          </span>
        </div>

        <div className="space-y-4 text-xs">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 shadow-xs dark:shadow-lg hover:border-indigo-500/40 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                    {m.invoiceNumber}
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{m.title}</h4>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">📌 {m.project} • Due: {m.dueDate}</div>
              </div>

              <div className="text-right space-y-1">
                <div className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">{m.amount}</div>
                <span
                  className={`text-[10px] font-bold px-3 py-1 rounded-full border font-mono uppercase tracking-wider ${
                    m.status === "PAID"
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                      : m.status === "OVERDUE"
                      ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                      : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20"
                  }`}
                >
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
