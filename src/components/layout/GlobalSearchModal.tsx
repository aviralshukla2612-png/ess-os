"use client";

import React, { useState } from "react";
import { Search, X, FolderKanban, Target, Users, UserCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePrototypeStore } from "@/lib/prototypeStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const { leads, clients, projects, employees } = usePrototypeStore();

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedLeads = leads.filter(
    (l) => l.clientName.toLowerCase().includes(q) || l.contactPerson.toLowerCase().includes(q) || l.leadNumber.toLowerCase().includes(q)
  );

  const matchedClients = clients.filter(
    (c) => c.companyName.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q) || c.clientCode.toLowerCase().includes(q)
  );

  const matchedProjects = projects.filter(
    (p) => p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q)
  );

  const matchedEmployees = employees.filter(
    (e) => e.name.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q) || e.employeeId.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Leads, Clients, Projects, Employees..."
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm outline-none font-medium"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Search Results Stack */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          {/* Leads */}
          {matchedLeads.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider text-slate-400 px-1">
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <span>Leads ({matchedLeads.length})</span>
              </div>
              {matchedLeads.map((l) => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {l.clientName}
                    </div>
                    <div className="text-[11px] text-slate-500">{l.contactPerson} • ₹{l.leadValue.toLocaleString("en-IN")}</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    {l.stage}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Clients */}
          {matchedClients.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider text-slate-400 px-1">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Clients ({matchedClients.length})</span>
              </div>
              {matchedClients.map((c) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {c.companyName}
                    </div>
                    <div className="text-[11px] text-slate-500">{c.contactPerson} • {c.email}</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    {c.clientCode}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Projects */}
          {matchedProjects.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider text-slate-400 px-1">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                <span>Projects ({matchedProjects.length})</span>
              </div>
              {matchedProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-500">Client: {p.clientName}</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {p.progress}%
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Employees */}
          {matchedEmployees.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider text-slate-400 px-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Employees ({matchedEmployees.length})</span>
              </div>
              {matchedEmployees.map((e) => (
                <Link
                  key={e.id}
                  href={`/employees/${e.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {e.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{e.designation} • {e.email}</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {e.employeeId}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between px-4 font-mono">
          <span>Search across ESS OS Entities</span>
          <span>ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
