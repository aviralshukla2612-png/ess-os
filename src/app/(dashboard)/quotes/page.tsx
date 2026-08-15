"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FileText, Plus, Download, Send, CheckCircle2, Sparkles, IndianRupee, Printer } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { BottomSheet } from "@/components/ui/BottomSheet";

interface QuoteItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

export default function QuotesPage() {
  const { showToast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [quoteTitle, setQuoteTitle] = useState("");
  const [taxRate, setTaxRate] = useState(18);

  const [items, setItems] = useState<QuoteItem[]>([
    { id: "1", description: "UI/UX Design & Figma Design System", qty: 1, rate: 75000 },
    { id: "2", description: "Next.js Frontend & REST API Integration", qty: 1, rate: 150000 },
    { id: "3", description: "Payment Gateway & Webhook Security", qty: 1, rate: 50000 },
  ]);

  const [quotesList, setQuotesList] = useState([
    {
      id: "QUO-2026-001",
      client: "Paramount Retail Group",
      title: "E-Commerce Mobile App & Web Storefront Proposal",
      subtotal: 275000,
      tax: 49500,
      total: 324500,
      status: "SENT",
      validUntil: "25 Aug 2026",
      createdAt: "05 Aug 2026",
    },
    {
      id: "QUO-2026-002",
      client: "Apex SaaS Cloud Inventory",
      title: "Multi-Tenant Architecture & Cloud Migration Quote",
      subtotal: 450000,
      tax: 81000,
      total: 531000,
      status: "ACCEPTED",
      validUntil: "30 Aug 2026",
      createdAt: "01 Aug 2026",
    },
  ]);

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: "Custom Software Deliverable", qty: 1, rate: 25000 },
    ]);
  };

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const newQuo = {
      id: `QUO-2026-00${quotesList.length + 1}`,
      client: clientName || "New Enterprise Client",
      title: quoteTitle || "Custom Software Development Proposal",
      subtotal,
      tax: taxAmount,
      total: grandTotal,
      status: "DRAFT",
      validUntil: "30 days from today",
      createdAt: "Today",
    };
    setQuotesList([newQuo, ...quotesList]);
    showToast(`✓ Proposal ${newQuo.id} generated for ₹${grandTotal.toLocaleString("en-IN")}`, "success");
    setIsCreateOpen(false);
    setClientName("");
    setQuoteTitle("");
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        title="Quotes & Proposals Builder"
        description="Generate itemized commercial proposals, tax breakdowns, PDF exports, and client sign-offs."
        badge="PROPOSAL SUITE"
        icon={<FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-pulse" />}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Commercial Proposal</span>
          </button>
        }
      />

      {/* Quote Registers */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Active Commercial Proposals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Generated commercial quotes linked to CRM leads.</p>
          </div>
          <span className="text-xs font-mono font-bold px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            {quotesList.length} Quotes
          </span>
        </div>

        <div className="space-y-4">
          {quotesList.map((q) => (
            <div
              key={q.id}
              className="p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all duration-200 space-y-4 shadow-xs dark:shadow-lg group"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                    {q.id}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">🏢 {q.client}</h3>
                </div>

                <span
                  className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                    q.status === "ACCEPTED"
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                      : "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20"
                  }`}
                >
                  {q.status}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{q.title}</h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Subtotal: ₹{q.subtotal.toLocaleString("en-IN")} • GST (18%): ₹{q.tax.toLocaleString("en-IN")} • Valid Until: {q.validUntil}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="font-mono font-extrabold text-lg text-slate-900 dark:text-slate-100">
                  ₹{q.total.toLocaleString("en-IN")}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => showToast(`📄 PDF Export generated for ${q.id}`, "info")}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => showToast(`✉️ Proposal ${q.id} dispatched to client contact`, "success")}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Proposal</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Proposal Sheet */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Commercial Proposal / Quote"
        subtitle="Itemized rate calculation with automatic GST computation."
      >
        <form onSubmit={handleCreateQuote} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Client Company Name</label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Apex Global Tech"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1.5">Proposal Title</label>
            <input
              type="text"
              required
              value={quoteTitle}
              onChange={(e) => setQuoteTitle(e.target.value)}
              placeholder="e.g. Custom Web Platform Development"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
              <span>Itemized Deliverables</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, description: val } : i)));
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Qty</label>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 1;
                        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty: val } : i)));
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono">Rate (₹)</label>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, rate: val } : i)));
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Calculation */}
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>GST (18%):</span>
              <span>₹{taxAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-100 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-sm transition-all mt-2"
          >
            Generate & Save Proposal
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
